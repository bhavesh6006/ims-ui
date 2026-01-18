import apiClient from './apiClient'
import type { Trolly, PaginatedResponse, ApiResponse } from '../types'

// Trolly Service - Manage trollies/containers
export const trollyService = {
  // Get all trollies with pagination
  getAll: async (page: number = 1, pageSize: number = 10, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(search && { search }),
    })
    const response = await apiClient.get<PaginatedResponse<Trolly>>(
      `/trollies?${params}`
    )
    return response.data
  },

  // Get trolly by ID
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Trolly>>(`/trollies/${id}`)
    return response.data
  },

  // Get trolly by Trolly ID (unique identifier)
  getByTrollyId: async (trollyId: string) => {
    const response = await apiClient.get<ApiResponse<Trolly>>(
      `/trollies/trolly-id/${trollyId}`
    )
    return response.data
  },

  // Scan trolly by barcode or QR code
  scanTrolly: async (code: string, codeType: 'barcode' | 'qr') => {
    const response = await apiClient.post<ApiResponse<Trolly>>(
      '/trollies/scan',
      {
        code,
        codeType,
      }
    )
    return response.data
  },

  // Create new trolly
  create: async (trolly: Omit<Trolly, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await apiClient.post<ApiResponse<Trolly>>(
      '/trollies',
      trolly
    )
    return response.data
  },

  // Update trolly
  update: async (id: string, trolly: Partial<Trolly>) => {
    const response = await apiClient.put<ApiResponse<Trolly>>(
      `/trollies/${id}`,
      trolly
    )
    return response.data
  },

  // Delete trolly (soft delete - sets status to Inactive)
  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/trollies/${id}`
    )
    return response.data
  },

  // Get trolly types
  getTrollyTypes: async () => {
    const response =
      await apiClient.get<ApiResponse<string[]>>('/trollies/types')
    return response.data
  },

  // Get active trollies
  getActive: async () => {
    const response =
      await apiClient.get<ApiResponse<Trolly[]>>('/trollies/active')
    return response.data
  },

  // Alias for scanTrolly - convenience method
  scan: async (code: string) => {
    return trollyService.scanTrolly(code, code.length > 20 ? 'qr' : 'barcode')
  },
}

export default trollyService
