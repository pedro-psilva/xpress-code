import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import {
  atualizarStatusAssinatura,
  gerarCobranca,
  listarAssinaturas,
  removerAssinatura,
} from '@/api/assinaturas';
import { getErrorMessage } from '@/api/client';
import { listarPlanos } from '@/api/planos';
import { listarUsuarios } from '@/api/usuarios';
import { useAuth } from '@/auth/auth-context';
import {
  Badge,
  Card,
  Cell,
  EmptyState,
  ErrorBanner,
  IconButton,
  LinkButton,
  Loading,
  PageHeader,
  Screen,
  StatCard,
  Table,
} from '@/components/ui';
import { confirmar, escolher } from '@/lib/confirm';
import { formatarData, formatarPreco } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';

const STATUS_TOM = { ativa: 'green', pendente: 'brand', inativa: 'slate' };
const STATUS_LABEL = { ativa: 'ativa', pendente: 'pagamento pendente', inativa: 'inativa' };
const ORDEM_STATUS = { pendente: 0, ativa: 1, inativa: 2 };

function valorMensal(assinatura, mapaPlanos) {
  const p = mapaPlanos[assinatura.plano_id];
  if (!p) return 0;
  return assinatura.inclui_barba ? p.preco_corte_barba : p.preco_corte;
}

function nomePlano(assinatura, mapaPlanos) {
  const p = mapaPlanos[assinatura.plano_id];
  const base = p?.nome ?? '—';
  return assinatura.inclui_barba ? `${base} + Barba` : base;
}

function InfoBanner({ tema, children }) {
  const cor = tema === 'dark' ? '#fcd34d' : '#b97e21';
  return (
    <Card className="mb-6 flex-row items-start gap-3 border-brand-200 dark:border-stone-700 bg-brand-50 dark:bg-stone-800 p-4">
      <Ionicons name="information-circle" size={22} color={cor} />
      <View className="flex-1">{children}</View>
    </Card>
  );
}

function SuccessBanner({ resultado, onFechar }) {
  if (!resultado) return null;
  return (
    <Card className="mb-4 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/60 p-4">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-sm font-semibold text-green-800 dark:text-green-200">
          Cobrança gerada
        </Text>
        <IconButton icon="close-outline" label="Fechar" onPress={onFechar} />
      </View>
      <Text
        selectable
        className="mt-2 font-mono text-xs text-green-900 dark:text-green-100"
      >
        {resultado.link}
      </Text>
      <Text className="mt-2 text-xs text-green-700 dark:text-green-300">
        Enviado: {resultado.enviado_email ? '✓ email' : '— email'}
        {' · '}
        {resultado.enviado_whatsapp ? '✓ WhatsApp' : '— WhatsApp'}
      </Text>
    </Card>
  );
}

function PlanoResumo({ plano, estreito }) {
  return (
    <Card className="flex-1 p-4" style={estreito ? undefined : { minWidth: 220 }}>
      <Text className="text-base font-semibold text-slate-800 dark:text-stone-100">
        {plano.nome}
      </Text>
      <Text className="mt-0.5 text-xs text-slate-500 dark:text-stone-400">
        {plano.frequencia}
      </Text>
      <Text className="mt-3 text-xl font-bold text-slate-800 dark:text-stone-100">
        {formatarPreco(plano.preco_corte)}
        <Text className="text-sm font-normal text-slate-500 dark:text-stone-400">/mês</Text>
      </Text>
      <Text className="text-xs text-slate-500 dark:text-stone-400">só corte</Text>
      <Text className="mt-2 text-base font-semibold text-slate-700 dark:text-stone-200">
        {formatarPreco(plano.preco_corte_barba)}
        <Text className="text-xs font-normal text-slate-500 dark:text-stone-400">/mês</Text>
      </Text>
      <Text className="text-xs text-slate-500 dark:text-stone-400">corte + barba</Text>
    </Card>
  );
}

