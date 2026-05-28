import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  cancelarAgendamento,
  concluirAgendamento,
  listarAgendamentos,
  naoCompareceuAgendamento,
} from '@/api/agendamentos';
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

function ehPassado(iso) {
  return new Date(iso) < new Date();
}

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

  function aplicarStatus(id, novoStatus) {
    setAgendamentos((atual) =>
      atual.map((a) => (a.id === id ? { ...a, status: novoStatus } : a)),
    );
  }

  async function handleCancelar(id) {
    if (!(await confirmar('Cancelar este agendamento?'))) return;
    try {
      await cancelarAgendamento(id);
      aplicarStatus(id, 'cancelado');
    } catch (e) {
      setErro(getErrorMessage(e));
    }
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
      flex: 0.9,
      render: (a) => <Badge label={STATUS_LABEL[a.status] ?? a.status} tone={STATUS_TOM[a.status]} />,
    },
    {
      key: 'acoes',
      header: '',
      flex: 0.9,
      render: (a) => {
        if (a.status !== 'agendado') return null;
        const passado = ehPassado(a.data_hora_inicio);
        return (
          <View className="flex-row gap-2">
            {passado ? (
              <>
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
              </>
            ) : (
              <IconButton
                icon="close-outline"
                variant="danger"
                label="Cancelar agendamento"
                onPress={() => handleCancelar(a.id)}
              />
            )}
          </View>
        );
      },
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
