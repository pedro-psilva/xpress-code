import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { buscarServico, desativarServico } from '../../api/servicos'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import {
  PageHeader,
  LinkButton,
  Button,
  Card,
  Loading,
  ErrorBanner,
} from '../../components/ui'

export default function ServicoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [servico, setServico] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    buscarServico(id)
      .then(setServico)
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDesativar() {
    if (!confirm('Desativar este serviço?')) return
    try {
      await desativarServico(id)
      navigate('/servicos')
    } catch (e) {
      setErro(getErrorMessage(e))
    }
  }

  if (loading) return <Loading />
  if (erro) return <ErrorBanner message={erro} />
  if (!servico) return null

  return (
    <div>
      <PageHeader
        title={servico.nome}
        action={
          isAdmin && (
            <div className="flex gap-2">
              <LinkButton to={`/servicos/${id}/editar`} variant="secondary">
                Editar
              </LinkButton>
              <Button variant="danger" onClick={handleDesativar}>
                Desativar
              </Button>
            </div>
          )
        }
      />
      <Card className="p-6 grid gap-4 sm:grid-cols-3">
        <Info label="Preço" value={`R$ ${servico.preco.toFixed(2)}`} />
        <Info label="Duração" value={`${servico.duracao_minutos} min`} />
        <Info label="Status" value={servico.ativo ? 'Ativo' : 'Inativo'} />
      </Card>
      <button
        onClick={() => navigate('/servicos')}
        className="mt-4 text-sm text-brand-700 hover:underline"
      >
        ← Voltar para a lista
      </button>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-lg font-medium text-slate-800">{value}</p>
    </div>
  )
}
