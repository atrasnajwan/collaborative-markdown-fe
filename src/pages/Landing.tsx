import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  Grid,
  Chip,
} from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import SpeedIcon from '@mui/icons-material/Speed'
import GroupIcon from '@mui/icons-material/Group'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const Landing: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: 'linear-gradient(135deg, #7aa2f7 0%, #bb9af7 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Collaborative Markdown Editor
          </Typography>

          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: '3xl', mx: 'auto' }}
          >
            Edit and collaborate on markdown documents in real-time with your
            team
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/auth')}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
            }}
          >
            Get Started
          </Button>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={3} sx={{ mt: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                },
              }}
            >
              <GroupIcon
                sx={{
                  fontSize: 40,
                  color: 'primary.main',
                  mb: 2,
                }}
              />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Real-time Collaboration
              </Typography>
              <Typography color="text.secondary">
                Work together with your team in real-time, seeing changes as
                they happen.
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                },
              }}
            >
              <SpeedIcon
                sx={{
                  fontSize: 40,
                  color: 'secondary.main',
                  mb: 2,
                }}
              />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Markdown Support
              </Typography>
              <Typography color="text.secondary">
                Write in Markdown with instant preview and formatting tools.
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                },
              }}
            >
              <LockIcon
                sx={{
                  fontSize: 40,
                  color: 'success.main',
                  mb: 2,
                }}
              />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Secure Sharing
              </Typography>
              <Typography color="text.secondary">
                Control who has access to your documents with granular
                permissions.
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                },
                border: '2px dashed',
                borderColor: 'divider',
              }}
            >
              <CheckCircleIcon
                sx={{
                  fontSize: 40,
                  color: 'info.main',
                  mb: 2,
                }}
              />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Version History
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  Track changes and revert to previous versions at any time.
                </Typography>
                <Chip label="Coming Soon" size="small" />
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default Landing
