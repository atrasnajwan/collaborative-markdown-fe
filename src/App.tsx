import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import ProtectedRoute from './components/ProtectedRoute'
import Documents from './pages/Documents'
import { darkTheme } from './config/theme'
import './index.css'
import { NotificationProvider } from './contexts/NotificationContext'
import { AuthLayout } from './layout/AuthLayout'
import { lazy, Suspense } from 'react'
import Profile from './pages/Profile'
import EditorSkeleton from './components/EditorSkeleton'

const EditDocument = lazy(() => import('./pages/EditDocument'))

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <NotificationProvider>
          <Routes>
            {/* public routes */}
            <Route path="/" element={<Landing />} />
            {/* protected layout */}
            <Route element={<AuthLayout />}>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute>
                    <Documents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents/:id/edit"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<EditorSkeleton />}>
                      <EditDocument />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </NotificationProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
