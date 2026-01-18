import React from 'react'
import { CircularProgress, Box } from '@mui/material'

interface LoaderProps {
  size?: number
  fullScreen?: boolean
}

const Loader: React.FC<LoaderProps> = ({ size = 40, fullScreen = false }) => {
  if (fullScreen) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={size} />
      </Box>
    )
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" p={2}>
      <CircularProgress size={size} />
    </Box>
  )
}

export default Loader
