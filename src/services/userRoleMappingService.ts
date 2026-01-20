import apiClient from './api'
import type { UserRoleMapping } from '../types/user'

export const userRoleMappingService = {
  async getAll() {
    const response = await apiClient.get('/user-role-mappings')
    return response.data
  },

  async getByUserId(userId: string) {
    const response = await apiClient.get(`/user-role-mappings/${userId}`)
    return response.data
  },

  async create(data: UserRoleMapping) {
    const response = await apiClient.post('/user-role-mappings', data)
    return response.data
  },

  async update(userId: string, data: { role_id: string }) {
    const response = await apiClient.put(`/user-role-mappings/${userId}`, data)
    return response.data
  },

  async delete(userId: string) {
    const response = await apiClient.delete(`/user-role-mappings/${userId}`)
    return response.data
  },
}
