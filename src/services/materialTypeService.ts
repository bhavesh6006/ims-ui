import api from './api'

type MaterialType = {
  material_type_id: string
  material_type: string
  created_at: string
  updated_at: string
}

export const materialTypeService = {
  getAll: async (): Promise<MaterialType[]> => {
    const response = await api.get('/material-types')
    return response.data
  },
}
