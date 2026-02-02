// Core Entity Types for IMS (Inventory Management System)

// Trolly / Container Master
export interface Trolly extends Record<string, unknown> {
  trolley_id: string
  trolley_code: string
  trolley_type: string
  barcode: string
  qr_code: string
  length_mm: string
  width_mm: string
  height_mm: string
  volume_mm3: string
  notes: string
  status: string
  createdAt: string
  updatedAt: string
}

// Material Master
export interface Material {
  [key: string]: unknown
  id: string
  materialId: string // Unique Material ID
  materialName: string
  materialType: string
  dimensions: {
    length: number
    width: number
    height: number
    weight?: number
    unit: 'mm' | 'cm' | 'm'
    weightUnit?: 'kg' | 'g'
  }
  allowedPositions?: Array<
    | 'Left'
    | 'Right'
    | 'Left Upper'
    | 'Left Lower'
    | 'Right Upper'
    | 'Right Lower'
  >
  description?: string
  status: string
  createdAt: string
  updatedAt: string
}

// Trolly and Material Mapping
export interface TrollyMaterialMapping {
  id: string
  trollyId: string
  materialId: string
  trollyType: string
  materialType: string
  maxCapacity: number // Maximum material count
  positionCapacity?: Record<string, number> // Position-wise capacity
  effectiveFrom: string
  effectiveTo?: string
  effectiveDate: string
  notes?: string
  status: string
  version: number
  createdAt: string
  updatedAt: string
}

// Store Location Master
export interface StoreLocation {
  id: string
  storeLocationId: string
  locationId?: string
  locationName?: string
  locationType?: 'Factory' | 'Plant' | 'Store'
  parentLocationId?: string
  storeName: string
  factoryName: string
  factoryCode?: string
  plantBuildingName: string
  plantCode?: string
  storeCode?: string
  hierarchy: {
    factory: string
    plant: string
    store: string
  }
  area: {
    value: number
    unit: 'sq_mtr' | 'sq_ft'
  }
  areaUnit?: 'sqft' | 'sqm'
  rfidAntennas?: string[] // Array of antenna IDs
  associatedAntennaIds?: string[]
  bleGateways?: string[] // Array of BLE gateway IDs
  status: string
  remarks?: string
  description?: string
  createdAt: string
  updatedAt: string
}

// RFID Antenna Master
export interface RFIDAntenna {
  id: string
  antennaId: string
  antennaName: string
  antennaType: 'Circular Polarized' | 'Linear Polarized'
  frequencyRange: string
  gain: number // dBi
  readerId: string
  readerIp?: string
  readerPort?: number
  readerPortNumber: number
  antennaRole:
    | 'Zone A'
    | 'Zone B'
    | 'Entry'
    | 'Exit'
    | 'Inside Zone'
    | 'Outside Zone'
    | 'Neutral'
    | 'Internal'
  orientation: 'Left' | 'Right' | 'Top' | 'Floor' | 'Horizontal' | 'Vertical'
  mountingType: 'Gate' | 'Dock Door' | 'Ceiling' | 'Zone'
  mountingHeight?: number
  txPower: number // dBm
  powerLevel?: number
  frequency?: number
  coverageArea?: string
  storeLocationId?: string
  locationId?: string
  gateId?: string
  isACTIVE?: boolean
  maintenanceMode?: boolean
  status: string | 'Maintenance'
  remarks?: string
  description?: string
  createdAt: string
  updatedAt: string
}

// Work Order
export interface WorkOrder {
  id: string
  workOrderId: string
  workOrderNumber: string
  quantity: number
  doorTypes: string[]
  classification: 'SFG' | 'FG' // Semi-Finished Goods / Finished Goods
  doorOrientation: Array<
    | 'Left'
    | 'Right'
    | 'Left Upper'
    | 'Right Upper'
    | 'Left Lower'
    | 'Right Lower'
  >
  tools?: string[]
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled'
  createdAt: string
  updatedAt: string
}

// Work Order for Operator Loading
export interface OperatorWorkOrder {
  id: string
  srNo: number
  date: string
  tool: string
  subTool: string
  doorColour: string
  handle: string
  micom: string
  lock1: string
  dispType: string
  inputPlan: number
  outputPlan: number
}

// Trolley Loading Transaction
export interface TrolleyLoading {
  id: string
  trollyId: string
  workOrderId: string
  workOrderNumber: string
  doorTypes: string[]
  loadingType: 'Full' | 'Partial'
  loadedQuantity: number
  maxCapacity: number
  operatorId: string
  operatorName: string
  timestamp: string
  status: 'Loaded' | 'In Transit' | 'Unloaded'
  createdAt: string
}

// Inventory Movement (RFID/BLE based tracking)
export interface InventoryMovement {
  id: string
  trollyId: string
  materialId?: string
  movementType: 'Entry' | 'Exit' | 'Internal Transfer'
  fromLocation?: string
  toLocation?: string
  gateId?: string
  antennaId?: string
  quantity: number
  timestamp: string
  detectedBy: 'RFID' | 'BLE' | 'Manual'
  createdAt: string
}

// User and Role Management
export interface User {
  id: string
  username: string
  email: string
  fullName: string
  role: 'Admin' | 'Store Manager' | 'Storekeeper' | 'Operator'
  ldapId?: string
  status: string
  createdAt: string
  updatedAt: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}
