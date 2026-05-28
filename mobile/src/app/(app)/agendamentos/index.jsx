import { useEffect, useState } from 'react';

import { cancelarAgendamento, listarAgendamentos } from '@/api/agendamentos';
import { getErrorMessage } from '@/api/client';
import { listarServicos } from '@/api/servicos';
import { listarUsuarios } from '@/api/usuarios';
import {
  Badge,
  Cell,
  EmptyState,
  ErrorBanner,
  IconButton,
  LinkButton,
  Loading,
  PageHeader,
  Screen,
  Table,
} from '@/components/ui';
import { confirmar } from '@/lib/confirm';
import { formatarDataHora } from '@/lib/format';

const STATUS_TOM = { agendado: 'blue', concluido: 'green', cancelado: 'slate' };

export default function AgendamentosListScreen() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [nomes, setNomes] = useState({});
  const [servicos, setServicos] = useState({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([listarAgendamentos(), listarUsuarios(), listarServicos()])
      .then(([ags, us, svs]) => {
        setAgendamentos(ags);
        setNomes(Object.fromEntries(us.map((u) => [u.id, u.nome])));
        setServicos(Object.fromEntries(svs.map((s) => [s.id, s.nome])));
      })
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancelar(id) {
    if (!(await confirmar('Cancelar este agendamento?'))) return;
    try {
      await cancelarAgendamento(id);
      setAgendamentos((atual) =>
        atual.map((a) => (a.id === id ? { ...a, status: 'cancelado' } : a)),
      );
    } catch (e) {
      setErro(getErrorMessage(e));
    }
  }

  const colunas = [
    {
      key: 'inicio',
      header: 'Início',
      flex: 1.2,
      render: (a) => <Cell>{formatarDataHora(a.data_hora_inicio)}</Cell>,
    },
    { key: 'cliente', header: 'Cliente', render: (a) => <Cell>{nomes[a.cliente_id] || '—'}</Cell> },
    {
      key: 'profissional',
      header: 'Profissional',
      render: (a) => <Cell>{nomes[a.profissional_id] || '—'}</Cell>,
    },
    { key: 'servico', header: 'Serviço', render: (a) => <Cell>{servicos[a.servico_id] || '—'}</Cell> },
    {
      key: 'status',
      header: 'Status',
      flex: 0.8,
      render: (a) => <Badge label={a.status} tone={STATUS_TOM[a.status]} />,
    },
    {
      key: 'acoes',
      header: '',
      flex: 0.5,
      render: (a) =>
        a.status === 'agendado' ? (
          <IconButton
            icon="close-outline"
            variant="danger"
            label="Cancelar agendamento"
            onPress={() => handleCancelar(a.id)}
          />
        ) : null,
    },
  ];

  return (
    <Screen>
      <PageHeader
        title="Agendamentos"
        subtitle="Marcações de horário da barbearia."
        action={<LinkButton href="/agendamentos/novo" title="+ Novo" />}
      />
      <ErrorBanner message={erro} />
      {loading ? (
        <Loading />
      ) : agendamentos.length === 0 ? (
        <EmptyState message="Nenhum agendamento ainda." />
      ) : (
        <Table columns={colunas} rows={agendamentos} keyExtractor={(a) => a.id} />
      )}
    </Screen>
  );
}
