import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ServicosList from './pages/servicos/ServicosList'
import ServicoForm from './pages/servicos/ServicoForm'
import ServicoDetail from './pages/servicos/ServicoDetail'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />

        <Route path="/servicos" element={<ServicosList />} />
        <Route path="/servicos/novo" element={<ServicoForm />} />
        <Route path="/servicos/:id" element={<ServicoDetail />} />
        <Route path="/servicos/:id/editar" element={<ServicoForm />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
