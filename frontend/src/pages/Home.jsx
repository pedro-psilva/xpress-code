import { Link } from 'react-router-dom'
import { Card } from '../components/ui'

const sections = [
  { to: '/servicos', title: 'Serviços', desc: 'Catálogo de serviços, preços e duração.' },
  { to: '/usuarios', title: 'Usuários', desc: 'Clientes, profissionais e administradores.' },
  { to: '/agendamentos', title: 'Agendamentos', desc: 'Marcações de horário da barbearia.' },
]

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800">Gestão da Barbearia</h1>
      <p className="text-slate-500 mt-2 mb-8">
        Painel para gerenciar serviços, usuários e agendamentos.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.to} to={s.to}>
            <Card className="p-5 h-full hover:border-indigo-300 hover:shadow transition">
              <h2 className="text-lg font-semibold text-slate-800">{s.title}</h2>
              <p className="text-sm text-slate-500 mt-1">{s.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
