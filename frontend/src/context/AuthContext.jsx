import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)


function safeParseUser(value) {
  try {
    if (!value || value === 'undefined') return null
    return JSON.parse(value)
  } catch (e) {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('opteam_token'))

  const [user, setUser] = useState(() =>
    safeParseUser(localStorage.getItem('opteam_user'))
  )

  const [loading, setLoading] = useState(!!token)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    api
      .get('/auth/me')
      .then((data) => {
     
        const userData = data?.data?.data ?? data?.data ?? data

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

  const value = useMemo(
    () => ({
      user,
      token,
      loading,

      isAdmin: user?.role === 'admin',
      isAgent: user?.role === 'agent',

      async login(credentials) {
        const { data } = await api.post('/auth/login', credentials)

        const userData = data?.user?.data ?? data?.user

        localStorage.setItem('opteam_token', data.token)
        localStorage.setItem('opteam_user', JSON.stringify(userData))

        setToken(data.token)
        setUser(userData)
      },

      async logout() {
        try {
          await api.post('/auth/logout')
        } finally {
          localStorage.removeItem('opteam_token')
          localStorage.removeItem('opteam_user')
          setToken(null)
          setUser(null)
        }
      },
    }),
    [loading, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}