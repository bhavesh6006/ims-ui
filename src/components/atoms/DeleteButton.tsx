import React from 'react'
import { Button } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

interface DeleteButtonProps {
  onClick: () => void
  disabled?: boolean
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  onClick,
  disabled = false,
}) => {
  return (
    <Button
      variant="outlined"
      size="small"
      color="error"
      startIcon={<DeleteIcon />}
      onClick={onClick}
      disabled={disabled}
    >
      Delete
    </Button>
  )
}
