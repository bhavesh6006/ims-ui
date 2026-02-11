import React from 'react'
import { Button } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'

interface EditButtonProps {
  onClick: () => void
  disabled?: boolean
}

export const EditButton: React.FC<EditButtonProps> = ({
  onClick,
  disabled = false,
}) => {
  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<EditIcon />}
      onClick={onClick}
      disabled={disabled}
    >
      Edit
    </Button>
  )
}
