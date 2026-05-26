import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarServicos } from '../../api/servicos'
import { getErrorMessage } from '../../api/client'
import {
  PageHeader,
  LinkButton,
  Card,
  Loading,
  ErrorBanner,
  EmptyState,
} from '../../components/ui'

export default function ServicosList() {
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    listarServicos()
      .then(setServicos)
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader
        title="Serviços"
        subtitle="Catálogo de serviços oferecidos."
        action={<LinkButton to="/servicos/novo">+ Novo serviço</LinkButton>}
      />
      <ErrorBanner message={erro} />
      {loading ? (
        <Loading />
      ) : servicos.length === 0 ? (
        <EmptyState message="Nenhum serviço cadastrado ainda." />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium">Duração</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {servicos.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/servicos/${s.id}`)}
                  className="border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{s.nome}</td>
                  <td className="px-4 py-3">R$ {s.preco.toFixed(2)}</td>
                  <td className="px-4 py-3">{s.duracao_minutos} min</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.ativo
                          ? 'bg-green-50 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {s.ativo ? 'Ativo' : 'Inativo'}
                    </span>
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
