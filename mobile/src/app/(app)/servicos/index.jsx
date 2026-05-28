import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { getErrorMessage } from '@/api/client';
import { listarServicos } from '@/api/servicos';
import { useAuth } from '@/auth/auth-context';
import {
  Badge,
  Cell,
  EmptyState,
  ErrorBanner,
  LinkButton,
  Loading,
  PageHeader,
  Screen,
  Table,
} from '@/components/ui';
import { formatarPreco } from '@/lib/format';

export default function ServicosListScreen() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    listarServicos()
      .then(setServicos)
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const colunas = [
    { key: 'nome', header: 'Nome', render: (s) => <Cell strong>{s.nome}</Cell> },
    { key: 'preco', header: 'Preço', flex: 0.8, render: (s) => <Cell>{formatarPreco(s.preco)}</Cell> },
    { key: 'duracao', header: 'Duração', flex: 0.8, render: (s) => <Cell>{s.duracao_minutos} min</Cell> },
    {
      key: 'status',
      header: 'Status',
      flex: 0.8,
      render: (s) => (
        <Badge label={s.ativo ? 'Ativo' : 'Inativo'} tone={s.ativo ? 'green' : 'slate'} />
      ),
    },
  ];

  return (
    <Screen>
      <PageHeader
        title="Serviços"
        subtitle="Catálogo de serviços oferecidos."
        action={isAdmin ? <LinkButton href="/servicos/novo" title="+ Novo" /> : null}
      />
      <ErrorBanner message={erro} />
      {loading ? (
        <Loading />
      ) : servicos.length === 0 ? (
        <EmptyState message="Nenhum serviço cadastrado ainda." />
      ) : (
        <Table
          columns={colunas}
          rows={servicos}
          keyExtractor={(s) => s.id}
          onRowPress={(s) => router.push(`/servicos/${s.id}`)}
        />
      )}
    </Screen>
  );
}
