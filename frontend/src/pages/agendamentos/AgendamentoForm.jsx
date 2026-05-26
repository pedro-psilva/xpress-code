import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { criarAgendamento } from '../../api/agendamentos'
import { listarUsuarios } from '../../api/usuarios'
import { listarServicos } from '../../api/servicos'
import { getErrorMessage } from '../../api/client'
import {
  PageHeader,
  Card,
  Button,
  Loading,
  ErrorBanner,
  Field,
  inputClass,
} from '../../components/ui'

export default function AgendamentoForm() {
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState([])
  const [servicos, setServicos] = useState([])
  const [form, setForm] = useState({
    cliente_id: '',
    profissional_id: '',
    servico_id: '',
    data_hora_inicio: '',
  })
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([listarUsuarios(), listarServicos()])
      .then(([us, svs]) => {
        setUsuarios(us)
        setServicos(svs.filter((s) => s.ativo))
      })
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  function update(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    try {
      await criarAgendamento(form)
      navigate('/agendamentos')
    } catch (err) {
      setErro(getErrorMessage(err))
      setSalvando(false)
    }
  }

  if (loading) return <Loading />

  const clientes = usuarios.filter((u) => u.perfil === 'cliente')
  const profissionais = usuarios.filter((u) => u.perfil === 'profissional')

  return (
    <div>
      <PageHeader title="Novo agendamento" />
      <ErrorBanner message={erro} />
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="grid gap-4 max-w-lg">
          <Field label="Cliente">
            <select
              className={inputClass}
              value={form.cliente_id}
              onChange={(e) => update('cliente_id', e.target.value)}
              required
            >
              <option value="">Selecione…</option>
              {clientes.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Profissional">
            <select
              className={inputClass}
              value={form.profissional_id}
              onChange={(e) => update('profissional_id', e.target.value)}
              required
            >
              <option value="">Selecione…</option>
              {profissionais.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Serviço">
            <select
              className={inputClass}
              value={form.servico_id}
              onChange={(e) => update('servico_id', e.target.value)}
              required
            >
              <option value="">Selecione…</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} — {s.duracao_minutos} min
                </option>
              ))}
            </select>
          </Field>
          <Field label="Início" hint="O término é calculado pela duração do serviço.">
            <input
              type="datetime-local"
              className={inputClass}
              value={form.data_hora_inicio}
              onChange={(e) => update('data_hora_inicio', e.target.value)}
              required
            />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Agendar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/agendamentos')}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
