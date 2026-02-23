import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { api } from '../services/api'
import { useLocation, useNavigate } from 'react-router-dom'
import { useNotification } from './NotificationContext'
import { User } from '../types/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const sessionExpiredHandledRef = useRef(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { showNotification } = useNotification()

  useEffect(() => {
    api.setSessionExpiredHandler(() => {
      if (sessionExpiredHandledRef.current) return
      sessionExpiredHandledRef.current = true
      setUser(null)
      navigate('/auth', { replace: true })
      showNotification('Session expired. Please sign in again.', 'error')
    })
    return () => api.setSessionExpiredHandler(null)
  }, [navigate, showNotification])

  const initializeAuth = useCallback(async () => {
    try {
      const userData = await api.getCurrentUser()
      setUser(userData)
    } catch {
      api.clearToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password)
      sessionExpiredHandledRef.current = false
      setUser(response.user)
      const redirectTo = location.state?.redirectTo || '/documents'
      navigate(redirectTo, { replace: true })

      showNotification('Welcome back!', 'success')
    } catch (error) {
      showNotification(error, 'error')
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      api.clearToken()
      setUser(null)
      navigate('/')
    }
  }

  const refreshUser = async () => {
    await initializeAuth()
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}
