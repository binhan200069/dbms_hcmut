import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import RoleSwitcher from '../components/RoleSwitcher'
import { useAuth } from '../context/AuthContext'

export default function MainLayout() {
  const { currentRole, ROLES } = useAuth()

  // Chỉ show Sidebar + RoleSwitcher cho STAFF (Admin)
  // Các role khác vẫn có layout đơn giản
  const isStaff = currentRole === ROLES.STAFF

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md h-16 z-40 flex items-center px-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {currentRole === ROLES.STAFF && '📊 Admin Dashboard'}
            {currentRole === ROLES.CUSTOMER && '🏢 Khách Hàng'}
            {currentRole === ROLES.DRIVER && '🚚 Tài Xế'}
          </h1>
        </div>
        {/* RoleSwitcher ở góc phải */}
        <div className="flex items-center gap-4">
          <RoleSwitcher />
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar chỉ hiển thị khi là STAFF */}
        {isStaff && <Sidebar />}

        {/* Main Content */}
        <main className={`flex-1 ${isStaff ? 'ml-64' : 'ml-0'} p-6`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
