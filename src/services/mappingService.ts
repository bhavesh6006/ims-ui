import api from './api'
import type { TrollyMaterialMapping, PaginatedResponse } from '../types'

export interface MaterialTrolleyMapping extends TrollyMaterialMapping {
  material?: {
    material_id: number
    material_code: string
    material_name: string
  }
  trolleyType?: {
    trolley_type_id: number
    trolly_type: string
  }
  max_quantity: number
}

// Trolly Material Mapping Service - Manage compatibility rules
export const mappingService = {
  // Get all mappings with pagination
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
    const response = await api.get<PaginatedResponse<TrollyMaterialMapping>>(
      `/trolley-material-mapping?${params.toString()}`
    )
    return response.data
  },

  // Get mapping by ID
  getById: async (id: string) => {
    const response = await api.get<TrollyMaterialMapping>(`/mappings/${id}`)
    return response.data
  },

  // Create new mapping
  create: async (
    data: Omit<
      TrollyMaterialMapping,
      'id' | 'createdAt' | 'updatedAt' | 'version'
    >
  ) => {
    const response = await api.post<TrollyMaterialMapping>(
      '/trolley-material-mapping',
      data
    )
    return response.data
  },

  // Update mapping
  update: async (id: string, data: Partial<TrollyMaterialMapping>) => {
    const response = await api.put<TrollyMaterialMapping>(
      `/trolley-material-mapping/${id}`,
      data
    )
    return response.data
  },

  // Delete mapping
  delete: async (id: string) => {
    const response = await api.delete(`/trolley-material-mapping/${id}`)
    return response.data
  },

  // Get material-trolley mapping by material_id and trolley_type_id
  getMaterialTrolleyMapping: async (
    materialId: string,
    trolleyTypeId: string
  ) => {
    const params = new URLSearchParams({
      material_id: materialId,
      trolley_type_id: trolleyTypeId,
    })
    const response = await api.get<{
      success: boolean
      data: MaterialTrolleyMapping
    }>(`/trolley-material-mapping/by-material-and-type?${params.toString()}`)
    return response.data
  },
}

export default mappingService
