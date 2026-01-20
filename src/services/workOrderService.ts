import api from './api'
import type { WorkOrder, PaginatedResponse, ApiResponse } from '../types'

// Work Order Service - Manage work orders
export const workOrderService = {
  // Get all work orders with pagination
  getAll: async (
    page: number = 1,
    pageSize: number = 10,
    search: string = '',
    status?: string
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
      ...(search && { search }),
      ...(status && { status }),
    })
    const response = await api.get<PaginatedResponse<WorkOrder>>(
      `/work-orders?${params.toString()}`
    )
    return response.data
  },

  // Get work order by ID
  getById: async (id: string) => {
    const response = await api.get<WorkOrder>(`/work-orders/${id}`)
    return response.data
  },

  // Get work order by work order number
  getByWorkOrderNumber: async (workOrderNumber: string) => {
    const response = await api.get<ApiResponse<WorkOrder>>(
      `/work-orders/number/${workOrderNumber}`
    )
    return response.data
  },

  // Get open work orders (for operator selection)
  getOpen: async () => {
    const response =
      await api.get<ApiResponse<WorkOrder[]>>('/work-orders/open')
    return response.data
  },

  // Get work orders by status
  getByStatus: async (status: string) => {
    const response = await api.get<ApiResponse<WorkOrder[]>>(
      `/work-orders/status/${status}`
    )
    return response.data
  },

  // Get work orders by classification
  getByClassification: async (classification: 'SFG' | 'FG') => {
    const response = await api.get<ApiResponse<WorkOrder[]>>(
      `/work-orders/classification/${classification}`
    )
    return response.data
  },

  // Create new work order
  create: async (data: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<WorkOrder>('/work-orders', data)
    return response.data
  },

  // Update work order
  update: async (id: string, data: Partial<WorkOrder>) => {
    const response = await api.put<WorkOrder>(`/work-orders/${id}`, data)
    return response.data
  },

  // Update work order status
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch<ApiResponse<WorkOrder>>(
      `/work-orders/${id}/status`,
      { status }
    )
    return response.data
  },

  // Cancel work order
  cancel: async (id: string, reason?: string) => {
    const response = await api.patch<ApiResponse<WorkOrder>>(
      `/work-orders/${id}/cancel`,
      { reason }
    )
    return response.data
  },

  // Complete work order
  complete: async (id: string) => {
    const response = await api.patch<ApiResponse<WorkOrder>>(
      `/work-orders/${id}/complete`,
      {}
    )
    return response.data
  },

  // Get work order metadata (for operator loading)
  getMetadata: async (id: string) => {
    const response = await api.get<ApiResponse<WorkOrder>>(
      `/work-orders/${id}/metadata`
    )
    return response.data
  },

  // Delete work order
  delete: async (id: string) => {
    await api.delete(`/work-orders/${id}`)
  },
}

export default workOrderService
