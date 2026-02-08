import api from './api'

export const trollyTypeService = {
  getAll: async (page: number, pageSize: number) => {
    const response = await api.get(
      `/trolly-types?page=${page}&limit=${pageSize}`
    )
    return response.data
  },
}
