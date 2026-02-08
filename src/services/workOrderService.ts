import api from './api'
import type { ApiResponse } from '../types'

export interface WorkOrderResponse {
  id: string
  work_order_number: string
  sr_no: number
  date: string
  tool: string
  sub_tool: string
  material_id?: string
  door_colour: string
  handle: string
  micom: string
  lock1: string
  disp_type: string
  input_plan: number
  output_plan: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'
  created_at: string
  updated_at: string
  created_by: string
  updated_by?: string | null
}

export interface WorkOrderListResponse {
  total: number
  page: number
  limit: number
  totalPages: number
  workOrders: WorkOrderResponse[]
}

export interface WorkOrderFilters {
  status?: string
  date_from?: string
  date_to?: string
  tool?: string
  sub_tool?: string
  page?: number
  limit?: number
}

export interface UpdateWorkOrderPayload {
  sr_no?: number
  date?: string
  tool?: string
  sub_tool?: string
  door_colour?: string
  handle?: string
  micom?: string
  lock1?: string
  disp_type?: string
  input_plan?: number
  output_plan?: number
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'
  updated_by?: string
}

const workOrderService = {
  // Fetch all work orders with optional filters
  getAll: async (
    filters?: WorkOrderFilters
  ): Promise<ApiResponse<WorkOrderListResponse>> => {
    const params = new URLSearchParams()

    if (filters?.status) params.append('status', filters.status)
    if (filters?.date_from) params.append('date_from', filters.date_from)
    if (filters?.date_to) params.append('date_to', filters.date_to)
    if (filters?.tool) params.append('tool', filters.tool)
    if (filters?.sub_tool) params.append('sub_tool', filters.sub_tool)
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))

    const queryString = params.toString()
    const url = queryString ? `/work-orders?${queryString}` : '/work-orders'

    const response = await api.get(url)
    return response.data
  },

  // Update work order
  update: async (
    id: string,
    payload: UpdateWorkOrderPayload
  ): Promise<ApiResponse<WorkOrderResponse>> => {
    const response = await api.put(`/work-orders/${id}`, payload)
    return response.data
  },

  // Get single work order by ID
  getById: async (id: string): Promise<ApiResponse<WorkOrderResponse>> => {
    const response = await api.get(`/work-orders/${id}`)
    return response.data
  },
}

export default workOrderService
