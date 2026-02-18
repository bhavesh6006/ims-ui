import axios, { type AxiosInstance, type AxiosError } from 'axios'
import { setupApiPermissionInterceptor } from '../utils/apiPermissionInterceptor'
import { normalizeRole } from '../utils/permissions'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Permission interceptor - block unauthorized API calls before they are sent
setupApiPermissionInterceptor(api, () => {
  try {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      return user?.role ? normalizeRole(user.role) : null
    }
    return null
  } catch {
    return null
  }
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token') || localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token')
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
          break
        case 403:
          console.error('Access forbidden')
          break
        case 404:
          console.error('Resource not found')
          break
        case 500:
          console.error('Server error')
          break
      }
    } else if (error.request) {
      console.error('No response received from server')
    } else {
      console.error('Error setting up request:', error.message)
    }
    return Promise.reject(error)
  }
)

export default api
