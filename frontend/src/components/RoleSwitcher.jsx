import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function RoleSwitcher() {
  const { currentUser, currentRole, switchRole, ROLES } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const roleOptions = [
    {
      label: '👤 Đóng vai: Nhân viên Điều phối',
      role: ROLES.STAFF,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      label: '🏢 Đóng vai: Khách hàng',
      role: ROLES.CUSTOMER,
      color: 'bg-green-100 text-green-800',
    },
    {
      label: '🚚 Đóng vai: Tài xế',
      role: ROLES.DRIVER,
      color: 'bg-orange-100 text-orange-800',
    },
  ]

  const handleSwitchRole = (role) => {
    switchRole(role)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow hover:bg-gray-50"
      >
        <span className="text-lg">
          {currentRole === ROLES.STAFF && '👤'}
          {currentRole === ROLES.CUSTOMER && '🏢'}
          {currentRole === ROLES.DRIVER && '🚚'}
        </span>
        <span className="hidden sm:inline">{currentUser.name}</span>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Chọn vai trò để demo:
            </p>
            {roleOptions.map((option) => (
              <button
                key={option.role}
                onClick={() => handleSwitchRole(option.role)}
                className={`mb-2 w-full rounded-lg px-3 py-2 text-left text-sm transition ${currentRole === option.role
                    ? `${option.color} font-semibold`
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
