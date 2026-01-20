import api from './api'
import type { Material, PaginatedResponse, ApiResponse } from '../types'

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
    const response = await api.get<Material>(`/materials/${id}`)
    return response.data
  },

  // Get material by Material ID (unique identifier)
  getByMaterialId: async (materialId: string) => {
    const response = await api.get<ApiResponse<Material>>(
      `/materials/material-id/${materialId}`
    )
    return response.data
  },

  // Create new material
  create: async (data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<Material>('/materials', data)
    return response.data
  },

  // Update material
  update: async (id: string, data: Partial<Material>) => {
    const response = await api.put<Material>(`/materials/${id}`, data)
    return response.data
  },

  // Delete material (soft delete - sets status to Inactive)
  delete: async (id: string) => {
    await api.delete(`/materials/${id}`)
  },

  // Get material types
  getMaterialTypes: async () => {
    const response = await api.get<ApiResponse<string[]>>('/materials/types')
    return response.data
  },

  // Get materials by type
  getByType: async (materialType: string) => {
    const response = await api.get<ApiResponse<Material[]>>(
      `/materials/type/${materialType}`
    )
    return response.data
  },

  // Get active materials
  getActive: async () => {
    const response = await api.get<ApiResponse<Material[]>>('/materials/active')
    return response.data
  },

  // Get allowed positions
  getAllowedPositions: async () => {
    const response = await api.get<ApiResponse<string[]>>(
      '/materials/positions'
    )
    return response.data
  },
}

export default materialService
