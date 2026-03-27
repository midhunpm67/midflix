import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'

export function AdminLayout() {
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar shell */}
      <aside className="w-64 bg-surface border-r border-surface-variant flex flex-col">
        <div className="p-6">
          <span className="font-display text-xl tracking-widest text-primary">MIDFLIX</span>
          <p className="text-xs text-muted mt-1 uppercase tracking-widest">Admin</p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <Link
            to="/admin"
            className="block px-3 py-2 rounded-card text-sm text-white hover:bg-surface-variant transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/admin/content"
            className="block px-3 py-2 rounded-card text-sm text-white hover:bg-surface-variant transition-colors"
          >
            Content
          </Link>
          <Link
            to="/admin/users"
            className="block px-3 py-2 rounded-card text-sm text-white hover:bg-surface-variant transition-colors"
          >
            Users
          </Link>
        </nav>
        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full text-muted hover:text-white text-sm"
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
