import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Radial gradient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(5,172,229,0.06) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  )
}
