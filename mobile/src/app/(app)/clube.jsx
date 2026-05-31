import { Ionicons } from '@expo/vector-icons';
import { Text, useWindowDimensions, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import {
  Badge,
  Card,
  Cell,
  EmptyState,
  PageHeader,
  Screen,
  StatCard,
  Table,
} from '@/components/ui';
import { formatarData, formatarPreco } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';

const PLANOS = {
  uau: {
    nome: 'UAU',
    preco: 89,
    frequencia: '2x no mês',
    desconto_extras: 0,
    descricao: 'Plano básico — manter o visual alinhado.',
  },
  flex: {
    nome: 'Flex',
    preco: 149,
    frequencia: '1x por semana (4x no mês)',
    desconto_extras: 5,
    descricao: 'Intermediário — visual sempre na régua.',
  },
  essencial: {
    nome: 'Essencial',
    preco: 229,
    frequencia: 'ilimitado (seg–qui)',
    desconto_extras: 10,
    descricao: 'Top — prioridade máxima e atendimentos sem limite.',
  },
};

const STATUS_TOM = { ativo: 'green', pendente: 'brand', inativo: 'slate' };
const STATUS_LABEL = { ativo: 'ativo', pendente: 'pagamento pendente', inativo: 'inativo' };

const ASSINATURAS_MOCK = [
  { id: 'a01', cliente: 'Lucas Andrade', plano: 'flex', status: 'ativo', proxima_cobranca: '2026-06-08' },
  { id: 'a02', cliente: 'Rafael Oliveira', plano: 'essencial', status: 'ativo', proxima_cobranca: '2026-06-12' },
  { id: 'a03', cliente: 'Pedro Henrique Costa', plano: 'uau', status: 'ativo', proxima_cobranca: '2026-06-15' },
  { id: 'a04', cliente: 'Matheus Rocha', plano: 'flex', status: 'pendente', proxima_cobranca: '2026-05-22' },
  { id: 'a05', cliente: 'Bruno Carvalho', plano: 'uau', status: 'ativo', proxima_cobranca: '2026-06-03' },
  { id: 'a06', cliente: 'Felipe Souza', plano: 'flex', status: 'ativo', proxima_cobranca: '2026-06-20' },
  { id: 'a07', cliente: 'Gabriel Lima', plano: 'essencial', status: 'pendente', proxima_cobranca: '2026-05-18' },
  { id: 'a08', cliente: 'Diego Martins', plano: 'uau', status: 'inativo', proxima_cobranca: null },
  { id: 'a09', cliente: 'Vinícius Pereira', plano: 'flex', status: 'ativo', proxima_cobranca: '2026-06-25' },
  { id: 'a10', cliente: 'Thiago Resende', plano: 'uau', status: 'inativo', proxima_cobranca: null },
];

const ORDEM_STATUS = { pendente: 0, ativo: 1, inativo: 2 };
const ASSINATURAS_ORDENADAS = [...ASSINATURAS_MOCK].sort(
  (a, b) => ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status] || a.cliente.localeCompare(b.cliente),
);

function valorMensal(a) {
  return PLANOS[a.plano]?.preco ?? 0;
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

function PlanoResumo({ plano, estreito }) {
  return (
    <Card className="flex-1 p-4" style={estreito ? undefined : { minWidth: 220 }}>
      <Text className="text-base font-semibold text-slate-800 dark:text-stone-100">
        {plano.nome}
      </Text>
      <Text className="mt-0.5 text-xs text-slate-500 dark:text-stone-400">
        {plano.frequencia} · seg–qui
      </Text>
      <Text className="mt-3 text-xl font-bold text-slate-800 dark:text-stone-100">
        {formatarPreco(plano.preco)}
        <Text className="text-sm font-normal text-slate-500 dark:text-stone-400">/mês</Text>
      </Text>
      <Text className="mt-1 text-xs text-slate-500 dark:text-stone-400">
        {plano.desconto_extras > 0
          ? `${plano.desconto_extras}% off em serviços extras`
          : 'sem desconto extras'}
      </Text>
    </Card>
  );
}

export default function ClubeScreen() {
  const { isAdmin } = useAuth();
  const { tema } = useTheme();
  const { width } = useWindowDimensions();
  const estreito = width < 640;

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

  const ativos = ASSINATURAS_MOCK.filter((a) => a.status === 'ativo');
  const pendentes = ASSINATURAS_MOCK.filter((a) => a.status === 'pendente');
  const mrr = ativos.reduce((acc, a) => acc + valorMensal(a), 0);
  const emAtraso = pendentes.reduce((acc, a) => acc + valorMensal(a), 0);

  const colunas = [
    {
      key: 'cliente',
      header: 'Cliente',
      flex: 1.4,
      render: (a) => <Cell strong>{a.cliente}</Cell>,
    },
    {
      key: 'plano',
      header: 'Plano',
      render: (a) => <Cell>{PLANOS[a.plano]?.nome ?? a.plano}</Cell>,
    },
    {
      key: 'status',
      header: 'Status',
      flex: 1.1,
      render: (a) => <Badge label={STATUS_LABEL[a.status]} tone={STATUS_TOM[a.status]} />,
    },
    {
      key: 'valor',
      header: 'Mensalidade',
      flex: 0.9,
      render: (a) => <Cell strong>{formatarPreco(valorMensal(a))}</Cell>,
    },
    {
      key: 'proxima',
      header: 'Próx. cobrança',
      flex: 0.9,
      render: (a) =>
        a.proxima_cobranca ? (
          <Cell muted={a.status === 'inativo'}>{formatarData(a.proxima_cobranca)}</Cell>
        ) : (
          <Cell muted>—</Cell>
        ),
    },
  ];

  return (
    <Screen>
      <PageHeader
        title="Clube Xpress"
        subtitle="Assinaturas mensais dos clientes da barbearia."
        action={<Badge label="demonstração" tone="brand" />}
      />

      <InfoBanner tema={tema}>
        <Text className="text-sm font-semibold text-slate-800 dark:text-stone-100">
          Em breve: cobrança automática via InfinitePay
        </Text>
        <Text className="mt-1 text-sm text-slate-600 dark:text-stone-300">
          Os dados desta tela são fictícios. Quando as credenciais da InfinitePay forem
          configuradas (variáveis INFINITEPAY_* no .env do backend), a lista passa a
          refletir as assinaturas reais e o status do pagamento.
        </Text>
      </InfoBanner>

      <View className="mb-8 flex-row flex-wrap gap-4">
        <StatCard
          label="Assinantes ativos"
          value={ativos.length}
          hint={`em ${ASSINATURAS_MOCK.length} cadastrados`}
        />
        <StatCard
          label="Pagamento pendente"
          value={pendentes.length}
          hint={emAtraso > 0 ? `${formatarPreco(emAtraso)} em atraso` : 'nenhum em atraso'}
        />
        <StatCard label="MRR" value={formatarPreco(mrr)} hint="receita recorrente / mês" />
      </View>

      <Text className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-stone-400">
        Planos do clube
      </Text>
      <View className="mb-8 flex-row flex-wrap gap-3">
        {Object.values(PLANOS).map((p) => (
          <PlanoResumo key={p.nome} plano={p} estreito={estreito} />
        ))}
      </View>

      <Text className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-stone-400">
        Assinantes
      </Text>
      {ASSINATURAS_ORDENADAS.length === 0 ? (
        <EmptyState message="Nenhuma assinatura cadastrada ainda." />
      ) : (
        <Table
          columns={colunas}
          rows={ASSINATURAS_ORDENADAS}
          keyExtractor={(a) => a.id}
        />
      )}
    </Screen>
  );
}
