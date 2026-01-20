import api from './api.ts'
import type { Trolly, PaginatedResponse } from '../types'

// Trolly Service - Manage trollies/containers
export const trollyService = {
  // Get all trollies with pagination
  getAll: async (
    page: number = 1,
    pageSize: number = 10,
    search: string = ''
  ): Promise<PaginatedResponse<Trolly>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
      ...(search && { search }),
    })
    const response = await api.get<PaginatedResponse<Trolly>>(
      `/trollies?${params.toString()}`
    )
    return response.data
  },

  // Get trolly by ID
  getById: async (id: string): Promise<Trolly> => {
    const response = await api.get<Trolly>(`/trollies/${id}`)
    return response.data
  },

  // Create new trolly
  create: async (data: {
    trolley_code: string
    trolley_type: string
    barcode?: string
    qr_code?: string
    length_mm: string
    width_mm: string
    height_mm: string
    volume_mm3?: string
    notes?: string
    status: string
  }): Promise<Trolly> => {
    const response = await api.post<Trolly>('/trollies', data)
    return response.data
  },

  // Update trolly
  update: async (
    id: string,
    data: {
      trolley_code?: string
      trolley_type?: string
      barcode?: string
      qr_code?: string
      length_mm?: string
      width_mm?: string
      height_mm?: string
      volume_mm3?: string
      notes?: string
      status?: string
    }
  ): Promise<Trolly> => {
    const response = await api.put<Trolly>(`/trollies/${id}`, data)
    return response.data
  },

  // Delete trolly (soft delete - sets status to Inactive)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/trollies/${id}`)
  },
}

export default trollyService
