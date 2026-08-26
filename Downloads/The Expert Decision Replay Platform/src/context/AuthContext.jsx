import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('edrp_token'))
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('edrp_user') || 'null'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const expire = () => {
      localStorage.removeItem('edrp_token')
      localStorage.removeItem('edrp_user')
      setToken(null)
      setUser(null)
    }
    window.addEventListener('auth:expired', expire)
    return () => window.removeEventListener('auth:expired', expire)
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      const accessToken = response.data.access_token
      localStorage.setItem('edrp_token', accessToken)
      setToken(accessToken)
      const profile = await api.get('/users/me')
      localStorage.setItem('edrp_user', JSON.stringify(profile.data))
      setUser(profile.data)
      return profile.data
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('edrp_token')
    localStorage.removeItem('edrp_user')
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, token, role: user?.role, login, logout, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
