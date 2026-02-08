import React from 'react'
import { User } from '../services/api'
interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}
export declare const useAuth: () => AuthContextType
export declare const AuthProvider: React.FC<{
  children: React.ReactNode
}>
export {}
