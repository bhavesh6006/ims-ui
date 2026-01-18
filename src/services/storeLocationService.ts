import apiClient from './apiClient'
import type { StoreLocation, PaginatedResponse, ApiResponse } from '../types'

// Store Location Service - Manage store locations
export const storeLocationService = {
  // Get all store locations with pagination
  getAll: async (page: number = 1, pageSize: number = 10, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(search && { search }),
    })
    const response = await apiClient.get<PaginatedResponse<StoreLocation>>(
      `/store-locations?${params}`
    )
    return response.data
  },

  // Get store location by ID
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<StoreLocation>>(
      `/store-locations/${id}`
    )
    return response.data
  },

  // Get store location by Store Location ID
  getByStoreLocationId: async (storeLocationId: string) => {
    const response = await apiClient.get<ApiResponse<StoreLocation>>(
      `/store-locations/location-id/${storeLocationId}`
    )
    return response.data
  },

  // Get store locations by factory
  getByFactory: async (factoryName: string) => {
    const response = await apiClient.get<ApiResponse<StoreLocation[]>>(
      `/store-locations/factory/${factoryName}`
    )
    return response.data
  },

  // Get store locations by plant/building
  getByPlant: async (plantBuildingName: string) => {
    const response = await apiClient.get<ApiResponse<StoreLocation[]>>(
      `/store-locations/plant/${plantBuildingName}`
    )
    return response.data
  },

  // Create new store location
  create: async (
    storeLocation: Omit<StoreLocation, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const response = await apiClient.post<ApiResponse<StoreLocation>>(
      '/store-locations',
      storeLocation
    )
    return response.data
  },

  // Update store location
  update: async (id: string, storeLocation: Partial<StoreLocation>) => {
    const response = await apiClient.put<ApiResponse<StoreLocation>>(
      `/store-locations/${id}`,
      storeLocation
    )
    return response.data
  },

  // Delete store location (soft delete)
  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/store-locations/${id}`
    )
    return response.data
  },

  // Get hierarchy structure (factories, plants, stores)
  getHierarchy: async () => {
    const response = await apiClient.get<
      ApiResponse<{ factory: string; plant: string; store: string }[]>
    >('/store-locations/hierarchy')
    return response.data
  },

  // Associate RFID antenna with store location
  associateRFIDantenna: async (storeLocationId: string, antennaId: string) => {
    const response = await apiClient.post<ApiResponse<void>>(
      `/store-locations/${storeLocationId}/rfid-antennas`,
      {
        antennaId,
      }
    )
    return response.data
  },

  // Associate BLE gateway with store location
  associateBLEgateway: async (storeLocationId: string, gatewayId: string) => {
    const response = await apiClient.post<ApiResponse<void>>(
      `/store-locations/${storeLocationId}/ble-gateways`,
      {
        gatewayId,
      }
    )
    return response.data
  },

  // Get active store locations
  getActive: async () => {
    const response = await apiClient.get<ApiResponse<StoreLocation[]>>(
      '/store-locations/active'
    )
    return response.data
  },
}

export default storeLocationService
