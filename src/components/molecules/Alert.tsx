import React from 'react'
import { Alert as MuiAlert, Snackbar } from '@mui/material'

interface AlertProps {
  open: boolean
  onClose: () => void
  message: string
  severity?: 'success' | 'error' | 'warning' | 'info'
  autoHideDuration?: number
}

const Alert: React.FC<AlertProps> = ({
  open,
  onClose,
  message,
  severity = 'info',
  autoHideDuration = 6000,
}) => {
  return (
    <Snackbar open={open} autoHideDuration={autoHideDuration} onClose={onClose}>
      <MuiAlert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </MuiAlert>
    </Snackbar>
  )
}

export default Alert
