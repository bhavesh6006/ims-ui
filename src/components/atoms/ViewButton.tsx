import React from 'react'
import { Button } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'

interface ViewButtonProps {
  onClick: () => void
  disabled?: boolean
}

export const ViewButton: React.FC<ViewButtonProps> = ({
  onClick,
  disabled = false,
}) => {
  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<VisibilityIcon />}
      onClick={onClick}
      disabled={disabled}
    >
      View
    </Button>
  )
}
