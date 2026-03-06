import axios, { AxiosError } from 'axios'
import type { LoginResponse, User } from '../types/auth.types'

const API_BASE_URL =
  (window as unknown as { __APP_CONFIG__?: { API_BASE_URL?: string } })
    .__APP_CONFIG__?.API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'
const LDAP_TIMEOUT = 15000 // 15 seconds timeout for LDAP operations

interface ApiError {
  message: string
  code?: string
  details?: string
}

class AuthService {
  private createHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  private handleError(error: AxiosError<ApiError>): never {
    if (error.code === 'ECONNABORTED') {
      throw new Error(
        'Authentication timeout. The LDAP server is taking too long to respond. Please try again.'
      )
    }

    if (!error.response) {
      throw new Error(
        'Network error. Please check your connection and try again.'
      )
    }

    const status = error.response.status
    const errorData = error.response.data

    switch (status) {
      case 400:
        throw new Error(
          errorData?.message || 'Invalid request. Please check your input.'
        )
      case 401:
        throw new Error(
          errorData?.message ||
            'Invalid credentials. Please check your username and password.'
        )
      case 403:
        throw new Error(
          errorData?.message ||
            'Access denied. Your account may be inactive or you lack the required permissions.'
        )
      case 404:
        throw new Error(
          'Authentication service not found. Please contact support.'
        )
      case 408:
        throw new Error('Request timeout. Please try again.')
      case 500:
        if (errorData?.details?.includes('LDAP')) {
          throw new Error(
            'LDAP server error. Please contact your system administrator.'
          )
        }
        throw new Error(
          errorData?.message || 'Internal server error. Please try again later.'
        )
      case 503:
        throw new Error(
          'Authentication service is temporarily unavailable. Please try again later.'
        )
      default:
        throw new Error(
          errorData?.message ||
            `Authentication failed with status ${status}. Please try again.`
        )
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/auth/login`,
        { username, password },
        {
          headers: this.createHeaders(),
          timeout: LDAP_TIMEOUT,
        }
      )

      // Store token and refresh token
      if (response.data.token && response.data.refreshToken) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('refresh_token', response.data.refreshToken) // Store refresh token
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }

      return response.data
    } catch (error) {
      this.handleError(error as AxiosError<ApiError>)
    }
  }

  async validateToken(token: string): Promise<User> {
    try {
      const response = await axios.get<User>(`${API_BASE_URL}/auth/validate`, {
        headers: this.createHeaders(token),
        timeout: 5000,
      })
      return response.data
    } catch {
      // Clear invalid token
      this.logout()
      throw new Error('Session expired. Please login again.')
    }
  }

  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token') // Retrieve the refresh token

    if (!refreshToken) {
      console.warn('No refresh token found in localStorage.')
      this.logout() // Log the user out if no refresh token is found
      throw new Error('No refresh token found. Please login again.')
    }

    try {
      console.log('Refreshing token...')
      const response = await axios.post<{
        token: string
        refreshToken: string
      }>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`, // Explicitly use the refresh token
          },
          timeout: 5000,
        }
      )

      const { token: newToken, refreshToken: newRefreshToken } = response.data

      // Update both the access token and the refresh token in localStorage
      localStorage.setItem('token', newToken)
      localStorage.setItem('refresh_token', newRefreshToken)
      return newToken
    } catch (error: unknown) {
      // Use 'unknown' as the type for the error
      if (error instanceof AxiosError) {
        // Type guard to check if the error is an AxiosError
        if (error.response?.data?.code === 'REFRESH_TOKEN_EXPIRED') {
          console.error('Refresh token expired. Logging out...')
          this.logout()
          throw new Error('Session expired. Please login again.')
        }
        console.error('Error during token refresh:', error)
      }

      this.logout()
      throw new Error('Token refresh failed. Please login again.')
    }
  }

  logout(): void {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('sessionId')

    // Optional: notify server about logout
    const token = localStorage.getItem('token')
    if (token) {
      axios
        .post(
          `${API_BASE_URL}/auth/logout`,
          {},
          {
            headers: this.createHeaders(token),
            timeout: 3000,
          }
        )
        .catch(() => {
          // Ignore errors during logout API call
        })
    }
  }

  async checkSession(): Promise<boolean> {
    const token = localStorage.getItem('token')
    const sessionId = localStorage.getItem('sessionId')

    if (!token || !sessionId) {
      return false
    }

    try {
      await this.validateToken(token)
      return true
    } catch {
      return false
    }
  }
}

export const authService = new AuthService()
