import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const rolePathMap = {
    CUSTOMER: '/customer',
    DRIVER: '/driver',
    ADMIN: '/admin',
}

const mockUsers = [
    { id: 1, name: 'Nguyễn Văn A', role: 'CUSTOMER' },
    { id: 2, name: 'Trần Thị B', role: 'DRIVER' },
    { id: 3, name: 'Lê Văn C', role: 'ADMIN' },
]

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(mockUsers[0])

    const getPathByRole = (role) => rolePathMap[role] || '/customer'

    const switchUser = (userObj) => {
        if (!userObj || !userObj.id) return
        setCurrentUser(userObj)
    }

    const value = useMemo(
        () => ({
            currentUser,
            mockUsers,
            switchUser,
            getPathByRole,
        }),
        [currentUser],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }

    return context
}
