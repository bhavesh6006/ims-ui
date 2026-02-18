import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { canAccessApi } from './permissions'
import { UserRole } from '../types/auth.types'

/**
 * Attaches a request interceptor to the given Axios instance that
 * rejects requests the current user's role is not permitted to make.
 */
export const setupApiPermissionInterceptor = (
  axiosInstance: AxiosInstance,
  getRoleFromStore: () => UserRole | null
) => {
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const role = getRoleFromStore()

      if (!role) {
        return Promise.reject(
          new Error('Unauthorized: No user role found. Please log in.')
        )
      }

      const url = config.url || ''
      const method = (config.method || 'GET').toUpperCase()

      // Skip permission check for auth-related endpoints (login, refresh, etc.)
      if (
        /\/auth/i.test(url) ||
        /\/login/i.test(url) ||
        /\/refresh/i.test(url)
      ) {
        return config
      }

      //   console.log(`[API Permission] Role: ${role}, Method: ${method}, URL: ${url}`);

      if (!canAccessApi(role, url, method)) {
        const action = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
          ? 'modify'
          : 'view'
        console.warn(
          `[API Permission] BLOCKED - Role: ${role}, Action: ${action}, URL: ${url}`
        )
        return Promise.reject(
          new Error(
            `Access Denied: Your role (${role}) does not have permission to ${action} this resource.`
          )
        )
      }

      return config
    },
    (error) => Promise.reject(error)
  )
}
