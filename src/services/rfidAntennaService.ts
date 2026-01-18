import apiClient from './apiClient'
import type { RFIDAntenna, PaginatedResponse, ApiResponse } from '../types'

// RFID Antenna Service - Manage RFID antennas
export const rfidAntennaService = {
  // Get all RFID antennas with pagination
  getAll: async (page: number = 1, pageSize: number = 10, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(search && { search }),
    })
    const response = await apiClient.get<PaginatedResponse<RFIDAntenna>>(
      `/rfid-antennas?${params}`
    )
    return response.data
  },

  // Get RFID antenna by ID
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<RFIDAntenna>>(
      `/rfid-antennas/${id}`
    )
    return response.data
  },

  // Get RFID antenna by Antenna ID
  getByAntennaId: async (antennaId: string) => {
    const response = await apiClient.get<ApiResponse<RFIDAntenna>>(
      `/rfid-antennas/antenna-id/${antennaId}`
    )
    return response.data
  },

  // Get antennas by reader ID
  getByReaderId: async (readerId: string) => {
    const response = await apiClient.get<ApiResponse<RFIDAntenna[]>>(
      `/rfid-antennas/reader/${readerId}`
    )
    return response.data
  },

  // Get antennas by store location
  getByStoreLocation: async (storeLocationId: string) => {
    const response = await apiClient.get<ApiResponse<RFIDAntenna[]>>(
      `/rfid-antennas/store-location/${storeLocationId}`
    )
    return response.data
  },

  // Get antennas by role
  getByRole: async (role: string) => {
    const response = await apiClient.get<ApiResponse<RFIDAntenna[]>>(
      `/rfid-antennas/role/${role}`
    )
    return response.data
  },

  // Get antennas by status
  getByStatus: async (status: 'Active' | 'Inactive' | 'Maintenance') => {
    const response = await apiClient.get<ApiResponse<RFIDAntenna[]>>(
      `/rfid-antennas/status/${status}`
    )
    return response.data
  },

  // Create new RFID antenna
  create: async (
    antenna: Omit<RFIDAntenna, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const response = await apiClient.post<ApiResponse<RFIDAntenna>>(
      '/rfid-antennas',
      antenna
    )
    return response.data
  },

  // Update RFID antenna
  update: async (id: string, antenna: Partial<RFIDAntenna>) => {
    const response = await apiClient.put<ApiResponse<RFIDAntenna>>(
      `/rfid-antennas/${id}`,
      antenna
    )
    return response.data
  },

  // Delete RFID antenna
  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/rfid-antennas/${id}`
    )
    return response.data
  },

  // Update antenna configuration
  updateConfiguration: async (
    id: string,
    config: { txPower?: number; frequencyRange?: string; gain?: number }
  ) => {
    const response = await apiClient.patch<ApiResponse<RFIDAntenna>>(
      `/rfid-antennas/${id}/config`,
      config
    )
    return response.data
  },

  // Set antenna to maintenance mode
  setMaintenance: async (id: string, inMaintenance: boolean) => {
    const response = await apiClient.patch<ApiResponse<RFIDAntenna>>(
      `/rfid-antennas/${id}/maintenance`,
      {
        status: inMaintenance ? 'Maintenance' : 'Active',
      }
    )
    return response.data
  },

  // Get active antennas
  getActive: async () => {
    const response = await apiClient.get<ApiResponse<RFIDAntenna[]>>(
      '/rfid-antennas/active'
    )
    return response.data
  },
}

export default rfidAntennaService
