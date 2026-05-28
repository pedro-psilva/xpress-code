import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import {
  concluirAgendamento,
  listarAgendamentos,
  naoCompareceuAgendamento,
} from '@/api/agendamentos';
import { getErrorMessage } from '@/api/client';
import { listarServicos } from '@/api/servicos';
import { listarUsuarios } from '@/api/usuarios';
import { useAuth } from '@/auth/auth-context';
import {
  Badge,
  Cell,
  EmptyState,
  ErrorBanner,
  IconButton,
  LinkButton,
  Loading,
  PageHeader,
  StatCard,
  Table,
} from '@/components/ui';
import { confirmar } from '@/lib/confirm';
import {
  ehHoje,
  ehMesAtual,
  ehPassado,
  formatarHora,
  formatarPreco,
  porInicio,
} from '@/lib/format';

const STATUS_TOM = {
  agendado: 'blue',
  concluido: 'green',
  cancelado: 'slate',
  no_show: 'red',
};

const STATUS_LABEL = {
  agendado: 'agendado',
  concluido: 'concluído',
  cancelado: 'cancelado',
  no_show: 'não compareceu',
};

export default function AdminDashboard() {
  const { perfil, userId } = useAuth();
  const ehProfissional = perfil === 'profissional';

  const [agendamentos, setAgendamentos] = useState([]);
  const [nomes, setNomes] = useState({});
  const [servicosMap, setServicosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const filtro = ehProfissional ? { profissional_id: userId } : {};
    Promise.all([listarAgendamentos(filtro), listarUsuarios(), listarServicos()])
      .then(([ags, us, svs]) => {
        setAgendamentos(ags);
        setNomes(Object.fromEntries(us.map((u) => [u.id, u.nome])));
        setServicosMap(Object.fromEntries(svs.map((s) => [s.id, s])));
      })
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [ehProfissional, userId]);

  function aplicarStatus(id, novoStatus) {
    setAgendamentos((atual) =>
      atual.map((a) => (a.id === id ? { ...a, status: novoStatus } : a)),
    );
  }

  async function handleConcluir(id) {
    if (!(await confirmar('Marcar como concluído? Entra no balanço financeiro.'))) return;
    try {
      await concluirAgendamento(id);
      aplicarStatus(id, 'concluido');
    } catch (e) {
      setErro(getErrorMessage(e));
    }
  }

  async function handleNoShow(id) {
    if (!(await confirmar('Marcar que o cliente não compareceu?'))) return;
    try {
      await naoCompareceuAgendamento(id);
      aplicarStatus(id, 'no_show');
    } catch (e) {
      setErro(getErrorMessage(e));
    }
  }

  if (loading) return <Loading />;

  const precoDoAgendamento = (a) => Number(servicosMap[a.servico_id]?.preco ?? 0);
  const somaReceita = (lista) => lista.reduce((acc, a) => acc + precoDoAgendamento(a), 0);

  const concluidos = agendamentos.filter((a) => a.status === 'concluido');
  const aguardandoConfirmacao = agendamentos
    .filter((a) => a.status === 'agendado' && ehPassado(a.data_hora_inicio))
    .sort(porInicio);
  const agendaHoje = agendamentos
    .filter((a) => a.status === 'agendado' && ehHoje(a.data_hora_inicio))
    .sort(porInicio);
  const emAberto = agendamentos.filter((a) => a.status === 'agendado').length;

  const receitaHoje = somaReceita(concluidos.filter((a) => ehHoje(a.data_hora_inicio)));
  const receitaMes = somaReceita(concluidos.filter((a) => ehMesAtual(a.data_hora_inicio)));

  const colunasAgenda = [
    {
      key: 'hora',
      header: 'Hora',
      flex: 0.7,
      render: (a) => <Cell strong>{formatarHora(a.data_hora_inicio)}</Cell>,
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (a) => <Cell>{nomes[a.cliente_id] || '—'}</Cell>,
    },
    ...(ehProfissional
      ? []
      : [
          {
            key: 'profissional',
            header: 'Profissional',
            render: (a) => <Cell>{nomes[a.profissional_id] || '—'}</Cell>,
          },
        ]),
    {
      key: 'servico',
      header: 'Serviço',
      render: (a) => <Cell>{servicosMap[a.servico_id]?.nome || '—'}</Cell>,
    },
    {
      key: 'status',
      header: 'Status',
      flex: 0.9,
      render: (a) => (
        <Badge label={STATUS_LABEL[a.status] ?? a.status} tone={STATUS_TOM[a.status]} />
      ),
    },
  ];

  const colunasPendentes = [
    {
      key: 'inicio',
      header: 'Atendimento',
      flex: 1.2,
      render: (a) => (
        <View>
          <Cell strong>{formatarHora(a.data_hora_inicio)}</Cell>
          <Cell muted>{servicosMap[a.servico_id]?.nome || '—'}</Cell>
        </View>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (a) => <Cell>{nomes[a.cliente_id] || '—'}</Cell>,
    },
    {
      key: 'preco',
      header: 'Valor',
      flex: 0.6,
      render: (a) => <Cell strong>{formatarPreco(precoDoAgendamento(a))}</Cell>,
    },
    {
      key: 'acoes',
      header: '',
      flex: 0.9,
      render: (a) => (
        <View className="flex-row gap-2">
          <IconButton
            icon="checkmark-outline"
            variant="success"
            label="Confirmar atendimento"
            onPress={() => handleConcluir(a.id)}
          />
          <IconButton
            icon="person-remove-outline"
            variant="danger"
            label="Cliente não compareceu"
            onPress={() => handleNoShow(a.id)}
          />
        </View>
      ),
    },
  ];

  return (
    <View>
      <PageHeader
        title={ehProfissional ? 'Minha agenda' : 'Painel de gestão'}
        subtitle={
          ehProfissional
            ? 'Seus atendimentos e o seu faturamento.'
            : 'Visão geral da operação e do faturamento.'
        }
        action={<LinkButton href="/agendamentos/novo" title="+ Novo" />}
      />
      <ErrorBanner message={erro} />

      <View className="mb-8 flex-row flex-wrap gap-4">
        <StatCard label="Receita hoje" value={formatarPreco(receitaHoje)} />
        <StatCard label="Receita do mês" value={formatarPreco(receitaMes)} />
        <StatCard
          label="Aguardando confirmação"
          value={aguardandoConfirmacao.length}
          hint={aguardandoConfirmacao.length > 0 ? 'Confirme abaixo' : 'Nada pendente'}
        />
        <StatCard label="Marcações em aberto" value={emAberto} />
      </View>

      {aguardandoConfirmacao.length > 0 ? (
        <View className="mb-8">
          <Text className="mb-3 text-lg font-semibold text-slate-800 dark:text-stone-100">
            Aguardando confirmação
          </Text>
          <Table
            columns={colunasPendentes}
            rows={aguardandoConfirmacao}
            keyExtractor={(a) => a.id}
          />
        </View>
      ) : null}

      <Text className="mb-3 text-lg font-semibold text-slate-800 dark:text-stone-100">
        Agenda de hoje
      </Text>
      {agendaHoje.length === 0 ? (
        <EmptyState message="Nenhum atendimento agendado para hoje." />
      ) : (
        <Table columns={colunasAgenda} rows={agendaHoje} keyExtractor={(a) => a.id} />
      )}
    </View>
  );
}
