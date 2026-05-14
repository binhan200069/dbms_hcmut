import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleSwitcher() {
  const navigate = useNavigate()
  const { currentUser, currentRole, users, switchUser, getHomePath, getRoleCategory, ROLES } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [pendingRole, setPendingRole] = useState(null)

  // Navigate when pending role changes
  useEffect(() => {
    if (pendingRole && currentRole === pendingRole) {
      const homePath = getHomePath(pendingRole)
      navigate(homePath)
      setPendingRole(null)
    }
  }, [pendingRole, currentRole, navigate, getHomePath])

  const handleSelectUser = (user) => {
    const targetRole = getRoleCategory(user.role)
    setPendingRole(targetRole)
    switchUser(user)
    setIsOpen(false)
  }

  const getRoleLabel = (user) => {
    return user.role || 'Unknown';
  };

  const getRoleIcon = (role) => {
    if (!role) return '👤';
    const roleStr = String(role).toLowerCase();
    if (roleStr.includes('customer') || roleStr.includes('khách hàng') || roleStr.includes('b2b') || roleStr.includes('b2c') ||
        roleStr.includes('wholesaler') || roleStr.includes('retailer')) {
      return 'ROLES.CUSTOMER';
    } else if (roleStr.includes('driver') || roleStr.includes('tài xế')) {
      return '🚚';
    }
    return '👤';
  };

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
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-sm font-semibold">{currentUser.name}</span>
        </div>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Chọn người dùng để giả lập
            </p>
            {users.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                Đang tải danh sách người dùng...
              </div>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`mb-2 w-full rounded-lg px-3 py-2 text-left text-sm transition ${currentUser?.id === user.id
                    ? 'bg-slate-100 font-semibold text-slate-900'
                    : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getRoleIcon(user.role)}</span>
                      <div className="flex flex-col">
                        <span>{getRoleLabel(user)}</span>
                        <span className="text-xs text-slate-500">{user.email}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">({user.id})</span>
                  </div>
                  <div className="text-slate-500 text-xs">{user.name}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
