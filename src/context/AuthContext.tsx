import React, { useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import { authService } from '../services/auth.service'
import type { User, AuthContextType } from '../types/auth.types'
import { AuthContext } from './AuthContextDef'

interface JwtPayload {
  exp: number
  [key: string]: unknown
}

interface AuthProviderProps {
  children: ReactNode
}

// Generate unique session ID
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000 // Refresh token every 14 minutes (before 15 min expiry)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000 // 15 minutes

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Check if session is valid
  const isSessionValid = useCallback((): boolean => {
    const storedSessionId = localStorage.getItem('sessionId')
    return storedSessionId === sessionId && sessionId !== null
  }, [sessionId])

  // Logout function
  const logout = useCallback(() => {
    authService.logout()
    setToken(null)
    setUser(null)
    setSessionId(null)
  }, [])

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    const timeoutId = localStorage.getItem('inactivityTimeoutId')
    if (timeoutId) {
      clearTimeout(Number(timeoutId))
    }

    const newTimeoutId = setTimeout(() => {
      console.log('User logged out due to inactivity')
      logout()
      window.location.href = '/login'
    }, INACTIVITY_TIMEOUT)

    localStorage.setItem('inactivityTimeoutId', String(newTimeoutId))
  }, [logout])

  // Token refresh function
  const refreshToken = useCallback(async () => {
    const currentToken = localStorage.getItem('token')

    if (!currentToken) {
      console.warn('No token found. Skipping token refresh.')
      return
    }

    try {
      const newToken = await authService.refreshToken()
      setToken(newToken)
      console.log('Token refreshed successfully')
    } catch (error: unknown) {
      console.error('Token refresh failed:', error)
      logout()
      window.location.href = '/login'
    }
  }, [logout])

  // Auto refresh token before expiry
  useEffect(() => {
    if (!token) return

    const interval = setInterval(() => {
      refreshToken()
    }, TOKEN_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [token, refreshToken])

  // Listen for storage changes (detect login from another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sessionId' && e.newValue !== sessionId) {
        console.log('Session invalidated: Login detected from another tab')
        logout()
        window.location.href = '/login'
      }

      if (e.key === 'token' && !e.newValue) {
        logout()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [sessionId, logout])

  // Periodically check session validity
  useEffect(() => {
    const interval = setInterval(() => {
      if (token && sessionId && !isSessionValid()) {
        console.log('Session invalidated: Session ID mismatch')
        logout()
        window.location.href = '/login'
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [token, sessionId, isSessionValid, logout])

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedSessionId = localStorage.getItem('sessionId')

    if (storedToken && storedUser && storedSessionId) {
      try {
        const decoded = jwtDecode<JwtPayload>(storedToken)
        if (decoded.exp * 1000 > Date.now()) {
          const parsedUser = JSON.parse(storedUser)
          if (parsedUser.status) {
            setToken(storedToken)
            setUser(parsedUser)
            setSessionId(storedSessionId)
          } else {
            logout()
          }
        } else {
          logout()
        }
      } catch {
        logout()
      }
    }
    setIsLoading(false)
  }, [logout])

  // Login function
  const login = async (username: string, password: string) => {
    const response = await authService.login(username, password)

    if (!response.user.status) {
      throw new Error(
        'Your account has been deactivated. Please contact administrator.'
      )
    }

    const newSessionId = generateSessionId()

    setToken(response.token)
    setUser(response.user)
    setSessionId(newSessionId)

    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    localStorage.setItem('sessionId', newSessionId)
  }

  // Handle user activity
  useEffect(() => {
    const handleUserActivity = () => {
      resetInactivityTimer()
    }

    window.addEventListener('mousemove', handleUserActivity)
    window.addEventListener('keydown', handleUserActivity)
    window.addEventListener('click', handleUserActivity)

    resetInactivityTimer()

    return () => {
      window.removeEventListener('mousemove', handleUserActivity)
      window.removeEventListener('keydown', handleUserActivity)
      window.removeEventListener('click', handleUserActivity)

      const timeoutId = localStorage.getItem('inactivityTimeoutId')
      if (timeoutId) {
        clearTimeout(Number(timeoutId))
        localStorage.removeItem('inactivityTimeoutId')
      }
    }
  }, [resetInactivityTimer])

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user && isSessionValid(),
    isLoading,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
