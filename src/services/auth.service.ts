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

      // Store token and user data
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
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
    const currentToken = localStorage.getItem('token')

    if (!currentToken) {
      throw new Error('No token found')
    }

    try {
      const response = await axios.post<{ token: string }>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          headers: this.createHeaders(currentToken),
          timeout: 5000,
        }
      )

      const newToken = response.data.token
      localStorage.setItem('token', newToken)
      return newToken
    } catch {
      this.logout()
      throw new Error('Token refresh failed. Please login again.')
    }
  }

  logout(): void {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('token')
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
