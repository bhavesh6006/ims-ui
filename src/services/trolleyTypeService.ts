import api from './api'

export interface TrolleyType {
  trolly_type_id: string
  trolly_type: string
  created_at?: string
  updated_at?: string
}

interface PaginatedResponse {
  data: TrolleyType[]
  count: number
}

const trolleyTypeService = {
  getAll: async (
    page = 1,
    limit = 100,
    search = ''
  ): Promise<PaginatedResponse> => {
    const params: Record<string, unknown> = { page, limit }
    if (search) params.search = search
    const response = await api.get('/trolly-types', { params })
    // Backend returns { success, data, pagination }
    return {
      data: response.data.data,
      count: response.data.pagination?.total ?? response.data.data.length,
    }
  },

  getById: async (id: string): Promise<TrolleyType> => {
    const response = await api.get(`/trolly-types/${encodeURIComponent(id)}`)
    return response.data.data
  },

  create: async (payload: { trolly_type: string }): Promise<TrolleyType> => {
    const response = await api.post('/trolly-types', payload)
    return response.data.data
  },

  update: async (
    id: string,
    payload: { trolly_type: string }
  ): Promise<TrolleyType> => {
    const response = await api.put(`/trolly-types/${id}`, payload)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/trolly-types/${id}`)
  },
}

export { trolleyTypeService }
export default trolleyTypeService
