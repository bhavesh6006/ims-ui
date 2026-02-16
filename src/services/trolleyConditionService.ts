import api from './api'

export interface TrolleyCondition {
  trolley_condition_id: string
  name: string
  description?: string
}

interface TrolleyConditionResponse {
  success: boolean
  count: number
  data: TrolleyCondition[]
}

export const trolleyConditionService = {
  getAll: async (): Promise<TrolleyCondition[]> => {
    const response =
      await api.get<TrolleyConditionResponse>('/trolly-conditions')
    return response.data.data
  },
}
