import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import ServicosList from './pages/servicos/ServicosList'
import ServicoForm from './pages/servicos/ServicoForm'
import ServicoDetail from './pages/servicos/ServicoDetail'
import UsuariosList from './pages/usuarios/UsuariosList'
import UsuarioForm from './pages/usuarios/UsuarioForm'
import AgendamentosList from './pages/agendamentos/AgendamentosList'
import AgendamentoForm from './pages/agendamentos/AgendamentoForm'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />

          <Route path="/servicos" element={<ServicosList />} />
          <Route path="/servicos/novo" element={<ServicoForm />} />
          <Route path="/servicos/:id" element={<ServicoDetail />} />
          <Route path="/servicos/:id/editar" element={<ServicoForm />} />

          <Route path="/usuarios" element={<UsuariosList />} />
          <Route path="/usuarios/novo" element={<UsuarioForm />} />

          <Route path="/agendamentos" element={<AgendamentosList />} />
          <Route path="/agendamentos/novo" element={<AgendamentoForm />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
