import api from './api'

export interface StoreLocationPayload {
  store_code: string
  store_name: string
  factory_name?: string
  plant_name?: string
  hierarchy_level?: string
  total_area?: number
  area_unit?: string
  remarks?: string
  status?: string
  antenna_mappings?: Array<{
    antenna_id: number
    movement_type: string
  }>
}

export interface StoreLocationUpdatePayload extends Partial<StoreLocationPayload> {
  antenna_mappings_to_add?: Array<{ antenna_id: number; movement_type: string }>
  antenna_mappings_to_remove?: string[]
  antenna_mappings_to_update?: Array<{
    mapping_id: string
    antenna_id?: number
    movement_type?: string
  }>
}

export const storeLocationService = {
  async getAll(page?: number, limit?: number, search?: string) {
    const params: Record<string, string | number> = {}
    if (page) params.page = page
    if (limit) params.limit = limit
    if (search) params.search = search

    const response = await api.get('/store-locations', { params })
    return response.data
  },

  async getById(id: string) {
    const response = await api.get(`/store-locations/${id}`)
    return response.data
  },

  async create(data: StoreLocationPayload) {
    const response = await api.post('/store-locations', data)
    return response.data
  },

  async update(id: string, data: StoreLocationUpdatePayload) {
    const response = await api.put(`/store-locations/${id}`, data)
    return response.data
  },

  async delete(id: string) {
    const response = await api.delete(`/store-locations/${id}`)
    return response.data
  },
}

export default storeLocationService
