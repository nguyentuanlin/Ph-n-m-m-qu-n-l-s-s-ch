'use client'

import React from 'react'
import { Snackbar, Alert } from '@mui/material'

interface NotificationSnackbarProps {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'info' | 'warning'
  onClose: () => void
  autoHideDuration?: number
}

export default function NotificationSnackbar({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 6000
}: NotificationSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
}
