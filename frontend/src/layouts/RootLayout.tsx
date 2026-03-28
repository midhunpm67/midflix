import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import ContentModal from '@/components/shared/ContentModal'

export function RootLayout() {
  return (
    <>
      <Outlet />
      <ContentModal />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a24',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff',
            fontSize: '13px',
          },
        }}
      />
    </>
  )
}
