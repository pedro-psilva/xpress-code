import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { criarUsuario } from '../../api/usuarios'
import { getErrorMessage } from '../../api/client'
import {
  PageHeader,
  Card,
  Button,
  ErrorBanner,
  Field,
  inputClass,
} from '../../components/ui'

export default function UsuarioForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    perfil: 'cliente',
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function update(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    const payload = { ...form, telefone: form.telefone || null }
    try {
      await criarUsuario(payload)
      navigate('/usuarios')
    } catch (err) {
      setErro(getErrorMessage(err))
      setSalvando(false)
    }
  }

  return (
    <div>
      <PageHeader title="Novo usuário" />
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
          <Field label="E-mail">
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Senha" hint="Mínimo 6 caracteres">
              <input
                type="password"
                className={inputClass}
                value={form.senha}
                onChange={(e) => update('senha', e.target.value)}
                minLength={6}
                required
              />
            </Field>
            <Field label="Perfil">
              <select
                className={inputClass}
                value={form.perfil}
                onChange={(e) => update('perfil', e.target.value)}
              >
                <option value="cliente">Cliente</option>
                <option value="profissional">Profissional</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
          </div>
          <Field label="Telefone (opcional)">
            <input
              className={inputClass}
              value={form.telefone}
              onChange={(e) => update('telefone', e.target.value)}
            />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Cadastrar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/usuarios')}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
