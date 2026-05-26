import { useEffect, useState } from 'react'
import { listarAgendamentos } from '../../api/agendamentos'
import { listarUsuarios } from '../../api/usuarios'
import { listarServicos } from '../../api/servicos'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import {
  PageHeader,
  LinkButton,
  Card,
  Loading,
  ErrorBanner,
  EmptyState,
} from '../../components/ui'
import { formatarDataHora, porInicio } from './utils'

/** Fluxo de marcação do cliente: chamada para agendar, próximos horários
 *  marcados e o catálogo de serviços disponíveis. */
export default function ClienteDashboard() {
  const { userId } = useAuth()
  const [proximos, setProximos] = useState([])
  const [nomes, setNomes] = useState({})
  const [servicoNomes, setServicoNomes] = useState({})
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([
      listarAgendamentos({ cliente_id: userId }),
      listarUsuarios(),
      listarServicos(),
    ])
      .then(([ags, us, svs]) => {
        const agora = new Date()
        setProximos(
          ags
            .filter(
              (a) => a.status !== 'cancelado' && new Date(a.data_hora_inicio) >= agora,
            )
            .sort(porInicio),
        )
        setNomes(Object.fromEntries(us.map((u) => [u.id, u.nome])))
        setServicoNomes(Object.fromEntries(svs.map((s) => [s.id, s.nome])))
        setServicos(svs.filter((s) => s.ativo))
      })
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <Loading />

  return (
    <div>
      <PageHeader
        title="Agende seu horário"
        subtitle="Escolha um serviço e marque com o seu profissional."
        action={<LinkButton to="/agendamentos/novo">+ Agendar horário</LinkButton>}
      />
      <ErrorBanner message={erro} />

      <h2 className="text-lg font-semibold text-slate-800 mb-3">Meus próximos horários</h2>
      {proximos.length === 0 ? (
        <EmptyState message="Você não tem horários marcados. Que tal agendar um?" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 mb-8">
          {proximos.map((a) => (
            <Card key={a.id} className="p-4">
              <p className="text-sm font-semibold text-slate-800">
                {servicoNomes[a.servico_id] || 'Serviço'}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {formatarDataHora(a.data_hora_inicio)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                com {nomes[a.profissional_id] || 'profissional'}
              </p>
            </Card>
          ))}
        </div>
      )}

      <h2 className="text-lg font-semibold text-slate-800 mb-3">Serviços disponíveis</h2>
      {servicos.length === 0 ? (
        <EmptyState message="Nenhum serviço disponível no momento." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {servicos.map((s) => (
            <Card key={s.id} className="p-4">
              <p className="text-sm font-semibold text-slate-800">{s.nome}</p>
              <p className="mt-1 text-sm text-slate-600">
                R$ {Number(s.preco).toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-slate-400">{s.duracao_minutos} min</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
