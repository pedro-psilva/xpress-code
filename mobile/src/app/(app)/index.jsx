// Página inicial: um painel dinâmico que se adapta ao perfil — gestão
// (admin/profissional) x fluxo de marcação (cliente).
import { useAuth } from '@/auth/auth-context';
import { Screen } from '@/components/ui';
import AdminDashboard from '@/components/dashboards/admin-dashboard';
import ClienteDashboard from '@/components/dashboards/cliente-dashboard';

export default function HomeScreen() {
  const { perfil } = useAuth();
  return (
    <Screen>
      {perfil === 'cliente' ? <ClienteDashboard /> : <AdminDashboard />}
    </Screen>
  );
}
