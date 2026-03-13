import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const Login: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSessionWarning, setShowSessionWarning] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Check if there's an existing session
    const existingSession = localStorage.getItem('sessionId')
    if (existingSession) {
      setShowSessionWarning(true)
    }
  }, [])

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      let message = 'Login failed. Please check your credentials.'

      if (err instanceof Error) {
        message = err.message
      } else if (err && typeof err === 'object') {
        const e = err as {
          response?: { data?: { message?: string; error?: string } }
          message?: string
        }
        message =
          e.response?.data?.message ||
          e.response?.data?.error ||
          e.message ||
          message
      } else if (typeof err === 'string') {
        message = err
      }

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 450 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Inventory Management System
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              align="center"
              sx={{ mb: 3 }}
            >
              Sign in to your account
            </Typography>

            {showSessionWarning && (
              <Alert
                severity="warning"
                sx={{ mb: 2 }}
                onClose={() => setShowSessionWarning(false)}
              >
                An existing session was detected. Logging in will invalidate any
                other active sessions.
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (error) setError('')
                }}
                margin="normal"
                required
                autoFocus
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                margin="normal"
                required
                disabled={loading}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
            </form>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                Note: Only one active session is allowed per browser. Logging in
                from another tab will automatically log out other sessions.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export default Login
