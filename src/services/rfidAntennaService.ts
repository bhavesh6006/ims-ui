import api from './api'
import type { RFIDAntenna, PaginatedResponse, ApiResponse } from '../types'

// RFID Antenna Service - Manage RFID antennas
export const rfidAntennaService = {
  // Get all RFID antennas with pagination
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
    const response = await api.get<PaginatedResponse<RFIDAntenna>>(
      `/rfid-antennas?${params.toString()}`
    )
    return response.data
  },

  // Get RFID antenna by ID
  getById: async (id: string) => {
    const response = await api.get<RFIDAntenna>(`/rfid-antennas/${id}`)
    return response.data
  },

  // Get RFID antenna by Antenna ID
  getByAntennaId: async (antennaId: string) => {
    const response = await api.get<ApiResponse<RFIDAntenna>>(
      `/rfid-antennas/antenna-id/${antennaId}`
    )
    return response.data
  },

  // Get antennas by reader ID
  getByReaderId: async (readerId: string) => {
    const response = await api.get<ApiResponse<RFIDAntenna[]>>(
      `/rfid-antennas/reader/${readerId}`
    )
    return response.data
  },

  // Get antennas by store location
  getByStoreLocation: async (storeLocationId: string) => {
    const response = await api.get<ApiResponse<RFIDAntenna[]>>(
      `/rfid-antennas/store-location/${storeLocationId}`
    )
    return response.data
  },

  // Get antennas by role
  getByRole: async (role: string) => {
    const response = await api.get<ApiResponse<RFIDAntenna[]>>(
      `/rfid-antennas/role/${role}`
    )
    return response.data
  },

  // Get antennas by status
  getByStatus: async (status: 'Active' | 'Inactive' | 'Maintenance') => {
    const response = await api.get<ApiResponse<RFIDAntenna[]>>(
      `/rfid-antennas/status/${status}`
    )
    return response.data
  },

  // Create new RFID antenna
  create: async (data: Omit<RFIDAntenna, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<RFIDAntenna>('/rfid-antennas', data)
    return response.data
  },

  // Update RFID antenna
  update: async (id: string, data: Partial<RFIDAntenna>) => {
    const response = await api.put<RFIDAntenna>(`/rfid-antennas/${id}`, data)
    return response.data
  },

  // Delete RFID antenna
  delete: async (id: string) => {
    await api.delete(`/rfid-antennas/${id}`)
  },

  // Update antenna configuration
  updateConfiguration: async (
    id: string,
    config: { txPower?: number; frequencyRange?: string; gain?: number }
  ) => {
    const response = await api.patch<ApiResponse<RFIDAntenna>>(
      `/rfid-antennas/${id}/config`,
      config
    )
    return response.data
  },

  // Set antenna to maintenance mode
  setMaintenance: async (id: string, inMaintenance: boolean) => {
    const response = await api.patch<ApiResponse<RFIDAntenna>>(
      `/rfid-antennas/${id}/maintenance`,
      {
        status: inMaintenance ? 'Maintenance' : 'Active',
      }
    )
    return response.data
  },

  // Get active antennas
  getActive: async () => {
    const response = await api.get<ApiResponse<RFIDAntenna[]>>(
      '/rfid-antennas/active'
    )
    return response.data
  },
}

export default rfidAntennaService
