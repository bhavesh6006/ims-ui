import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Stack,
  Autocomplete,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { DataTable, type Column } from '../components/organisms'
import { SearchBar, Alert } from '../components/molecules'
import { antennaService, deviceService } from '../services'
import { storeLocationService } from '../services/storeLocationService'
import type { StoreLocation } from '../types/storeLocation'
import type {
  Antenna,
  AntennaCreatePayload,
  AntennaUpdatePayload,
} from '../services/antennaService'
import type { Device } from '../services/deviceService'

const RFIDAntennaMaster: React.FC = () => {
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([])
  const [antennas, setAntennas] = useState<Antenna[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAntenna, setEditingAntenna] = useState<Antenna | null>(null)
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  interface FormErrors {
    device_id?: string
    antenna_no?: string
    antenna_name?: string
    store_location_id?: string
  }

  const [errors, setErrors] = useState<FormErrors>({})

  const [formData, setFormData] = useState({
    device_id: null as number | null,
    antenna_no: '',
    antenna_name: '',
    store_location_id: '',
    zone_id: '',
    antenna_type: '',
    polarization: '',
    manufacturer: '',
    model: '',
    orientation: '',
    mounting_height_m: '',
    facing_angle_deg: '',
    is_enabled: true,
  })

  const columns: Column[] = [
    {
      id: 'device_id',
      label: 'Device',
      format: (_value: unknown, row?: Record<string, unknown>) => {
        if (!row || !row.device) return '-'
        const device = row.device as { device_name: string; ip_address: string }
        return `${device.device_name} (${device.ip_address})`
      },
    },
    { id: 'antenna_no', label: 'Antenna #' },
    { id: 'antenna_name', label: 'Antenna Name' },
    {
      id: 'store_location_id',
      label: 'Location',
      format: (value: unknown) => {
        const id = value as string
        const loc = storeLocations.find((l) => l.store_location_id === id)
        return loc ? loc.store_name || loc.store_code : '-'
      },
    },
    {
      id: 'antenna_type',
      label: 'Type',
      format: (value: unknown) => (value as string) || '-',
    },
    {
      id: 'orientation',
      label: 'Orientation',
      format: (value: unknown) => (value as string) || '-',
    },
    {
      id: 'is_enabled',
      label: 'Enabled',
      format: (value: unknown) => {
        const enabled = value as boolean
        return (
          <Chip
            label={enabled ? 'Yes' : 'No'}
            color={enabled ? 'success' : 'default'}
            size="small"
          />
        )
      },
    },
    {
      id: 'is_connected',
      label: 'Connected',
      format: (value: unknown) => {
        const connected = value as boolean
        return (
          <Chip
            label={connected ? 'Yes' : 'No'}
            color={connected ? 'success' : 'error'}
            size="small"
          />
        )
      },
    },
    {
      id: 'tx_power_dbm',
      label: 'TX Power',
      format: (value: unknown) => {
        if (!value && value !== 0) return '-'
        return `${value} dBm`
      },
    },
  ]

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadDevices = useCallback(async () => {
    try {
      const response = await deviceService.getAll()
      setDevices(response.data || [])
    } catch (error) {
      console.error('Error loading devices:', error)
      showAlert('Failed to load devices', 'error')
    }
  }, [])

  const loadStoreLocations = useCallback(async () => {
    try {
      const response = await storeLocationService.getAll()
      setStoreLocations(response.data?.data || response.data || [])
    } catch {
      setStoreLocations([])
    }
  }, [])

  const loadAntennas = useCallback(async () => {
    try {
      setLoading(true)
      const response = await antennaService.getAll(page + 1, pageSize, search)
      const antennasData = response.data || []
      const totalCount = response.count || antennasData.length
      setAntennas(antennasData)
      setTotal(totalCount)
    } catch (error) {
      console.error('Error loading antennas:', error)
      showAlert('Failed to load antennas', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => {
    loadDevices()
    loadAntennas()
    loadStoreLocations()
  }, [loadDevices, loadAntennas])

  const handleAdd = () => {
    setEditingAntenna(null)
    setFormData({
      device_id: null,
      antenna_no: '',
      antenna_name: '',
      store_location_id: '',
      zone_id: '',
      antenna_type: '',
      polarization: '',
      manufacturer: '',
      model: '',
      orientation: '',
      mounting_height_m: '',
      facing_angle_deg: '',
      is_enabled: true,
    })
    setModalOpen(true)
  }

  const handleEdit = (row: Record<string, unknown>) => {
    const antenna = row as unknown as Antenna
    setEditingAntenna(antenna)
    setFormData({
      device_id: antenna.device_id,
      antenna_no: antenna.antenna_no?.toString() || '',
      antenna_name: antenna.antenna_name || '',
      store_location_id: antenna.store_location_id?.toString() || '',
      zone_id: antenna.zone_id?.toString() || '',
      antenna_type: antenna.antenna_type || '',
      polarization: antenna.polarization || '',
      manufacturer: antenna.manufacturer || '',
      model: antenna.model || '',
      orientation: antenna.orientation || '',
      mounting_height_m: antenna.mounting_height_m?.toString() || '',
      facing_angle_deg: antenna.facing_angle_deg?.toString() || '',
      is_enabled: antenna.is_enabled !== undefined ? antenna.is_enabled : true,
    })
    setModalOpen(true)
  }

  const handleDelete = async (row: Record<string, unknown>) => {
    const antenna = row as unknown as Antenna
    if (
      window.confirm(
        `Are you sure you want to delete antenna "${antenna.antenna_name || `#${antenna.antenna_no}`}"?`
      )
    ) {
      try {
        await antennaService.delete(antenna.antenna_id)
        showAlert('Antenna deleted successfully', 'success')
        loadAntennas()
      } catch (error) {
        console.error('Error deleting antenna:', error)
        showAlert('Failed to delete antenna', 'error')
      }
    }
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.device_id) {
      newErrors.device_id = 'Device is required'
    }

    if (!formData.antenna_no) {
      newErrors.antenna_no = 'Antenna Number is required'
    }

    if (!formData.antenna_name) {
      newErrors.antenna_name = 'Antenna Name is required'
    }

    if (!formData.store_location_id) {
      newErrors.store_location_id = 'Store Location is required'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    try {
      if (!validate()) return

      // Validate required fields
      if (!formData.device_id || !formData.antenna_no) {
        showAlert('Device and Antenna Number are required', 'error')
        return
      }

      if (editingAntenna) {
        // Update existing antenna
        const updateData: AntennaUpdatePayload = {
          antenna_no: Number(formData.antenna_no),
          antenna_name: formData.antenna_name || undefined,
          store_location_id: formData.store_location_id || undefined,
          zone_id: formData.zone_id ? Number(formData.zone_id) : undefined,
          antenna_type: formData.antenna_type || undefined,
          polarization: formData.polarization || undefined,
          manufacturer: formData.manufacturer || undefined,
          model: formData.model || undefined,
          orientation: formData.orientation || undefined,
          mounting_height_m: formData.mounting_height_m
            ? Number(formData.mounting_height_m)
            : undefined,
          facing_angle_deg: formData.facing_angle_deg
            ? Number(formData.facing_angle_deg)
            : undefined,
          is_enabled: formData.is_enabled,
        }
        await antennaService.update(editingAntenna.antenna_id, updateData)
        showAlert('Antenna updated successfully', 'success')
      } else {
        // Create new antenna
        const createData: AntennaCreatePayload = {
          device_id: formData.device_id,
          antenna_no: Number(formData.antenna_no),
          antenna_name: formData.antenna_name || undefined,
          store_location_id: formData.store_location_id || undefined,
          zone_id: formData.zone_id ? Number(formData.zone_id) : undefined,
          antenna_type: formData.antenna_type || undefined,
          polarization: formData.polarization || undefined,
          manufacturer: formData.manufacturer || undefined,
          model: formData.model || undefined,
          orientation: formData.orientation || undefined,
          mounting_height_m: formData.mounting_height_m
            ? Number(formData.mounting_height_m)
            : undefined,
          facing_angle_deg: formData.facing_angle_deg
            ? Number(formData.facing_angle_deg)
            : undefined,
          is_enabled: formData.is_enabled,
        }
        await antennaService.create(createData)
        showAlert('Antenna created successfully', 'success')
      }

      setModalOpen(false)
      loadAntennas()
    } catch (error: unknown) {
      console.error('Error saving antenna:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to save antenna'
      showAlert(errorMessage, 'error')
    }
  }

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | number | boolean | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Antenna Master</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Antenna
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by antenna name, location, type, device, or antenna number..."
        />
      </Box>

      <DataTable
        columns={columns}
        data={antennas as unknown as Record<string, unknown>[]}
        page={page}
        rowsPerPage={pageSize}
        totalRows={total}
        onPageChange={(newPage) => setPage(newPage)}
        onRowsPerPageChange={(newPageSize) => {
          setPageSize(newPageSize)
          setPage(0)
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6">
              {editingAntenna ? 'Edit Antenna' : 'Add New Antenna'}
            </Typography>
            <IconButton onClick={() => setModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box sx={{ bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="body2" color="info.dark">
                <strong>Note:</strong> Map physical antennas to logical zones
                (IN/OUT gates) after device is added. TX power and RX
                sensitivity will be fetched by middleware.
              </Typography>
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2 }}>
              Device & Antenna Info
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Autocomplete
                fullWidth
                options={devices}
                getOptionLabel={(option) =>
                  `${option.device_name} (${option.ip_address})`
                }
                value={
                  devices.find((d) => d.device_id === formData.device_id) ||
                  null
                }
                onChange={(_, value) => {
                  handleInputChange('device_id', value?.device_id || null)
                  setErrors({ ...errors, device_id: undefined })
                }}
                disabled={!!editingAntenna}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Device"
                    required
                    error={Boolean(errors.device_id)}
                    helperText={errors.device_id}
                  />
                )}
              />
              <TextField
                label="Antenna Number"
                type="number"
                fullWidth
                required
                value={formData.antenna_no}
                onChange={(e) => {
                  handleInputChange('antenna_no', e.target.value)
                  setErrors({ ...errors, antenna_no: undefined })
                }}
                disabled={!!editingAntenna}
                placeholder="1, 2, 3, ..."
                error={Boolean(errors.antenna_no)}
                helperText={errors.antenna_no}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Antenna Name"
                fullWidth
                value={formData.antenna_name}
                onChange={(e) => {
                  handleInputChange('antenna_name', e.target.value)
                  setErrors({ ...errors, antenna_name: undefined })
                }}
                placeholder="e.g., Gate1-IN-left"
                required
                error={Boolean(errors.antenna_name)}
                helperText={errors.antenna_name}
              />
              <Autocomplete
                fullWidth
                options={[
                  { store_location_id: '', label: 'Select Store Location' },
                  ...storeLocations.map((loc) => ({
                    store_location_id: loc.store_location_id,
                    label: loc.store_name || loc.store_code,
                  })),
                ]}
                getOptionLabel={(option) => option.label}
                value={
                  [
                    { store_location_id: '', label: 'Select Store Location' },
                    ...storeLocations.map((loc) => ({
                      store_location_id: loc.store_location_id,
                      label: loc.store_name || loc.store_code,
                    })),
                  ].find(
                    (opt) =>
                      opt.store_location_id === formData.store_location_id
                  ) || null
                }
                onChange={(_, newValue) => {
                  handleInputChange(
                    'store_location_id',
                    newValue?.store_location_id || ''
                  )
                  setErrors({ ...errors, store_location_id: undefined })
                }}
                isOptionEqualToValue={(option, value) =>
                  option.store_location_id === value.store_location_id
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Store Location"
                    required
                    error={Boolean(errors.store_location_id)}
                    helperText={errors.store_location_id}
                  />
                )}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Zone ID"
                type="number"
                fullWidth
                value={formData.zone_id}
                onChange={(e) => handleInputChange('zone_id', e.target.value)}
                placeholder="Logical zone mapping"
              />
              <Autocomplete
                fullWidth
                options={[
                  { label: 'None', value: '' },
                  { label: 'Circular', value: 'Circular' },
                  { label: 'Linear', value: 'Linear' },
                ]}
                value={
                  [
                    { label: 'None', value: '' },
                    { label: 'Circular', value: 'Circular' },
                    { label: 'Linear', value: 'Linear' },
                  ].find((opt) => opt.value === formData.antenna_type) || null
                }
                onChange={(_, newValue) =>
                  handleInputChange('antenna_type', newValue?.value || '')
                }
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) =>
                  option.value === value.value
                }
                renderInput={(params) => (
                  <TextField {...params} label="Antenna Type" />
                )}
              />
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2 }}>
              Hardware Details
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Autocomplete
                fullWidth
                options={[
                  { label: 'None', value: '' },
                  { label: 'LHCP', value: 'LHCP' },
                  { label: 'RHCP', value: 'RHCP' },
                  { label: 'Linear', value: 'Linear' },
                ]}
                value={
                  [
                    { label: 'None', value: '' },
                    { label: 'LHCP', value: 'LHCP' },
                    { label: 'RHCP', value: 'RHCP' },
                    { label: 'Linear', value: 'Linear' },
                  ].find((opt) => opt.value === formData.polarization) || null
                }
                onChange={(_, newValue) =>
                  handleInputChange('polarization', newValue?.value || '')
                }
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) =>
                  option.value === value.value
                }
                renderInput={(params) => (
                  <TextField {...params} label="Polarization" />
                )}
              />
              <TextField
                label="Manufacturer"
                fullWidth
                value={formData.manufacturer}
                onChange={(e) =>
                  handleInputChange('manufacturer', e.target.value)
                }
                placeholder="Hardware manufacturer"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Model"
                fullWidth
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="Hardware model"
              />
              <Autocomplete
                fullWidth
                options={[
                  { label: 'None', value: '' },
                  { label: 'IN', value: 'IN' },
                  { label: 'OUT', value: 'OUT' },
                  { label: 'LEFT', value: 'LEFT' },
                  { label: 'RIGHT', value: 'RIGHT' },
                ]}
                value={
                  [
                    { label: 'None', value: '' },
                    { label: 'IN', value: 'IN' },
                    { label: 'OUT', value: 'OUT' },
                    { label: 'LEFT', value: 'LEFT' },
                    { label: 'RIGHT', value: 'RIGHT' },
                  ].find((opt) => opt.value === formData.orientation) || null
                }
                onChange={(_, newValue) =>
                  handleInputChange('orientation', newValue?.value || '')
                }
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) =>
                  option.value === value.value
                }
                renderInput={(params) => (
                  <TextField {...params} label="Orientation" />
                )}
              />
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2 }}>
              Physical Placement
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Mounting Height (m)"
                type="number"
                fullWidth
                value={formData.mounting_height_m}
                onChange={(e) =>
                  handleInputChange('mounting_height_m', e.target.value)
                }
                placeholder="Physical mounting height"
                inputProps={{ step: 0.1 }}
              />
              <TextField
                label="Facing Angle (deg)"
                type="number"
                fullWidth
                value={formData.facing_angle_deg}
                onChange={(e) =>
                  handleInputChange('facing_angle_deg', e.target.value)
                }
                placeholder="Physical facing angle"
                inputProps={{ step: 1 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Autocomplete
                fullWidth
                options={[
                  { label: 'Yes (Logical ON)', value: true },
                  { label: 'No (Logical OFF)', value: false },
                ]}
                value={
                  [
                    { label: 'Yes (Logical ON)', value: true },
                    { label: 'No (Logical OFF)', value: false },
                  ].find((opt) => opt.value === formData.is_enabled) || null
                }
                onChange={(_, newValue) =>
                  handleInputChange('is_enabled', newValue?.value ?? true)
                }
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) =>
                  option.value === value.value
                }
                renderInput={(params) => (
                  <TextField {...params} label="Enabled" />
                )}
              />
            </Box>

            {editingAntenna && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Middleware Synced Data (Read-only)
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="TX Power (dBm)"
                      fullWidth
                      value={editingAntenna.tx_power_dbm ?? '-'}
                      InputProps={{ readOnly: true }}
                      size="small"
                    />
                    <TextField
                      label="RX Sensitivity"
                      fullWidth
                      value={editingAntenna.rx_sensitivity ?? '-'}
                      InputProps={{ readOnly: true }}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="Connected"
                      fullWidth
                      value={editingAntenna.is_connected ? 'Yes' : 'No'}
                      InputProps={{ readOnly: true }}
                      size="small"
                    />
                    <TextField
                      label="Last Seen"
                      fullWidth
                      value={
                        editingAntenna.last_seen_time
                          ? new Date(
                              editingAntenna.last_seen_time
                            ).toLocaleString()
                          : '-'
                      }
                      InputProps={{ readOnly: true }}
                      size="small"
                    />
                  </Box>
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setModalOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingAntenna ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Alert
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />
    </Box>
  )
}

export default RFIDAntennaMaster
