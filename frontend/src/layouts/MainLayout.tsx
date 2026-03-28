import { Link, Outlet } from 'react-router-dom'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface/60 backdrop-blur-[30px]">
        <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-display text-2xl tracking-widest text-primary">
              MIDFLIX
            </Link>
            <Link to="/" className="text-sm text-white/70 hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/browse" className="text-sm text-white/70 hover:text-white transition-colors">
              Browse
            </Link>
          </div>
        </div>
      </nav>
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  )
}
