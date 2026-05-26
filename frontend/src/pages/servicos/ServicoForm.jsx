import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { buscarServico, criarServico, atualizarServico } from '../../api/servicos'
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

const vazio = { nome: '', preco: '', duracao_minutos: '', ativo: true }

export default function ServicoForm() {
  const { id } = useParams()
  const editando = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState(vazio)
  const [loading, setLoading] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!editando) return
    buscarServico(id)
      .then((s) =>
        setForm({
          nome: s.nome,
          preco: s.preco,
          duracao_minutos: s.duracao_minutos,
          ativo: s.ativo,
        }),
      )
      .catch((e) => setErro(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [id, editando])

  function update(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    const payload = {
      nome: form.nome,
      preco: Number(form.preco),
      duracao_minutos: Number(form.duracao_minutos),
      ativo: form.ativo,
    }
    try {
      if (editando) await atualizarServico(id, payload)
      else await criarServico(payload)
      navigate('/servicos')
    } catch (err) {
      setErro(getErrorMessage(err))
      setSalvando(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      <PageHeader title={editando ? 'Editar serviço' : 'Novo serviço'} />
      <ErrorBanner message={erro} />
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="grid gap-4 max-w-lg">
          <Field label="Nome">
            <input
              className={inputClass}
              value={form.nome}
              onChange={(e) => update('nome', e.target.value)}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Preço (R$)">
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={form.preco}
                onChange={(e) => update('preco', e.target.value)}
                required
              />
            </Field>
            <Field label="Duração (min)">
              <input
                type="number"
                min="1"
                className={inputClass}
                value={form.duracao_minutos}
                onChange={(e) => update('duracao_minutos', e.target.value)}
                required
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => update('ativo', e.target.checked)}
            />
            Serviço ativo
          </label>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/servicos')}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
