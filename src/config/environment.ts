// Environment configuration manager
export const config = {
  apiBaseUrl:
    (window as unknown as { __APP_CONFIG__?: { API_BASE_URL?: string } })
      .__APP_CONFIG__?.API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:3000/api',
  apiTimeout: 30000,
  environment: import.meta.env.MODE || 'development',
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
} as const

export default config
