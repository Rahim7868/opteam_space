import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

function safeParseUser(value) {
  try {
    if (!value || value === 'undefined') return null
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken]     = useState(() => localStorage.getItem('opteam_token'))
  const [user, setUser]       = useState(() => safeParseUser(localStorage.getItem('opteam_user')))
  const [loading, setLoading] = useState(!!token)

  useEffect(() => {
    if (!token) { setLoading(false); return }

    api.get('/auth/me')
      .then(({ data }) => {
        const userData = data?.data ?? data
        setUser(userData)
        localStorage.setItem('opteam_user', JSON.stringify(userData))
      })
      .catch(() => {
        setToken(null)
        setUser(null)
        localStorage.removeItem('opteam_token')
        localStorage.removeItem('opteam_user')
      })
      .finally(() => setLoading(false))
  }, [token])

  const hasPermission = useCallback((permission) => {
    const perms = user?.toutes_permissions
    if (!perms) return false
    if (Array.isArray(perms)) return perms.includes(permission)
    return Object.values(perms).includes(permission)
  }, [user])

  // MODIFICATION : ajout du paramètre remember
  const login = useCallback(async (credentials, remember = false) => {
    const { data } = await api.post('/auth/login', {
      ...credentials,
      remember
    })
    const userData = data?.user?.data ?? data?.user

    localStorage.setItem('opteam_token', data.token)
    localStorage.setItem('opteam_user', JSON.stringify(userData))

    setToken(data.token)
    setUser(userData)

    return { mustChangePassword: data.must_change_password }
  }, [])

  const changePassword = useCallback(async (passwords) => {
    const { data } = await api.post('/auth/change-password', passwords)
    const userData = data?.user?.data ?? data?.user

    localStorage.setItem('opteam_user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('opteam_token')
      localStorage.removeItem('opteam_user')
      setToken(null)
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      hasPermission,
      login,
      changePassword,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}