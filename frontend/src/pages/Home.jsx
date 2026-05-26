import { useAuth } from '../auth/AuthContext'
import AdminDashboard from './dashboard/AdminDashboard'
import ClienteDashboard from './dashboard/ClienteDashboard'

// A página inicial é um painel dinâmico que se adapta ao perfil:
// gestão (admin/profissional) x fluxo de marcação (cliente).
export default function Home() {
  const { perfil } = useAuth()
  return perfil === 'cliente' ? <ClienteDashboard /> : <AdminDashboard />
}
