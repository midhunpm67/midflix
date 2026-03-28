import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { GuestRoute } from './GuestRoute'
import { AuthLayout } from '@/layouts/AuthLayout'
import { MainLayout } from '@/layouts/MainLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import ContentListPage from '@/pages/admin/ContentListPage'
import ContentEditPage from '@/pages/admin/ContentEditPage'
import HomePage from '@/pages/HomePage'
import ContentDetailPage from '@/pages/ContentDetailPage'
import WatchPage from '@/pages/WatchPage'
import BrowsePage from '@/pages/BrowsePage'

// Placeholder pages — replaced in later phases
const SubscriptionPage = () => <div className="p-8 text-white">Subscription — Phase 7</div>
const AdminDashboard = () => <div className="p-8 text-white">Admin — Phase 2</div>

export const router = createBrowserRouter([
  // Guest-only routes
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },

  // Subscriber routes (with MainLayout nav bar)
  {
    element: <ProtectedRoute role="subscriber" />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/browse', element: <BrowsePage /> },
          { path: '/content/:slug', element: <ContentDetailPage /> },
        ],
      },
      // Watch routes — outside MainLayout (no nav bar), but still subscriber-protected
      { path: '/watch/:slug', element: <WatchPage /> },
      { path: '/watch/:slug/episode/:episodeId', element: <WatchPage /> },
    ],
  },

  // Auth-only (subscription page — no active sub needed)
  {
    path: '/subscription',
    element: <SubscriptionPage />,
  },

  // Admin routes
  {
    element: <ProtectedRoute role="admin" />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <AdminDashboard /> },
          { path: '/admin/content', element: <ContentListPage /> },
          { path: '/admin/content/:id', element: <ContentEditPage /> },
        ],
      },
    ],
  },
])
