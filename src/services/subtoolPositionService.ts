import api from './api'

export interface SubtoolPosition {
  subtool_position_id: string
  subtool_position: string
  created_at?: string
  updated_at?: string
}

export const subtoolPositionService = {
  getAll: async (): Promise<SubtoolPosition[]> => {
    const response = await api.get('/subtool-positions')
    return response.data
  },

  getById: async (id: string): Promise<SubtoolPosition> => {
    const response = await api.get(`/subtool-positions/${id}`)
    return response.data
  },

  create: async (data: Partial<SubtoolPosition>): Promise<SubtoolPosition> => {
    const response = await api.post('/subtool-positions', data)
    return response.data
  },

  update: async (
    id: string,
    data: Partial<SubtoolPosition>
  ): Promise<SubtoolPosition> => {
    const response = await api.put(`/subtool-positions/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/subtool-positions/${id}`)
  },
}
