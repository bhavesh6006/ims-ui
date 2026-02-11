export interface RFIDAntenna extends Record<string, unknown> {
  antenna_id: string
  antenna_code: string
  antenna_name?: string
  antenna_type: '' | 'RFID' | 'BLE'
  frequency_range?: string
  gain_dbi?: number
  reader_id?: string
  reader_port?: number
  antenna_role?: string
  orientation?: string
  mounting_type?: string
  tx_power_dbm?: number
  coverage_desc?: string
  status: 'ACTIVE' | 'INACTIVE' | 'Maintenance'
  remarks?: string
  created_at?: string
  updated_at?: string
}

export interface CreateRFIDAntennaPayload {
  antenna_code: string
  antenna_name?: string
  antenna_type: 'RFID' | 'BLE'
  frequency_range?: string
  gain_dbi?: number
  reader_id?: string
  reader_port?: number
  antenna_role?: string
  orientation?: string
  mounting_type?: string
  tx_power_dbm?: number
  coverage_desc?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'Maintenance'
  remarks?: string
}

export type UpdateRFIDAntennaPayload = Partial<CreateRFIDAntennaPayload>
