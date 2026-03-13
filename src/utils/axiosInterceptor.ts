import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let isRefreshing = false
let isRedirecting = false
let failedQueue: {
  resolve: (token: string | null) => void
  reject: (error: unknown) => void
}[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

const forceLogout = () => {
  if (isRedirecting) return
  isRedirecting = true
  isRefreshing = false
  failedQueue = []
  localStorage.clear()
  window.location.href = '/login'
}

export const setupAxiosInterceptors = () => {
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      if (!config.url?.includes('/auth/refresh')) {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      config.headers['Content-Type'] = 'application/json'
      config.headers['Accept'] = 'application/json'
      return config
    },
    (error: AxiosError) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor
  axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as
        | CustomAxiosRequestConfig
        | undefined

      // Skip token refresh for auth endpoints (login, register, etc.)
      const isAuthEndpoint = originalRequest?.url?.includes('/auth/')

      // Handle 401 errors with token refresh — but NOT for auth endpoints
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isAuthEndpoint
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then((token) => {
              originalRequest!.headers.Authorization = `Bearer ${token}`
              return axios(originalRequest!)
            })
            .catch((err) => {
              return Promise.reject(err)
            })
        }

        originalRequest._retry = true
        isRefreshing = true

        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          console.warn('No refresh token found. Redirecting to login.')
          forceLogout()
          return Promise.reject(error)
        }

        try {
          const response = await axios.post<{
            token: string
            refreshToken: string
          }>(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          )

          const { token: newToken, refreshToken: newRefreshToken } =
            response.data

          localStorage.setItem('token', newToken)
          localStorage.setItem('refresh_token', newRefreshToken)

          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
          processQueue(null, newToken)
          isRefreshing = false

          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return axios(originalRequest)
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError)
          processQueue(refreshError, null)
          forceLogout()
          return Promise.reject(refreshError)
        }
      }

      // Handle session timeout
      if (error.response?.status === 403) {
        const responseData = error.response?.data as
          | { code?: string }
          | undefined
        if (responseData?.code === 'SESSION_EXPIRED') {
          console.warn('Session expired. Redirecting to login.')
          forceLogout()
          return Promise.reject(error)
        }
      }

      // For auth endpoints or other errors, just reject so the caller handles it
      return Promise.reject(error)
    }
  )
}
