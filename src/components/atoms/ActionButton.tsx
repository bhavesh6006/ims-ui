import React from 'react'
import { Button, CircularProgress, type ButtonProps } from '@mui/material'

interface ActionButtonProps extends Omit<ButtonProps, 'onClick'> {
  label: string
  loadingLabel?: string
  loading?: boolean
  icon?: React.ReactNode
  onClick: () => void
}

const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  loadingLabel,
  loading = false,
  icon,
  onClick,
  disabled,
  sx,
  ...rest
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      startIcon={
        loading ? (
          <CircularProgress size={16} color="inherit" sx={{ mr: 0 }} />
        ) : (
          icon || undefined
        )
      }
      sx={{
        minWidth: 'fit-content',
        whiteSpace: 'nowrap',
        // Keep the same dimensions by using invisible content for measurement
        '& .MuiButton-startIcon': {
          width: 20,
          display: 'flex',
          justifyContent: 'center',
        },
        ...(typeof sx === 'function' ? {} : sx),
      }}
      {...rest}
    >
      {loading ? loadingLabel || label : label}
    </Button>
  )
}

export default ActionButton
