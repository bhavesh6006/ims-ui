export interface User extends Record<string, unknown> {
  user_id: string
  ldap_username: string
  display_name: string
  email: string
  is_active: boolean
}

export interface UserRole extends Record<string, unknown> {
  role_id: string
  role_name: string
}

export interface UserRoleMapping extends Record<string, unknown> {
  user_id: string
  role_id: string
}
