import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi, login as loginApi } from '../api/auth'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Card, Button, ErrorBanner, Field, inputClass } from '../components/ui'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ nome: '', email: '', senha: '', telefone: '' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  function update(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setEnviando(true)
    setErro('')
    try {
      await registerApi({ ...form, telefone: form.telefone || null })
      // entra automaticamente após o cadastro
      const { access_token, perfil } = await loginApi(form.email, form.senha)
      login(access_token, perfil)
      navigate('/')
    } catch (err) {
      setErro(getErrorMessage(err))
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-xl font-bold text-indigo-600 text-center mb-1">
          ✂ Xpress Code
        </h1>
        <p className="text-center text-sm text-slate-500 mb-6">Criar conta de cliente</p>
        <ErrorBanner message={erro} />
        <form onSubmit={handleSubmit} className="grid gap-4">
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
          <Field label="Telefone (opcional)">
            <input
              className={inputClass}
              value={form.telefone}
              onChange={(e) => update('telefone', e.target.value)}
            />
          </Field>
          <Button type="submit" disabled={enviando} className="justify-center">
            {enviando ? 'Cadastrando…' : 'Cadastrar'}
          </Button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4">
          Já tem conta?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Entrar
          </Link>
        </p>
      </Card>
    </div>
  )
}
