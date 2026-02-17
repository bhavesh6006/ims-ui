export interface StoreLocation extends Record<string, unknown> {
  store_location_id: string
  store_code: string
  store_name?: string
  factory_name?: string
  plant_name?: string
  hierarchy_level?: string
  total_area?: number
  area_unit: 'sq_mtr' | 'sq_ft'
  status: 'ACTIVE' | 'INACTIVE'
  remarks?: string
  created_at: string
  updated_at: string
  antennaMappings?: AntennaMapping[]
}

export interface AntennaMapping {
  mapping_id?: string
  store_location_id?: string
  antenna_id: number
  movement_type: 'IN' | 'OUT'
  status?: 'ACTIVE' | 'INACTIVE'
  created_at?: string
  updated_at?: string
  antenna?: {
    antenna_id: number
    device_id: number
    antenna_no: number
    antenna_name?: string
    location_name?: string
    is_enabled: boolean
    is_connected: boolean
    device?: {
      device_id: number
      device_name: string
      ip_address: string
      location?: string
    }
  }
}
