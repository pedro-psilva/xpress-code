import { useEffect, useState } from 'react'
import { listarUsuarios, removerUsuario } from '../../api/usuarios'
import { getErrorMessage } from '../../api/client'
import {
  PageHeader,
  LinkButton,
  Button,
  Card,
  Loading,
  ErrorBanner,
  EmptyState,
} from '../../components/ui'

const perfilCor = {
  admin: 'bg-purple-50 text-purple-700',
  profissional: 'bg-blue-50 text-blue-700',
  cliente: 'bg-slate-100 text-slate-600',
}

export default function UsuariosList() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  function carregar() {
    setLoading(true)
    listarUsuarios()
      .then(setUsuarios)
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(carregar, [])

  async function handleRemover(id) {
    if (!confirm('Remover este usuário?')) return
    try {
      await removerUsuario(id)
      setUsuarios((us) => us.filter((u) => u.id !== id))
    } catch (e) {
      setErro(getErrorMessage(e))
    }
  }

  return (
    <div>
      <PageHeader
        title="Usuários"
        subtitle="Clientes, profissionais e administradores."
        action={<LinkButton to="/usuarios/novo">+ Novo usuário</LinkButton>}
      />
      <ErrorBanner message={erro} />
      {loading ? (
        <Loading />
      ) : usuarios.length === 0 ? (
        <EmptyState message="Nenhum usuário cadastrado ainda." />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Perfil</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        perfilCor[u.perfil] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.perfil}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="danger" onClick={() => handleRemover(u.id)}>
                      Remover
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
