import api from './api'

export interface Antenna {
  antenna_id: string
  antenna_code: string
  antenna_name: string
  antenna_type: string
  frequency_range?: string
  gain_dbi?: string
  reader_id?: string
  reader_port?: number
  antenna_role?: string
  orientation?: string
  mounting_type?: string
  tx_power_dbm?: string
  coverage_desc?: string
  status: 'ACTIVE' | 'INACTIVE'
  remarks?: string
  created_at: string
  updated_at: string
}

export interface AntennaResponse {
  success: boolean
  count: number
  data: Antenna[]
}

export const antennaService = {
  getAll: async () => {
    const response = await api.get<AntennaResponse>('/antennas')
    return response.data
  },
  getAllUnmapped: async () => {
    const response = await api.get<AntennaResponse>('/getUnmappedAntennas')
    return response.data
  },
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Antenna }>(
      `/antennas/${id}`
    )
    return response.data
  },
  create: async (data: Partial<Antenna>) => {
    const response = await api.post<{ success: boolean; data: Antenna }>(
      '/antennas',
      data
    )
    return response.data
  },
  update: async (id: string, data: Partial<Antenna>) => {
    const response = await api.put<{ success: boolean; data: Antenna }>(
      `/antennas/${id}`,
      data
    )
    return response.data
  },
  delete: async (id: string) => {
    const response = await api.delete(`/antennas/${id}`)
    return response.data
  },
}

export default antennaService
