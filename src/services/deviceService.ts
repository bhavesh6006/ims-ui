import api from './api'

export interface Device {
  device_id: number
  device_name: string
  location?: string
  department?: string
  ip_address: string
  mac_address?: string
  hostname?: string
  serial_no?: string
  manufacturer?: string
  model?: string
  firmware_version?: string
  os_description?: string
  total_antennas?: number
  active_antennas?: number
  last_llrp_sync?: string
  uptime_sec?: number
  cpu_usage?: number
  temperature?: number
  memory_free_mb?: number
  last_snmp_sync?: string
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'
  last_seen_time?: string
  is_active: boolean
  installed_on?: string
  created_at: string
  updated_at: string
}

export interface DeviceCreatePayload {
  device_name: string
  ip_address: string
  location?: string
  department?: string
  installed_on?: string
}

export interface DeviceUpdatePayload {
  device_name?: string
  location?: string
  department?: string
  ip_address?: string
  mac_address?: string
  hostname?: string
  serial_no?: string
  manufacturer?: string
  model?: string
  firmware_version?: string
  os_description?: string
  total_antennas?: number
  active_antennas?: number
  last_llrp_sync?: string
  uptime_sec?: number
  cpu_usage?: number
  temperature?: number
  memory_free_mb?: number
  last_snmp_sync?: string
  status?: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'
  last_seen_time?: string
  is_active?: boolean
  installed_on?: string
}

export interface DeviceSyncPayload {
  device_name?: string
  mac_address?: string
  hostname?: string
  serial_no?: string
  manufacturer?: string
  model?: string
  firmware_version?: string
  os_description?: string
  total_antennas?: number
  active_antennas?: number
  uptime_sec?: number
  cpu_usage?: number
  temperature?: number
  memory_free_mb?: number
  status?: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'
}

export const deviceService = {
  async getAll() {
    const response = await api.get('/devices')
    return response.data
  },

  async getById(id: number) {
    const response = await api.get(`/devices/${id}`)
    return response.data
  },

  async getByIp(ip: string) {
    const response = await api.get(`/devices/ip/${ip}`)
    return response.data
  },

  async create(data: DeviceCreatePayload) {
    const response = await api.post('/devices', data)
    return response.data
  },

  async update(id: number, data: DeviceUpdatePayload) {
    const response = await api.put(`/devices/${id}`, data)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/devices/${id}`)
    return response.data
  },

  async syncDeviceInfo(ip: string, middlewareData: DeviceSyncPayload) {
    const response = await api.post(`/devices/sync/${ip}`, middlewareData)
    return response.data
  },

  async updateStatus(
    ip: string,
    statusData: {
      status?: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'
      uptime_sec?: number
      cpu_usage?: number
      temperature?: number
      memory_free_mb?: number
    }
  ) {
    const response = await api.put(`/devices/status/${ip}`, statusData)
    return response.data
  },
}
