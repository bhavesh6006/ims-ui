import api from './api'

export interface Antenna {
  antenna_id: number
  device_id: number
  antenna_no: number
  antenna_name?: string
  location_name?: string
  store_location_id?: string
  zone_id?: number
  antenna_type?: string
  polarization?: string
  manufacturer?: string
  model?: string
  tx_power_dbm?: number
  rx_sensitivity?: number
  orientation?: string
  mounting_height_m?: number
  facing_angle_deg?: number
  is_enabled: boolean
  is_connected: boolean
  last_seen_time?: string
  created_at: string
  updated_at: string
  device?: {
    device_id: number
    device_name: string
    ip_address: string
    location?: string
  }
}

export interface AntennaCreatePayload {
  device_id: number
  antenna_no: number
  antenna_name?: string
  location_name?: string
  store_location_id?: string
  zone_id?: number
  antenna_type?: string
  polarization?: string
  manufacturer?: string
  model?: string
  orientation?: string
  mounting_height_m?: number
  facing_angle_deg?: number
  is_enabled?: boolean
}

export interface AntennaUpdatePayload {
  antenna_no?: number
  antenna_name?: string
  location_name?: string
  store_location_id?: string
  zone_id?: number
  antenna_type?: string
  polarization?: string
  manufacturer?: string
  model?: string
  tx_power_dbm?: number
  rx_sensitivity?: number
  orientation?: string
  mounting_height_m?: number
  facing_angle_deg?: number
  is_enabled?: boolean
}

export interface AntennaResponse {
  success: boolean
  count: number
  data: Antenna[]
}

export const antennaService = {
  getAll: async (page?: number, limit?: number, search?: string) => {
    const params: Record<string, string | number> = {}
    if (page) params.page = page
    if (limit) params.limit = limit
    if (search) params.search = search

    const response = await api.get<AntennaResponse>('/antennas', { params })
    return response.data
  },

  getByDevice: async (deviceId: number) => {
    const response = await api.get<AntennaResponse>(
      `/antennas/device/${encodeURIComponent(deviceId)}`
    )
    return response.data
  },

  getAllUnmapped: async () => {
    const response = await api.get<AntennaResponse>('/getUnmappedAntennas')
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: Antenna }>(
      `/antennas/${encodeURIComponent(id)}`
    )
    return response.data
  },

  create: async (data: AntennaCreatePayload) => {
    const response = await api.post<{ success: boolean; data: Antenna }>(
      '/antennas',
      data
    )
    return response.data
  },

  update: async (id: number, data: AntennaUpdatePayload) => {
    const response = await api.put<{ success: boolean; data: Antenna }>(
      `/antennas/${id}`,
      data
    )
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/antennas/${id}`)
    return response.data
  },

  updateStatus: async (
    deviceId: number,
    antennaNo: number,
    statusData: {
      is_connected?: boolean
      tx_power_dbm?: number
      rx_sensitivity?: number
    }
  ) => {
    const response = await api.put(
      `/antennas/status/${deviceId}/${antennaNo}`,
      statusData
    )
    return response.data
  },
}

export default antennaService
