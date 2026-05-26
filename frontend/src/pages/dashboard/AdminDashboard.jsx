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
  StatCard,
  Loading,
  ErrorBanner,
  EmptyState,
} from '../../components/ui'
import { ehHoje, formatarHora, porInicio } from './utils'

const statusCor = {
  agendado: 'bg-blue-50 text-blue-700',
  concluido: 'bg-green-50 text-green-700',
  cancelado: 'bg-slate-100 text-slate-500',
}

/** Painel de gestão. O admin vê a operação inteira; o profissional vê
 *  apenas a própria agenda (filtra agendamentos pelo seu id). */
export default function AdminDashboard() {
  const { perfil, userId } = useAuth()
  const ehProfissional = perfil === 'profissional'

  const [agendamentos, setAgendamentos] = useState([])
  const [nomes, setNomes] = useState({})
  const [servicos, setServicos] = useState([])
  const [servicoNomes, setServicoNomes] = useState({})
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const params = ehProfissional ? { profissional_id: userId } : {}
    Promise.all([listarAgendamentos(params), listarUsuarios(), listarServicos()])
      .then(([ags, us, svs]) => {
        setAgendamentos(ags)
        setNomes(Object.fromEntries(us.map((u) => [u.id, u.nome])))
        setServicos(svs)
        setServicoNomes(Object.fromEntries(svs.map((s) => [s.id, s.nome])))
      })
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [ehProfissional, userId])

  if (loading) return <Loading />

  const ativos = agendamentos.filter((a) => a.status !== 'cancelado')
  const agendaHoje = ativos
    .filter((a) => ehHoje(a.data_hora_inicio))
    .sort(porInicio)
  const servicosAtivos = servicos.filter((s) => s.ativo)
  const clientes = Object.values(nomes).length // nomes inclui todos os usuários

  return (
    <div>
      <PageHeader
        title={ehProfissional ? 'Minha agenda' : 'Painel de gestão'}
        subtitle={
          ehProfissional
            ? 'Seus atendimentos do dia em um só lugar.'
            : 'Visão geral da operação da barbearia.'
        }
        action={<LinkButton to="/agendamentos/novo">+ Novo agendamento</LinkButton>}
      />
      <ErrorBanner message={erro} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Agendamentos hoje" value={agendaHoje.length} />
        <StatCard
          label="Marcações em aberto"
          value={ativos.filter((a) => a.status === 'agendado').length}
        />
        <StatCard label="Serviços ativos" value={servicosAtivos.length} />
        {!ehProfissional && <StatCard label="Usuários cadastrados" value={clientes} />}
      </div>

      <h2 className="text-lg font-semibold text-slate-800 mb-3">Agenda de hoje</h2>
      {agendaHoje.length === 0 ? (
        <EmptyState message="Nenhum atendimento agendado para hoje." />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Hora</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                {!ehProfissional && <th className="px-4 py-3 font-medium">Profissional</th>}
                <th className="px-4 py-3 font-medium">Serviço</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {agendaHoje.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {formatarHora(a.data_hora_inicio)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{nomes[a.cliente_id] || '—'}</td>
                  {!ehProfissional && (
                    <td className="px-4 py-3 text-slate-700">
                      {nomes[a.profissional_id] || '—'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-slate-700">
                    {servicoNomes[a.servico_id] || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusCor[a.status] || 'bg-slate-100'
                      }`}
                    >
                      {a.status}
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
