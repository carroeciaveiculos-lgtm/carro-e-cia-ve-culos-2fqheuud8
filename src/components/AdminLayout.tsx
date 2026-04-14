import { Outlet } from 'react-router-dom'
import { AdminHeader } from './admin/AdminHeader'

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <AdminHeader />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
