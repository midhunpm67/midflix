import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { GuestRoute } from './GuestRoute'
import { RootLayout } from '@/layouts/RootLayout'
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

// Placeholder pages
const AdminDashboard = () => <div className="p-8 text-white">Admin Dashboard</div>

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Admin login route
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

      // Public routes — no login required (like JioHotstar)
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/browse', element: <BrowsePage /> },
          { path: '/content/:slug', element: <ContentDetailPage /> },
        ],
      },

      // Watch routes — public, no nav bar
      { path: '/watch/:slug', element: <WatchPage /> },
      { path: '/watch/:slug/episode/:episodeId', element: <WatchPage /> },

      // Admin routes — login required + admin role
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
    ],
  },
])
