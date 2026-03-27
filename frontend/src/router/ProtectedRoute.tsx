import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
  role: 'subscriber' | 'admin'
}

export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, hasActiveSubscription } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role === 'admin' && !isAdmin()) {
    return <Navigate to="/" replace />
  }

  if (role === 'subscriber' && !isAdmin() && !hasActiveSubscription()) {
    return <Navigate to="/subscription" replace />
  }

  return <Outlet />
}
