export enum UserRole {
  ADMIN = 'Admin',
  STORE_MANAGER = 'Store Manager',
  OPERATOR = 'Operator',
}

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  status: boolean // true = active, false = inactive
}

export interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
  refreshToken?: () => Promise<void>
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: User
}
