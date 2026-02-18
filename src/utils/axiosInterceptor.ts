import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let isRefreshing = false
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

export const setupAxiosInterceptors = () => {
  // Request interceptor
  axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
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

      // Handle 401 errors with token refresh
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry
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

        const token = localStorage.getItem('token')
        if (!token) {
          localStorage.clear()
          window.location.href = '/login'
          return Promise.reject(error)
        }

        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )

          const newToken = response.data.token
          localStorage.setItem('token', newToken)
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
          processQueue(null, newToken)
          isRefreshing = false

          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return axios(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          isRefreshing = false
          localStorage.clear()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }

      // Handle session timeout
      if (
        error.response?.status === 403 &&
        error.response?.data?.code === 'SESSION_EXPIRED'
      ) {
        localStorage.clear()
        window.location.href = '/login'
      }

      return Promise.reject(error)
    }
  )
}
