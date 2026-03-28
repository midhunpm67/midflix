import { Outlet } from 'react-router-dom'
import ContentModal from '@/components/shared/ContentModal'

export function RootLayout() {
  return (
    <>
      <Outlet />
      <ContentModal />
    </>
  )
}
