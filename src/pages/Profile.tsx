import React, { useState } from 'react'
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth()
  const { showNotification } = useNotification()

  const [tab, setTab] = useState(0)

  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
  })

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setProfileForm((prev) => ({ ...prev, [id]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileForm.name || !profileForm.email) return
    setIsSavingProfile(true)
    try {
      await api.updateProfile(profileForm.name, profileForm.email)
      await refreshUser()
      showNotification('Profile updated successfully', 'success')
    } catch (err) {
      showNotification(err, 'error')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordForm.current_password || !passwordForm.new_password) return
    setIsSavingPassword(true)
    try {
      await api.changePassword(
        passwordForm.current_password,
        passwordForm.new_password
      )
      setPasswordForm({ current_password: '', new_password: '' })
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      showNotification('Password changed successfully', 'success')
    } catch (err) {
      showNotification(err, 'error')
    } finally {
      setIsSavingPassword(false)
    }
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
      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 0 } }}>
        <Card sx={{ p: 4 }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            sx={{ mb: 3 }}
            variant="fullWidth"
          >
            <Tab label="Profile" />
            <Tab label="Change Password" />
          </Tabs>

          {tab === 0 && (
            <Box component="form" onSubmit={handleSaveProfile}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Account Information
              </Typography>
              <TextField
                fullWidth
                id="name"
                label="Full Name"
                margin="normal"
                value={profileForm.name}
                onChange={handleProfileChange}
                required
                disabled={isSavingProfile}
              />
              <TextField
                fullWidth
                id="email"
                label="Email"
                type="email"
                margin="normal"
                value={profileForm.email}
                onChange={handleProfileChange}
                required
                disabled={isSavingProfile}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 3, mb: 1.5 }}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          )}

          {tab === 1 && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Box component="form" onSubmit={handleChangePassword}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Change Password
                </Typography>
                <TextField
                  fullWidth
                  id="current_password"
                  label="Current Password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  margin="normal"
                  value={passwordForm.current_password}
                  onChange={handlePasswordChange}
                  required
                  disabled={isSavingPassword}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle current password visibility"
                            onClick={() =>
                              setShowCurrentPassword((prev) => !prev)
                            }
                            edge="end"
                          >
                            {showCurrentPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <TextField
                  fullWidth
                  id="new_password"
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  margin="normal"
                  value={passwordForm.new_password}
                  onChange={handlePasswordChange}
                  required
                  disabled={isSavingPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle new password visibility"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  sx={{ mt: 3 }}
                  disabled={isSavingPassword}
                >
                  {isSavingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </Box>
            </>
          )}
        </Card>
      </Container>
    </Box>
  )
}

export default Profile
