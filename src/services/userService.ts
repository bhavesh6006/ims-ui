import apiClient from './api'
import type { User } from '../types/user'

export const userService = {
  async getAll(page?: number, limit?: number, search?: string) {
    const params: Record<string, string | number> = {}
    if (page) params.page = page
    if (limit) params.limit = limit
    if (search) params.search = search

    const response = await apiClient.get('/users', { params })
    return response.data
  },

  async create(data: Omit<User, 'user_id'>) {
    const response = await apiClient.post('/users', data)
    return response.data
  },

  async update(id: string, data: Partial<User>) {
    const response = await apiClient.put(`/users/${id}`, data)
    return response.data
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/users/${id}`)
    return response.data
  },
}
