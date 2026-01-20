import apiClient from './api'
import type { UserRole } from '../types/user'

export const userRoleService = {
  async getAll() {
    const response = await apiClient.get('/user-roles')
    return response.data
  },

  async create(data: Omit<UserRole, 'role_id'>) {
    const response = await apiClient.post('/user-roles', data)
    return response.data
  },

  async update(id: string, data: Partial<UserRole>) {
    const response = await apiClient.put(`/user-roles/${id}`, data)
    return response.data
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/user-roles/${id}`)
    return response.data
  },
}
