import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as loginApi } from '../api/auth'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Card, Button, ErrorBanner, Field, inputClass } from '../components/ui'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setEnviando(true)
    setErro('')
    try {
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
        <img
          src="/brand/logo-escuro.png"
          alt="Xpress Code"
          className="mx-auto h-28 w-auto mb-2"
        />
        <p className="text-center text-sm text-slate-500 mb-6">Acesse sua conta</p>
        <ErrorBanner message={erro} />
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="E-mail">
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </Field>
          <Field label="Senha">
            <input
              type="password"
              className={inputClass}
              value={form.senha}
              onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
              required
            />
          </Field>
          <Button type="submit" disabled={enviando} className="justify-center">
            {enviando ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4">
          Não tem conta?{' '}
          <Link to="/register" className="text-indigo-600 hover:underline">
            Cadastre-se
          </Link>
        </p>
      </Card>
    </div>
  )
}
