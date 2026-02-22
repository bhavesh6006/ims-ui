import api from './api'

export interface LocationType {
  location_type_id: string
  location_type_name: string
}

export const locationTypeService = {
  async getAll() {
    const response = await api.get('/location-types')
    return response.data
  },
}

export default locationTypeService
