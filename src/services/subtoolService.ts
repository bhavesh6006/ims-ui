import api from './api'

export interface Subtool {
  subtool_id: string
  name: string
  created_at?: string
  updated_at?: string
}

export const subtoolService = {
  getAll: async (): Promise<Subtool[]> => {
    const response = await api.get('/subtools')
    return response.data
  },

  getById: async (id: string): Promise<Subtool> => {
    const response = await api.get(`/subtools/${encodeURIComponent(id)}`)
    return response.data
  },

  create: async (data: Partial<Subtool>): Promise<Subtool> => {
    const response = await api.post('/subtools', data)
    return response.data
  },

  update: async (id: string, data: Partial<Subtool>): Promise<Subtool> => {
    const response = await api.put(`/subtools/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/subtools/${id}`)
  },
}
