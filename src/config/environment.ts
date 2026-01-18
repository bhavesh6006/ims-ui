// Environment configuration manager
export const config = {
  env: import.meta.env.VITE_APP_ENV || 'development',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  appName: import.meta.env.VITE_APP_NAME || 'IMS',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  isDevelopment: import.meta.env.VITE_APP_ENV === 'development',
  isTest: import.meta.env.VITE_APP_ENV === 'test',
  isProduction: import.meta.env.VITE_APP_ENV === 'production',
} as const

export default config
