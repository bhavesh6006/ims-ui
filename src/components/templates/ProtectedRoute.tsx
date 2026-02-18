import React, { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { UserRole } from '../../types/auth.types'
import { Box, CircularProgress } from '@mui/material'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId')
    const token = localStorage.getItem('token')

    if (!sessionId || !token) {
      logout()
      navigate('/login', { replace: true })
    }
  }, [logout, navigate])

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check if user is active
  if (user && !user.status) {
    return <Navigate to="/unauthorized" replace />
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
