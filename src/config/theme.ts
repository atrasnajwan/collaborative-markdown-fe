import { createTheme } from '@mui/material/styles'

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7aa2f7',
      light: '#9ecdff',
      dark: '#5a7acc',
      contrastText: '#1a1b26',
    },
    secondary: {
      main: '#bb9af7',
      light: '#ddb8ff',
      dark: '#8b69c7',
      contrastText: '#1a1b26',
    },
    background: {
      default: '#1a1b26',
      paper: '#1f2335',
    },
    text: {
      primary: '#c0caf5',
      secondary: '#7dcfff',
    },
    divider: 'rgba(255, 255, 255, 0.1)',
    error: {
      main: '#ff1744',
    },
    warning: {
      main: '#ffd600',
    },
    success: {
      main: '#00e676',
    },
    info: {
      main: '#448aff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: '6px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1f2335',
          borderRadius: '8px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1f2335',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1f2335',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            color: '#c0caf5',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#7aa2f7',
            },
          },
          '& .MuiInputBase-input::placeholder': {
            color: '#7dcfff',
            opacity: 0.7,
          },
          '& .MuiInputLabel-root': {
            color: '#7dcfff',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1f2335',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        },
      },
    },
  },
})
