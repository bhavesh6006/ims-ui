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

const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000 // Refresh token every 14 minutes (before 15 min expiry)

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

  // Logout must be defined before refreshToken
  const logout = useCallback(() => {
    authService.logout()
    setToken(null)
    setUser(null)
    setSessionId(null)
  }, [])

  // Token refresh function
  const refreshToken = useCallback(async () => {
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
        // Another tab has logged in, logout current session
        console.log('Session invalidated: Login detected from another tab')
        logout()
        window.location.href = '/login'
      }

      if (e.key === 'token' && !e.newValue) {
        // Token was removed (logout from another tab)
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
    }, 3000) // Check every 3 seconds

    return () => clearInterval(interval)
  }, [token, sessionId, isSessionValid, logout])

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedSessionId = localStorage.getItem('sessionId')

    if (storedToken && storedUser && storedSessionId) {
      try {
        const decoded = jwtDecode<JwtPayload>(storedToken)
        // Check if token is expired
        if (decoded.exp * 1000 > Date.now()) {
          const parsedUser = JSON.parse(storedUser)
          // Check if user is active
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

  const login = async (username: string, password: string) => {
    const response = await authService.login(username, password)

    // Check if user is active
    if (!response.user.status) {
      throw new Error(
        'Your account has been deactivated. Please contact administrator.'
      )
    }

    // Generate new session ID
    const newSessionId = generateSessionId()

    setToken(response.token)
    setUser(response.user)
    setSessionId(newSessionId)

    // Store in localStorage (this will trigger storage event in other tabs)
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    localStorage.setItem('sessionId', newSessionId)
  }

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