export default function ClubeScreen() {
  const { isAdmin } = useAuth();
  const { tema } = useTheme();
  const { width } = useWindowDimensions();
  const estreito = width < 640;

  const [assinaturas, setAssinaturas] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(isAdmin);
  const [erro, setErro] = useState('');
  const [cobrando, setCobrando] = useState(null);
  const [resultadoCobranca, setResultadoCobranca] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([listarAssinaturas(), listarPlanos(), listarUsuarios()])
      .then(([asgs, pls, us]) => {
        setAssinaturas(asgs);
        setPlanos(pls);
        setClientes(us);
      })
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  function refreshAssinaturas() {
    return listarAssinaturas()
      .then(setAssinaturas)
      .catch((e) => setErro(getErrorMessage(e)));
  }

  async function handleCobrar(assinatura) {
    const nome = mapaClientes[assinatura.cliente_id] ?? 'cliente';
    const valor = valorMensal(assinatura, mapaPlanos);
    const ok = await confirmar(
      `Gerar cobrança para ${nome} no valor de ${formatarPreco(valor)}?`,
      {
        titulo: 'Gerar cobrança',
        textoConfirmar: 'Gerar e enviar',
        variant: 'primary',
      },
    );
    if (!ok) return;
    setErro('');
    setResultadoCobranca(null);
    setCobrando(assinatura.id);
    try {
      const r = await gerarCobranca(assinatura.id);
      setResultadoCobranca(r);
      await refreshAssinaturas();
    } catch (e) {
      setErro(getErrorMessage(e));
    } finally {
      setCobrando(null);
    }
  }

  async function handleRemover(id) {
    if (!(await confirmar('Remover esta assinatura?'))) return;
    try {
      await removerAssinatura(id);
      setAssinaturas((atual) => atual.filter((a) => a.id !== id));
    } catch (e) {
      setErro(getErrorMessage(e));
    }
  }

  async function handleMudarStatus(assinatura) {
    const nome = mapaClientes[assinatura.cliente_id] ?? 'cliente';
    const novo = await escolher({
      titulo: `Status — ${nome}`,
      mensagem: 'Defina o novo status da assinatura:',
      opcoes: [
        { label: 'Ativa', value: 'ativa', variant: 'primary' },
        { label: 'Pagamento pendente', value: 'pendente', variant: 'secondary' },
        { label: 'Inativa', value: 'inativa', variant: 'danger' },
      ],
    });
    if (!novo || novo === assinatura.status) return;
    try {
      const atualizado = await atualizarStatusAssinatura(assinatura.id, novo);
      setAssinaturas((atual) =>
        atual.map((a) => (a.id === assinatura.id ? atualizado : a)),
      );
    } catch (e) {
      setErro(getErrorMessage(e));
    }
  }

  if (!isAdmin) {
    return (
      <Screen>
        <PageHeader title="Clube Xpress" />
        <InfoBanner tema={tema}>
          <Text className="text-sm font-semibold text-slate-800 dark:text-stone-100">
            Acesso restrito
          </Text>
          <Text className="mt-1 text-sm text-slate-600 dark:text-stone-300">
            A gestão de assinaturas é exclusiva para administradores da barbearia.
          </Text>
        </InfoBanner>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const mapaPlanos = Object.fromEntries(planos.map((p) => [p.id, p]));
  const mapaClientes = Object.fromEntries(clientes.map((c) => [c.id, c.nome]));

  const ativas = assinaturas.filter((a) => a.status === 'ativa');
  const pendentes = assinaturas.filter((a) => a.status === 'pendente');
  const mrr = ativas.reduce((acc, a) => acc + valorMensal(a, mapaPlanos), 0);
  const emAtraso = pendentes.reduce((acc, a) => acc + valorMensal(a, mapaPlanos), 0);

  const assinaturasOrdenadas = [...assinaturas].sort((a, b) => {
    const ordA = ORDEM_STATUS[a.status] ?? 99;
    const ordB = ORDEM_STATUS[b.status] ?? 99;
    if (ordA !== ordB) return ordA - ordB;
    return (mapaClientes[a.cliente_id] || '').localeCompare(
      mapaClientes[b.cliente_id] || '',
    );
  });

  const colunas = [
    {
      key: 'cliente',
      header: 'Cliente',
      flex: 1.4,
      render: (a) => <Cell strong>{mapaClientes[a.cliente_id] ?? '—'}</Cell>,
    },
    {
      key: 'plano',
      header: 'Plano',
      flex: 1.1,
      render: (a) => <Cell>{nomePlano(a, mapaPlanos)}</Cell>,
    },
    {
      key: 'status',
      header: 'Status',
      flex: 1.1,
      render: (a) => (
        <Badge label={STATUS_LABEL[a.status] ?? a.status} tone={STATUS_TOM[a.status] ?? 'slate'} />
      ),
    },
    {
      key: 'valor',
      header: 'Mensalidade',
      flex: 0.9,
      render: (a) => <Cell strong>{formatarPreco(valorMensal(a, mapaPlanos))}</Cell>,
    },
    {
      key: 'proxima',
      header: 'Próx. cobrança',
      flex: 0.9,
      render: (a) =>
        a.proxima_cobranca ? (
          <Cell muted={a.status === 'inativa'}>{formatarData(a.proxima_cobranca)}</Cell>
        ) : (
          <Cell muted>—</Cell>
        ),
    },
    {
      key: 'cobrar',
      header: '',
      flex: 0.5,
      render: (a) => (
        <IconButton
          icon="cash-outline"
          label="Gerar cobrança"
          onPress={() => handleCobrar(a)}
          disabled={cobrando === a.id || a.status === 'inativa'}
        />
      ),
    },
    {
      key: 'mudar_status',
      header: '',
      flex: 0.5,
      render: (a) => (
        <IconButton
          icon="swap-horizontal-outline"
          label="Mudar status"
          onPress={() => handleMudarStatus(a)}
        />
      ),
    },
    {
      key: 'remover',
      header: '',
      flex: 0.5,
      render: (a) => (
        <IconButton
          icon="trash-outline"
          variant="danger"
          label="Remover assinatura"
          onPress={() => handleRemover(a.id)}
        />
      ),
    },
  ];

  return (
    <Screen>
      <PageHeader
        title="Clube Xpress"
        subtitle="Assinaturas mensais dos clientes da barbearia."
        action={<LinkButton href="/assinaturas/nova" title="+ Nova" />}
      />

      <ErrorBanner message={erro} />
      <SuccessBanner resultado={resultadoCobranca} onFechar={() => setResultadoCobranca(null)} />

      <InfoBanner tema={tema}>
        <Text className="text-sm font-semibold text-slate-800 dark:text-stone-100">
          Cobrança via InfinitePay + envio por Brevo/WhatsApp
        </Text>
        <Text className="mt-1 text-sm text-slate-600 dark:text-stone-300">
          Clique no botão de cobrar (💰) ao lado da assinatura para gerar um link
          de pagamento (Pix ou cartão) e enviar automaticamente pelo email
          (Brevo) e WhatsApp do cliente.
        </Text>
      </InfoBanner>

      <View className="mb-8 flex-row flex-wrap gap-4">
        <StatCard
          label="Assinantes ativos"
          value={ativas.length}
          hint={`em ${assinaturas.length} cadastrados`}
        />
        <StatCard
          label="Pagamento pendente"
          value={pendentes.length}
          hint={emAtraso > 0 ? `${formatarPreco(emAtraso)} em atraso` : 'nenhum em atraso'}
        />
        <StatCard label="MRR" value={formatarPreco(mrr)} hint="receita recorrente / mês" />
      </View>

      <View className="mb-3 flex-row items-center justify-between gap-3">
        <Text className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-stone-400">
          Planos do clube
        </Text>
        <LinkButton href="/planos" title="Gerenciar" variant="secondary" />
      </View>
      {planos.length === 0 ? (
        <EmptyState message='Nenhum plano cadastrado. Use "Gerenciar" para criar.' />
      ) : (
        <View className="mb-8 flex-row flex-wrap gap-3">
          {planos
            .filter((p) => p.ativo)
            .map((p) => (
              <PlanoResumo key={p.id} plano={p} estreito={estreito} />
            ))}
        </View>
      )}

      <Text className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-stone-400">
        Assinantes
      </Text>
      {assinaturasOrdenadas.length === 0 ? (
        <EmptyState message='Nenhuma assinatura ainda. Clique em "+ Nova" para cadastrar.' />
      ) : (
        <Table
          columns={colunas}
          rows={assinaturasOrdenadas}
          keyExtractor={(a) => a.id}
        />
      )}
    </Screen>
  );
}
