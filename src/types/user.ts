export interface User extends Record<string, unknown> {
  user_id: string
  username: string
  email: string
  role: 'Admin' | 'StoreManager' | 'Operator'
  status: 'ACTIVE' | 'INACTIVE'
  created_at?: string
  updated_at?: string
}
