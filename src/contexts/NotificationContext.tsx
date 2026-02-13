import React, { createContext, useContext, useState, useCallback } from 'react'
import { Snackbar, Alert, AlertColor } from '@mui/material'

interface NotificationContextType {
  showNotification: (
    message: any,
    severity?: AlertColor,
    autoHide?: boolean
  ) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<AlertColor>('info')
  const [autoHide, setAutoHide] = useState<boolean>(true)

  const showNotification = useCallback(
    (msg: any, sev: AlertColor = 'info', autoHide: boolean = true) => {
      const finalMessage = sev === 'error' ? parseError(msg) : String(msg)
      setMessage(finalMessage)
      setSeverity(sev)
      setAutoHide(autoHide)
      setOpen(true)
    },
    []
  )

  const handleClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return
    setOpen(false)
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={autoHide ? 4000 : null}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  )
}

const parseError = (error: any): string => {
  if (typeof error === 'string') return error

  // Handle Axios/API response errors (usually where the backend sends a message)
  if (error.response?.data?.message) {
    return error.response.data.message
  }

  // Handle standard JavaScript Error objects (e.g., throw new Error("..."))
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error)
  }

  return 'An unexpected error occurred'
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context)
    throw new Error('useNotification must be used within NotificationProvider')
  return context
}
