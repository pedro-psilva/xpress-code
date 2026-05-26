import { useEffect, useState } from 'react'
import { listarAgendamentos, cancelarAgendamento } from '../../api/agendamentos'
import { listarUsuarios } from '../../api/usuarios'
import { listarServicos } from '../../api/servicos'
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

const statusCor = {
  agendado: 'bg-blue-50 text-blue-700',
  concluido: 'bg-green-50 text-green-700',
  cancelado: 'bg-slate-100 text-slate-500',
}

function formatarData(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function AgendamentosList() {
  const [agendamentos, setAgendamentos] = useState([])
  const [nomes, setNomes] = useState({})
  const [servicos, setServicos] = useState({})
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([listarAgendamentos(), listarUsuarios(), listarServicos()])
      .then(([ags, us, svs]) => {
        setAgendamentos(ags)
        setNomes(Object.fromEntries(us.map((u) => [u.id, u.nome])))
        setServicos(Object.fromEntries(svs.map((s) => [s.id, s.nome])))
      })
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  async function handleCancelar(id) {
    if (!confirm('Cancelar este agendamento?')) return
    try {
      await cancelarAgendamento(id)
      setAgendamentos((ags) =>
        ags.map((a) => (a.id === id ? { ...a, status: 'cancelado' } : a)),
      )
    } catch (e) {
      setErro(getErrorMessage(e))
    }
  }

  return (
    <div>
      <PageHeader
        title="Agendamentos"
        subtitle="Marcações de horário da barbearia."
        action={<LinkButton to="/agendamentos/novo">+ Novo agendamento</LinkButton>}
      />
      <ErrorBanner message={erro} />
      {loading ? (
        <Loading />
      ) : agendamentos.length === 0 ? (
        <EmptyState message="Nenhum agendamento ainda." />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Início</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Profissional</th>
                <th className="px-4 py-3 font-medium">Serviço</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-700">
                    {formatarData(a.data_hora_inicio)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {nomes[a.cliente_id] || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {nomes[a.profissional_id] || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {servicos[a.servico_id] || '—'}
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
                  <td className="px-4 py-3 text-right">
                    {a.status === 'agendado' && (
                      <Button variant="danger" onClick={() => handleCancelar(a.id)}>
                        Cancelar
                      </Button>
                    )}
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
