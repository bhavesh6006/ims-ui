import api from './api'

export interface TrolleyType {
  trolly_type_id: string
  trolly_type: string
  created_at?: string
  updated_at?: string
}

export const trolleyTypeService = {
  getAll: async (): Promise<TrolleyType[]> => {
    const response = await api.get('/trolly-types')
    return response.data
  },

  getById: async (id: string): Promise<TrolleyType> => {
    const response = await api.get(`/trolly-types/${id}`)
    return response.data
  },

  create: async (data: Partial<TrolleyType>): Promise<TrolleyType> => {
    const response = await api.post('/trolly-types', data)
    return response.data
  },

  update: async (
    id: string,
    data: Partial<TrolleyType>
  ): Promise<TrolleyType> => {
    const response = await api.put(`/trolly-types/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/trolly-types/${id}`)
  },
}
