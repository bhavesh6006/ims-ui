import api from './api'
import type { Material, PaginatedResponse } from '../types'

// Material Service - Manage materials
export const materialService = {
  // Get all materials with pagination
  getAll: async (
    page: number = 1,
    pageSize: number = 10,
    search: string = ''
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
      ...(search && { search }),
    })
    const response = await api.get<PaginatedResponse<Material>>(
      `/materials?${params.toString()}`
    )
    return response.data
  },

  // Get material by ID
  getById: async (id: string) => {
    const response = await api.get<Material>(
      `/materials/${encodeURIComponent(id)}`
    )
    return response.data
  },

  // Get material by code
  getByCode: async (code: string) => {
    const response = await api.get(
      `/materials/code/${encodeURIComponent(code)}`
    )
    return response.data
  },

  // Create new material
  create: async (
    data: Omit<Material, 'material_id' | 'createdAt' | 'updatedAt'>
  ) => {
    const response = await api.post<Material>('/materials', data)
    return response.data
  },

  // Update material
  update: async (id: string, data: Partial<Material>) => {
    const response = await api.put<Material>(`/materials/${id}`, data)
    return response.data
  },

  // Delete material
  delete: async (id: string) => {
    await api.delete(`/materials/${id}`)
  },
}

export default materialService
