import React, { createContext, useContext, useState, useEffect } from 'react'
import { api, User } from '../services/api'
import { useNavigate } from 'react-router-dom'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
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
  const navigate = useNavigate()

  useEffect(() => {
    const initializeAuth = async () => {
      const token = api.getToken()
      if (token) {
        try {
          const userData = await api.getCurrentUser()
          setUser(userData)
        } catch (error) {
          console.error('Failed to restore session:', error)
          api.clearToken()
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password)
      setUser(response.user)
      // to documents page
      navigate('/documents')
    } catch (error) {
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      await api.register(name, email, password)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await api.logout()
      setUser(null)
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
      // Still clear local state even if server logout fails
      api.clearToken()
      setUser(null)
      navigate('/')
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
