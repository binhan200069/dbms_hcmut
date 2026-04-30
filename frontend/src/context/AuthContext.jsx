import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fetchUserById, fetchUsers } from '../services/userApi'

const AuthContext = createContext(null)

const rolePathMap = {
    CUSTOMER: '/customer',
    DRIVER: '/driver',
    ADMIN: '/admin',
}

const initialMockUsers = [
    { id: 1, name: 'Nguyễn Văn A', role: 'CUSTOMER', customerType: 'VIP' },
    { id: 2, name: 'Trần Thị B', role: 'DRIVER' },
    { id: 3, name: 'Lê Văn C', role: 'ADMIN' },
]

export function AuthProvider({ children }) {
    const [mockUsers, setMockUsers] = useState(initialMockUsers)
    const [currentUser, setCurrentUser] = useState(initialMockUsers[0])

    useEffect(() => {
        async function loadUsersFromDb() {
            try {
                const dbUsers = await fetchUsers()
                const mergedUsers = initialMockUsers.map((localUser) => {
                    const dbUser = dbUsers.find((u) => u.id === localUser.id)
                    return dbUser ? { ...localUser, ...dbUser } : localUser
                })

                const additionalDbUsers = dbUsers
                    .filter((dbUser) => !mergedUsers.some((user) => user.id === dbUser.id))
                    .map((dbUser) => ({
                        ...dbUser,
                        role: dbUser.role || 'CUSTOMER',
                    }))

                const finalUsers = [...mergedUsers, ...additionalDbUsers]
                setMockUsers(finalUsers)

                setCurrentUser((prev) => {
                    const matched = finalUsers.find((user) => user.id === prev.id)
                    return matched ? { ...prev, ...matched } : prev
                })
            } catch (error) {
                console.warn('Could not load users from database:', error)
            }
        }

        loadUsersFromDb()
    }, [])

    const getPathByRole = (role) => rolePathMap[role] || '/customer'

    const switchUser = async (userObj) => {
        if (!userObj || !userObj.id) return

        if (userObj.role === 'CUSTOMER') {
            try {
                const dbUser = await fetchUserById(userObj.id)
                if (dbUser) {
                    setCurrentUser({
                        ...userObj,
                        ...dbUser,
                    })
                    return
                }
            } catch (error) {
                console.warn('Could not load user from database:', error)
            }
        }

        setCurrentUser(userObj)
    }

    const value = useMemo(
        () => ({
            currentUser,
            mockUsers,
            switchUser,
            getPathByRole,
        }),
        [currentUser, mockUsers],
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
