import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

// Material Stock Interface
export interface MaterialStock {
  id: string
  materialCode: string
  trolleyCode: string
  quantity: number
  location?: string // For future RFID antenna integration
  workOrderId: string
  workOrderNumber: string
  loadingType: 'FULL' | 'PARTIAL'
  loadedBy: string
  loadedAt: string
  status: 'IN_STOCK' | 'IN_TRANSIT' | 'CONSUMED'
  remarks?: string
  createdAt: string
  updatedAt: string
}

// Material Stock Service - Manage material stock records
export const materialStockService = {
  // Get all stock records with pagination
  getAll: async (
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      materialCode?: string
      trolleyCode?: string
      status?: string
      location?: string
    }
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
      ...(filters?.materialCode && { materialCode: filters.materialCode }),
      ...(filters?.trolleyCode && { trolleyCode: filters.trolleyCode }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.location && { location: filters.location }),
    })
    const response = await api.get<PaginatedResponse<MaterialStock>>(
      `/material-stock?${params.toString()}`
    )
    return response.data
  },

  // Get stock by ID
  getById: async (id: string) => {
    const response = await api.get<MaterialStock>(
      `/material-stock/${encodeURIComponent(id)}`
    )
    return response.data
  },

  // Get stock by material code
  getByMaterialCode: async (materialCode: string) => {
    const response = await api.get<MaterialStock[]>(
      `/material-stock/material/${encodeURIComponent(materialCode)}`
    )
    return response.data
  },

  // Get stock by trolley code
  getByTrolleyCode: async (trolleyCode: string) => {
    const response = await api.get<MaterialStock[]>(
      `/material-stock/trolley/${encodeURIComponent(trolleyCode)}`
    )
    return response.data
  },

  // Get stock by location
  getByLocation: async (location: string) => {
    const response = await api.get<MaterialStock[]>(
      `/material-stock/location/${encodeURIComponent(location)}`
    )
    return response.data
  },

  // Create new stock record
  createStock: async (
    data: Omit<MaterialStock, 'id' | 'createdAt' | 'updatedAt' | 'loadedAt'>
  ) => {
    const response = await api.post<ApiResponse<MaterialStock>>(
      '/material-stock',
      data
    )
    return response.data
  },

  // Update stock record
  updateStock: async (id: string, data: Partial<MaterialStock>) => {
    const response = await api.put<ApiResponse<MaterialStock>>(
      `/material-stock/${id}`,
      data
    )
    return response.data
  },

  // Update location (for RFID antenna integration)
  updateLocation: async (id: string, location: string) => {
    const response = await api.patch<ApiResponse<MaterialStock>>(
      `/material-stock/${id}/location`,
      { location }
    )
    return response.data
  },

  // Update status
  updateStatus: async (
    id: string,
    status: 'IN_STOCK' | 'IN_TRANSIT' | 'CONSUMED'
  ) => {
    const response = await api.patch<ApiResponse<MaterialStock>>(
      `/material-stock/${id}/status`,
      { status }
    )
    return response.data
  },

  // Delete stock record
  delete: async (id: string) => {
    await api.delete(`/material-stock/${id}`)
  },

  // Get stock summary by material code
  getStockSummary: async (materialCode: string) => {
    const response = await api.get<{
      materialCode: string
      totalQuantity: number
      locations: Array<{
        location: string
        quantity: number
        trolleyCount: number
      }>
    }>(`/material-stock/summary/${encodeURIComponent(materialCode)}`)
    return response.data
  },

  // Get stock by work order
  getByWorkOrder: async (workOrderId: string) => {
    const response = await api.get<MaterialStock[]>(
      `/material-stock/work-order/${encodeURIComponent(workOrderId)}`
    )
    return response.data
  },
}

export default materialStockService
