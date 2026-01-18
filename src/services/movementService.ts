import apiClient from './apiClient'
import type {
  InventoryMovement,
  PaginatedResponse,
  ApiResponse,
} from '../types'

// Movement Service - Track inventory movements via RFID/BLE
export const movementService = {
  // Get all movements with pagination
  getAll: async (page: number = 1, pageSize: number = 10, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(search && { search }),
    })
    const response = await apiClient.get<PaginatedResponse<InventoryMovement>>(
      `/movements?${params}`
    )
    return response.data
  },

  // Get movement by ID
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<InventoryMovement>>(
      `/movements/${id}`
    )
    return response.data
  },

  // Get movements by trolly
  getByTrolly: async (trollyId: string) => {
    const response = await apiClient.get<ApiResponse<InventoryMovement[]>>(
      `/movements/trolly/${trollyId}`
    )
    return response.data
  },

  // Get movements by location
  getByLocation: async (locationId: string) => {
    const response = await apiClient.get<ApiResponse<InventoryMovement[]>>(
      `/movements/location/${locationId}`
    )
    return response.data
  },

  // Get movements by date range
  getByDateRange: async (startDate: string, endDate: string) => {
    const response = await apiClient.get<ApiResponse<InventoryMovement[]>>(
      `/movements/date-range?startDate=${startDate}&endDate=${endDate}`
    )
    return response.data
  },

  // Get movements by type
  getByType: async (movementType: 'Entry' | 'Exit' | 'Internal Transfer') => {
    const response = await apiClient.get<ApiResponse<InventoryMovement[]>>(
      `/movements/type/${movementType}`
    )
    return response.data
  },

  // Get movements by detection method
  getByDetectionMethod: async (detectedBy: 'RFID' | 'BLE' | 'Manual') => {
    const response = await apiClient.get<ApiResponse<InventoryMovement[]>>(
      `/movements/detected-by/${detectedBy}`
    )
    return response.data
  },

  // Create manual movement entry
  createManual: async (
    movement: Omit<InventoryMovement, 'id' | 'createdAt'>
  ) => {
    const response = await apiClient.post<ApiResponse<InventoryMovement>>(
      '/movements/manual',
      movement
    )
    return response.data
  },

  // Get real-time movements (last 100)
  getRealTime: async () => {
    const response = await apiClient.get<ApiResponse<InventoryMovement[]>>(
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
    const response = await apiClient.get<
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
    const response = await apiClient.get<
      ApiResponse<{
        trollyId: string
        currentLocation: string
        timestamp: string
      }>
    >(`/movements/trolly/${trollyId}/location`)
    return response.data
  },

  // Get movements through specific gate/antenna
  getByGate: async (gateId: string) => {
    const response = await apiClient.get<ApiResponse<InventoryMovement[]>>(
      `/movements/gate/${gateId}`
    )
    return response.data
  },

  getByAntenna: async (antennaId: string) => {
    const response = await apiClient.get<ApiResponse<InventoryMovement[]>>(
      `/movements/antenna/${antennaId}`
    )
    return response.data
  },
}

export default movementService
