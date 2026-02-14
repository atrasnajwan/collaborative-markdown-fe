import { Outlet } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'

export function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
