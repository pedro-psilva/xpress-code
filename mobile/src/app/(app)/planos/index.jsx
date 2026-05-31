import { useEffect, useState } from 'react';

import { getErrorMessage } from '@/api/client';
import { desativarPlano, listarPlanos } from '@/api/planos';
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
  Screen,
  Table,
} from '@/components/ui';
import { confirmar } from '@/lib/confirm';
import { formatarPreco } from '@/lib/format';

export default function PlanosListScreen() {
  const { isAdmin } = useAuth();
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    listarPlanos()
      .then(setPlanos)
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  async function handleDesativar(id) {
    if (!(await confirmar('Desativar este plano?'))) return;
    try {
      await desativarPlano(id);
      setPlanos((atual) =>
        atual.map((p) => (p.id === id ? { ...p, ativo: false } : p)),
      );
    } catch (e) {
      setErro(getErrorMessage(e));
    }
  }

  const colunas = [
    { key: 'nome', header: 'Plano', render: (p) => <Cell strong>{p.nome}</Cell> },
    {
      key: 'frequencia',
      header: 'Frequência',
      flex: 1.4,
      render: (p) => <Cell muted>{p.frequencia}</Cell>,
    },
    {
      key: 'preco_corte',
      header: 'Só corte',
      flex: 0.8,
      render: (p) => <Cell>{formatarPreco(p.preco_corte)}</Cell>,
    },
    {
      key: 'preco_corte_barba',
      header: '+ Barba',
      flex: 0.8,
      render: (p) => <Cell>{formatarPreco(p.preco_corte_barba)}</Cell>,
    },
    {
      key: 'desconto',
      header: 'Desc. extras',
      flex: 0.8,
      render: (p) =>
        p.desconto_extras > 0 ? (
          <Cell>{p.desconto_extras}%</Cell>
        ) : (
          <Cell muted>—</Cell>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      flex: 0.7,
      render: (p) => (
        <Badge label={p.ativo ? 'ativo' : 'inativo'} tone={p.ativo ? 'green' : 'slate'} />
      ),
    },
    ...(isAdmin
      ? [
          {
            key: 'acoes',
            header: '',
            flex: 1.0,
            render: (p) => (
              <Cell>
                <LinkButton
                  href={`/planos/${p.id}/editar`}
                  title="Editar"
                  variant="secondary"
                />
              </Cell>
            ),
          },
          {
            key: 'remover',
            header: '',
            flex: 0.4,
            render: (p) =>
              p.ativo ? (
                <IconButton
                  icon="trash-outline"
                  variant="danger"
                  label="Desativar plano"
                  onPress={() => handleDesativar(p.id)}
                />
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <Screen>
      <PageHeader
        title="Planos do clube"
        subtitle="Cadastro dos planos de assinatura oferecidos pela barbearia."
        action={isAdmin ? <LinkButton href="/planos/novo" title="+ Novo" /> : null}
      />
      <ErrorBanner message={erro} />
      {loading ? (
        <Loading />
      ) : planos.length === 0 ? (
        <EmptyState message="Nenhum plano cadastrado ainda." />
      ) : (
        <Table columns={colunas} rows={planos} keyExtractor={(p) => p.id} />
      )}
    </Screen>
  );
}
