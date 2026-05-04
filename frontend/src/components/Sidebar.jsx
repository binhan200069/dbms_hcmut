import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const { currentRole, ROLES } = useAuth()

  // Menu items thay đổi theo role
  const getMenuItems = () => {
    switch (currentRole) {
      case ROLES.STAFF:
        return [
          { label: 'Tổng quan', href: '/admin', icon: '📊' },
          { label: 'Quản lý Phương tiện', href: '/admin/vehicles', icon: '🚗' },
          { label: 'Phân công Chuyến hàng', href: '/admin/assignments', icon: '📦' },
        ]
      case ROLES.CUSTOMER:
        return [
          { label: 'Đặt hàng mới', href: '/customer', icon: '➕' },
          { label: 'Lịch sử Đơn hàng', href: '/customer/history', icon: '📋' },
        ]
      case ROLES.DRIVER:
        return [
          { label: 'Chuyến xe của tôi', href: '/driver', icon: '🚚' },
          { label: 'Cập nhật Hành trình', href: '/driver/tracking', icon: '📍' },
        ]
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0 pt-20 border-r border-gray-800">
      {/* Logo / Brand */}
      <div className="px-6 py-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">🚚 Logistics</h1>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition"
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="border-t border-gray-800 px-4 py-4 text-xs text-gray-400">
        <p className="font-semibold mb-2">Vai trò hiện tại:</p>
        <p className="break-words">
          {currentRole === ROLES.STAFF && 'Nhân viên Điều phối'}
          {currentRole === ROLES.CUSTOMER && 'Khách hàng'}
          {currentRole === ROLES.DRIVER && 'Tài xế'}
        </p>
      </div>
    </div>
  )
}
