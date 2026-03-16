import api from './api'
import type {
  TrolleyLoading,
  ApiResponse,
  PaginatedResponse,
  Trolly,
  WorkOrder,
} from '../types'

// Loading Service - Operator loading operations
export const loadingService = {
  // Scan trolley (barcode/QR code)
  scanTrolley: async (code: string, codeType: 'barcode' | 'qr') => {
    const response = await api.post<ApiResponse<Trolly>>(
      '/loading/scan-trolley',
      {
        code,
        codeType,
      }
    )
    return response.data
  },

  // Get work order list for operator
  getWorkOrders: async () => {
    const response = await api.get<ApiResponse<WorkOrder[]>>(
      '/loading/work-orders'
    )
    return response.data
  },

  // Get work order details (quantity, door types, classification, orientation)
  getWorkOrderDetails: async (workOrderId: string) => {
    const response = await api.get<ApiResponse<WorkOrder>>(
      `/loading/work-orders/${encodeURIComponent(workOrderId)}`
    )
    return response.data
  },

  // Create loading transaction (full or partial)
  createLoading: async (loading: {
    trollyId: string
    workOrderId: string
    workOrderNumber: string
    doorTypes: string[]
    loadingType: 'Full' | 'Partial'
    loadedQuantity: number
    operatorId: string
    operatorName: string
  }) => {
    const response = await api.post<ApiResponse<TrolleyLoading>>(
      '/loading/transactions',
      loading
    )
    return response.data
  },

  // Validate trolly-material compatibility before loading
  validateLoading: async (
    trollyId: string,
    workOrderId: string,
    quantity: number
  ) => {
    const response = await api.post<
      ApiResponse<{ valid: boolean; maxCapacity: number; message?: string }>
    >('/loading/validate', {
      trollyId,
      workOrderId,
      quantity,
    })
    return response.data
  },

  // Get loading transactions with pagination
  getLoadingTransactions: async (
    page: number = 1,
    pageSize: number = 10,
    search?: string
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(search && { search }),
    })
    const response = await api.get<PaginatedResponse<TrolleyLoading>>(
      `/loading/transactions?${params}`
    )
    return response.data
  },

  // Get loading transaction by ID
  getLoadingById: async (id: string) => {
    const response = await api.get<ApiResponse<TrolleyLoading>>(
      `/loading/transactions/${id}`
    )
    return response.data
  },

  // Get loading transactions by trolly
  getLoadingsByTrolly: async (trollyId: string) => {
    const response = await api.get<ApiResponse<TrolleyLoading[]>>(
      `/loading/transactions/trolly/${encodeURIComponent(trollyId)}`
    )
    return response.data
  },

  // Get loading transactions by operator
  getLoadingsByOperator: async (operatorId: string) => {
    const response = await api.get<ApiResponse<TrolleyLoading[]>>(
      `/loading/transactions/operator/${encodeURIComponent(operatorId)}`
    )
    return response.data
  },

  // Update loading status (mark as in transit, unloaded)
  updateLoadingStatus: async (
    id: string,
    status: 'Loaded' | 'In Transit' | 'Unloaded'
  ) => {
    const response = await api.patch<ApiResponse<TrolleyLoading>>(
      `/loading/transactions/${id}/status`,
      {
        status,
      }
    )
    return response.data
  },

  // Complete unloading
  completeUnloading: async (id: string) => {
    const response = await api.patch<ApiResponse<TrolleyLoading>>(
      `/loading/transactions/${id}/unload`,
      {}
    )
    return response.data
  },
}

export default loadingService
