export interface TrolleyType {
  trolly_type_id: string
  trolly_type: string
}

export interface MaterialType {
  material_type_id: string
  material_type: string
}

export interface Material {
  material_id: string
  material_name: string
  material_code: string
  materialType?: MaterialType
}

export interface MappingItem {
  mapping_id: string
  trolley_type_id: string
  material_id: string
  max_quantity: number
  mapping_group_id: string | null
  group_total_quantity: number | null
  is_group_mapping: boolean
  status: string
  trolleyType?: TrolleyType
  material?: Material
}

export interface TrolleyTypeMapping {
  trolley_type_id: string
  trolley_type: string
  total_materials: number
  mappings: MappingItem[]
}
