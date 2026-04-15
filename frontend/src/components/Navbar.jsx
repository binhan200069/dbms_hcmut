import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
    { to: '/customer', label: 'Customer' },
    { to: '/driver', label: 'Driver' },
    { to: '/admin', label: 'Admin' },
]

const roleLabelMap = {
    CUSTOMER: 'Customer',
    DRIVER: 'Driver',
    ADMIN: 'Admin',
}

function getNavClass(isActive) {
    return isActive
        ? 'rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white'
        : 'rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200'
}

export default function Navbar() {
    const navigate = useNavigate()
    const { currentUser, mockUsers, switchUser, getPathByRole } = useAuth()

    const handleChangeUser = (event) => {
        const selectedId = Number.parseInt(event.target.value, 10)
        const selectedUser = mockUsers.find((user) => user.id === selectedId)

        if (selectedUser) {
            switchUser(selectedUser)
            navigate(getPathByRole(selectedUser.role))
        }
    }

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6">
                    <div className="text-lg font-bold text-slate-900">Uni Logistics</div>
                    <nav className="hidden items-center gap-1 sm:flex">
                        {navItems.map((item) => (
                            <NavLink key={item.to} to={item.to} className={({ isActive }) => getNavClass(isActive)}>
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <span className="hidden text-sm text-slate-600 md:inline">Mock Login</span>
                    <select
                        value={currentUser.id}
                        onChange={handleChangeUser}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-slate-400 transition focus:ring-2"
                    >
                        {mockUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                                User {user.id} ({roleLabelMap[user.role] || user.role})
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </header>
    )
}
