import api from './api'
import type { TrollyMaterialMapping, PaginatedResponse } from '../types'

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
      `/mappings?${params.toString()}`
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
    const response = await api.post<TrollyMaterialMapping>('/mappings', data)
    return response.data
  },

  // Update mapping
  update: async (id: string, data: Partial<TrollyMaterialMapping>) => {
    const response = await api.put<TrollyMaterialMapping>(
      `/mappings/${id}`,
      data
    )
    return response.data
  },

  // Delete mapping
  delete: async (id: string) => {
    await api.delete(`/mappings/${id}`)
  },

  // Get material-trolley mapping by material code and trolley code
  getMaterialTrolleyMapping: async (
    materialCode: string,
    trolleyCode: string
  ) => {
    const response = await api.get<{ quantity: number; maxCapacity: number }>(
      `/mappings/material-trolley/${materialCode}/${trolleyCode}`
    )
    return response
  },
}

export default mappingService
