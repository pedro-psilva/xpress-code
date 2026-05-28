import { useEffect, useState } from 'react';

import { getErrorMessage } from '@/api/client';
import { listarUsuarios, removerUsuario } from '@/api/usuarios';
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

const PERFIL_TOM = { admin: 'purple', profissional: 'blue', cliente: 'slate' };

export default function UsuariosListScreen() {
  const { isAdmin } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    listarUsuarios()
      .then(setUsuarios)
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  async function handleRemover(id) {
    if (!(await confirmar('Remover este usuário?'))) return;
    try {
      await removerUsuario(id);
      setUsuarios((atual) => atual.filter((u) => u.id !== id));
    } catch (e) {
      setErro(getErrorMessage(e));
    }
  }

  const colunas = [
    { key: 'nome', header: 'Nome', render: (u) => <Cell strong>{u.nome}</Cell> },
    { key: 'email', header: 'E-mail', flex: 1.4, render: (u) => <Cell muted>{u.email}</Cell> },
    {
      key: 'perfil',
      header: 'Perfil',
      flex: 0.8,
      render: (u) => <Badge label={u.perfil} tone={PERFIL_TOM[u.perfil]} />,
    },
    ...(isAdmin
      ? [
          {
            key: 'acoes',
            header: '',
            flex: 0.5,
            render: (u) => (
              <IconButton
                icon="trash-outline"
                variant="danger"
                label="Remover usuário"
                onPress={() => handleRemover(u.id)}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <Screen>
      <PageHeader
        title="Usuários"
        subtitle="Clientes, profissionais e administradores."
        action={isAdmin ? <LinkButton href="/usuarios/novo" title="+ Novo" /> : null}
      />
      <ErrorBanner message={erro} />
      {loading ? (
        <Loading />
      ) : usuarios.length === 0 ? (
        <EmptyState message="Nenhum usuário cadastrado ainda." />
      ) : (
        <Table columns={colunas} rows={usuarios} keyExtractor={(u) => u.id} />
      )}
    </Screen>
  );
}
