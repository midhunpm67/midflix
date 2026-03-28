import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function AdminLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: '◻' },
    { to: '/admin/content', label: 'Content', icon: '▶' },
  ]

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-[#0f0f12] border-r border-white/[0.06] flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/[0.06]">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-sm font-bold">M</span>
            </div>
            <div>
              <span className="font-display text-lg tracking-[0.2em] text-white">MIDFLIX</span>
              <span className="text-[10px] text-white/30 uppercase tracking-[0.3em] ml-2">Admin</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04] border border-transparent'
                }`
              }
            >
              <span className="text-xs opacity-60">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-xs font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium truncate">{user?.name ?? 'Admin'}</p>
              <p className="text-white/30 text-[10px] truncate">{user?.email ?? ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04] text-xs transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 border-b border-white/[0.06] bg-[#0f0f12]/80 backdrop-blur-xl flex items-center px-8">
          <div className="flex-1" />
          <Link
            to="/"
            className="text-white/30 hover:text-white/60 text-xs transition-colors"
          >
            View Site →
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
