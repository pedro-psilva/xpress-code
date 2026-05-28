// Painel de gestão. O admin vê a operação inteira; o profissional vê apenas a
// própria agenda (filtra os agendamentos pelo seu id).
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { listarAgendamentos } from '@/api/agendamentos';
import { getErrorMessage } from '@/api/client';
import { listarServicos } from '@/api/servicos';
import { listarUsuarios } from '@/api/usuarios';
import { useAuth } from '@/auth/auth-context';
import {
  Badge,
  Cell,
  EmptyState,
  ErrorBanner,
  LinkButton,
  Loading,
  PageHeader,
  StatCard,
  Table,
} from '@/components/ui';
import { ehHoje, formatarHora, porInicio } from '@/lib/format';

const STATUS_TOM = { agendado: 'blue', concluido: 'green', cancelado: 'slate' };

export default function AdminDashboard() {
  const { perfil, userId } = useAuth();
  const ehProfissional = perfil === 'profissional';

  const [agendamentos, setAgendamentos] = useState([]);
  const [nomes, setNomes] = useState({});
  const [servicos, setServicos] = useState([]);
  const [servicoNomes, setServicoNomes] = useState({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const filtro = ehProfissional ? { profissional_id: userId } : {};
    Promise.all([listarAgendamentos(filtro), listarUsuarios(), listarServicos()])
      .then(([ags, us, svs]) => {
        setAgendamentos(ags);
        setNomes(Object.fromEntries(us.map((u) => [u.id, u.nome])));
        setServicos(svs);
        setServicoNomes(Object.fromEntries(svs.map((s) => [s.id, s.nome])));
      })
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [ehProfissional, userId]);

  if (loading) return <Loading />;

  const ativos = agendamentos.filter((a) => a.status !== 'cancelado');
  const agendaHoje = ativos.filter((a) => ehHoje(a.data_hora_inicio)).sort(porInicio);
  const servicosAtivos = servicos.filter((s) => s.ativo);
  const totalUsuarios = Object.keys(nomes).length;

  const colunas = [
    {
      key: 'hora',
      header: 'Hora',
      flex: 0.8,
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
      render: (a) => <Cell>{servicoNomes[a.servico_id] || '—'}</Cell>,
    },
    {
      key: 'status',
      header: 'Status',
      flex: 0.8,
      render: (a) => <Badge label={a.status} tone={STATUS_TOM[a.status]} />,
    },
  ];

  return (
    <View>
      <PageHeader
        title={ehProfissional ? 'Minha agenda' : 'Painel de gestão'}
        subtitle={
          ehProfissional
            ? 'Seus atendimentos do dia em um só lugar.'
            : 'Visão geral da operação da barbearia.'
        }
        action={<LinkButton href="/agendamentos/novo" title="+ Novo" />}
      />
      <ErrorBanner message={erro} />

      <View className="mb-8 flex-row flex-wrap gap-4">
        <StatCard label="Agendamentos hoje" value={agendaHoje.length} />
        <StatCard
          label="Marcações em aberto"
          value={ativos.filter((a) => a.status === 'agendado').length}
        />
        <StatCard label="Serviços ativos" value={servicosAtivos.length} />
        {ehProfissional ? null : (
          <StatCard label="Usuários cadastrados" value={totalUsuarios} />
        )}
      </View>

      <Text className="mb-3 text-lg font-semibold text-slate-800 dark:text-stone-100">
        Agenda de hoje
      </Text>
      {agendaHoje.length === 0 ? (
        <EmptyState message="Nenhum atendimento agendado para hoje." />
      ) : (
        <Table columns={colunas} rows={agendaHoje} keyExtractor={(a) => a.id} />
      )}
    </View>
  );
}
