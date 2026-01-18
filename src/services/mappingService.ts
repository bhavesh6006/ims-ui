import apiClient from './apiClient'
import type {
  TrollyMaterialMapping,
  PaginatedResponse,
  ApiResponse,
} from '../types'

// Trolly Material Mapping Service - Manage compatibility rules
export const mappingService = {
  // Get all mappings with pagination
  getAll: async (page: number = 1, pageSize: number = 10, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(search && { search }),
    })
    const response = await apiClient.get<
      PaginatedResponse<TrollyMaterialMapping>
    >(`/trolly-material-mappings?${params}`)
    return response.data
  },

  // Get mapping by ID
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<TrollyMaterialMapping>>(
      `/trolly-material-mappings/${id}`
    )
    return response.data
  },

  // Get mapping by trolly type and material type
  getByTypes: async (trollyType: string, materialType: string) => {
    const response = await apiClient.get<ApiResponse<TrollyMaterialMapping>>(
      `/trolly-material-mappings/types?trollyType=${trollyType}&materialType=${materialType}`
    )
    return response.data
  },

  // Get mappings for a trolly type
  getByTrollyType: async (trollyType: string) => {
    const response = await apiClient.get<ApiResponse<TrollyMaterialMapping[]>>(
      `/trolly-material-mappings/trolly-type/${trollyType}`
    )
    return response.data
  },

  // Get mappings for a material type
  getByMaterialType: async (materialType: string) => {
    const response = await apiClient.get<ApiResponse<TrollyMaterialMapping[]>>(
      `/trolly-material-mappings/material-type/${materialType}`
    )
    return response.data
  },

  // Validate trolly-material compatibility
  validateCompatibility: async (
    trollyType: string,
    materialType: string,
    quantity: number
  ) => {
    const response = await apiClient.post<
      ApiResponse<{ compatible: boolean; maxCapacity: number }>
    >('/trolly-material-mappings/validate', {
      trollyType,
      materialType,
      quantity,
    })
    return response.data
  },

  // Create new mapping
  create: async (
    mapping: Omit<TrollyMaterialMapping, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const response = await apiClient.post<ApiResponse<TrollyMaterialMapping>>(
      '/trolly-material-mappings',
      mapping
    )
    return response.data
  },

  // Update mapping
  update: async (id: string, mapping: Partial<TrollyMaterialMapping>) => {
    const response = await apiClient.put<ApiResponse<TrollyMaterialMapping>>(
      `/trolly-material-mappings/${id}`,
      mapping
    )
    return response.data
  },

  // Delete mapping
  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/trolly-material-mappings/${id}`
    )
    return response.data
  },

  // Get active mappings
  getActive: async () => {
    const response = await apiClient.get<ApiResponse<TrollyMaterialMapping[]>>(
      '/trolly-material-mappings/active'
    )
    return response.data
  },
}

export default mappingService
