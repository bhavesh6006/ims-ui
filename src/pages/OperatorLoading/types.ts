export interface MaterialStockEntry {
  id?: number
  trolley_code: string
  material_code: string
  quantity: number | null
  loading_type: 'FULL' | 'PARTIAL'
  status: 'IN_STOCK' | 'IN_TRANSIT' | 'CONSUMED'
  location?: string
  loaded_at?: string
  remarks?: string
  work_order_id?: string
  work_order_number?: string
  loaded_by?: string
  created_at?: string
  updated_at?: string
  location_name?: string
}
