import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/servicos', label: 'Serviços' },
  { to: '/usuarios', label: 'Usuários' },
  { to: '/agendamentos', label: 'Agendamentos' },
]

export default function Layout() {
  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-indigo-600">✂ Xpress Code</span>
          </NavLink>
          <nav className="flex gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
