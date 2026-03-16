import api from './api'
import type {
  InventoryMovement,
  PaginatedResponse,
  ApiResponse,
} from '../types'

// Movement Service - Track inventory movements via RFID/BLE
export const movementService = {
  // Get all movements with pagination
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
    const response = await api.get<PaginatedResponse<InventoryMovement>>(
      `/movements?${params.toString()}`
    )
    return response.data
  },

  // Get movement by ID
  getById: async (id: string) => {
    const response = await api.get<InventoryMovement>(
      `/movements/${encodeURIComponent(id)}`
    )
    return response.data
  },

  // Get movements by trolly
  getByTrolly: async (trollyId: string) => {
    const response = await api.get<InventoryMovement[]>(
      `/movements/trolly/${encodeURIComponent(trollyId)}`
    )
    return response.data
  },

  // Get movements by location
  getByLocation: async (locationId: string) => {
    const response = await api.get<InventoryMovement[]>(
      `/movements/location/${encodeURIComponent(locationId)}`
    )
    return response.data
  },

  // Create manual movement entry
  create: async (data: Omit<InventoryMovement, 'id' | 'createdAt'>) => {
    const response = await api.post<InventoryMovement>('/movements', data)
    return response.data
  },

  // Get movements by date range
  getByDateRange: async (startDate: string, endDate: string) => {
    const response = await api.get<ApiResponse<InventoryMovement[]>>(
      `/movements/date-range?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    )
    return response.data
  },

  // Get movements by type
  getByType: async (movementType: 'Entry' | 'Exit' | 'Internal Transfer') => {
    const response = await api.get<ApiResponse<InventoryMovement[]>>(
      `/movements/type/${encodeURIComponent(movementType)}`
    )
    return response.data
  },

  // Get movements by detection method
  getByDetectionMethod: async (detectedBy: 'RFID' | 'BLE' | 'Manual') => {
    const response = await api.get<ApiResponse<InventoryMovement[]>>(
      `/movements/detected-by/${encodeURIComponent(detectedBy)}`
    )
    return response.data
  },

  // Get real-time movements (last 100)
  getRealTime: async () => {
    const response = await api.get<ApiResponse<InventoryMovement[]>>(
      '/movements/real-time'
    )
    return response.data
  },

  // Get movement summary/statistics
  getSummary: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    })
    const response = await api.get<
      ApiResponse<{
        totalEntries: number
        totalExits: number
        totalTransfers: number
      }>
    >(`/movements/summary?${params}`)
    return response.data
  },

  // Get trolly current location
  getTrollyLocation: async (trollyId: string) => {
    const response = await api.get<
      ApiResponse<{
        trollyId: string
        currentLocation: string
        timestamp: string
      }>
    >(`/movements/trolly/${encodeURIComponent(trollyId)}/location`)
    return response.data
  },

  // Get movements through specific gate/antenna
  getByGate: async (gateId: string) => {
    const response = await api.get<ApiResponse<InventoryMovement[]>>(
      `/movements/gate/${encodeURIComponent(gateId)}`
    )
    return response.data
  },

  getByAntenna: async (antennaId: string) => {
    const response = await api.get<ApiResponse<InventoryMovement[]>>(
      `/movements/antenna/${encodeURIComponent(antennaId)}`
    )
    return response.data
  },
}

export default movementService
