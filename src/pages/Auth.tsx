import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, user, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()
  const { showNotification } = useNotification()

  useEffect(() => {
    if (!isAuthLoading && user) {
      navigate('/documents')
    }
  }, [user, isAuthLoading, navigate])

  if (isAuthLoading || user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isLogin) {
        await login(formData.email, formData.password)
      } else {
        await api.register(formData.name, formData.email, formData.password)
        setIsLogin(true)
        setFormData({ name: '', email: '', password: '' })
      }
    } catch (err) {
      showNotification(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }))
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        maxHeight: '100vh',
        overflowY: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: { xs: 0, sm: 4 },
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ p: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ mb: 3, textAlign: 'center' }}
          >
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ space: 2 }}>
            {!isLogin && (
              <TextField
                fullWidth
                id="name"
                label="Full Name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            )}

            <TextField
              fullWidth
              id="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />

            <TextField
              fullWidth
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              placeholder="••••••••"
              required
              disabled={isLoading}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, py: 1.5 }}
              disabled={isLoading}
            >
              {isLoading
                ? 'Please wait...'
                : isLogin
                  ? 'Sign In'
                  : 'Create Account'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              onClick={() => {
                setIsLogin(!isLogin)
                setFormData({ name: '', email: '', password: '' })
              }}
              disabled={isLoading}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
          </Box>
        </Card>
      </Container>
    </Box>
  )
}

export default Auth
