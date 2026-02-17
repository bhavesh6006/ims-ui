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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Autocomplete,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { DataTable, type Column } from '../components/organisms'
import { SearchBar, Alert } from '../components/molecules'
import { antennaService, deviceService } from '../services'
import type {
  Antenna,
  AntennaCreatePayload,
  AntennaUpdatePayload,
} from '../services/antennaService'
import type { Device } from '../services/deviceService'

const RFIDAntennaMaster: React.FC = () => {
  const [antennas, setAntennas] = useState<Antenna[]>([])
  const [filteredAntennas, setFilteredAntennas] = useState<Antenna[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAntenna, setEditingAntenna] = useState<Antenna | null>(null)
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const [formData, setFormData] = useState({
    device_id: null as number | null,
    antenna_no: '',
    antenna_name: '',
    location_name: '',
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
    { id: 'location_name', label: 'Location' },
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

  const loadAntennas = useCallback(async () => {
    try {
      setLoading(true)
      const response = await antennaService.getAll()
      const antennasData = response.data || []
      setAntennas(antennasData)
      setFilteredAntennas(antennasData)
    } catch (error) {
      console.error('Error loading antennas:', error)
      showAlert('Failed to load antennas', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDevices()
    loadAntennas()
  }, [loadDevices, loadAntennas])

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredAntennas(antennas)
    } else {
      const searchLower = search.toLowerCase()
      const filtered = antennas.filter(
        (antenna) =>
          antenna.antenna_name?.toLowerCase().includes(searchLower) ||
          antenna.location_name?.toLowerCase().includes(searchLower) ||
          antenna.antenna_type?.toLowerCase().includes(searchLower) ||
          antenna.orientation?.toLowerCase().includes(searchLower) ||
          antenna.device?.device_name?.toLowerCase().includes(searchLower) ||
          antenna.antenna_no?.toString().includes(searchLower)
      )
      setFilteredAntennas(filtered)
    }
  }, [search, antennas])

  const handleAdd = () => {
    setEditingAntenna(null)
    setFormData({
      device_id: null,
      antenna_no: '',
      antenna_name: '',
      location_name: '',
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
      location_name: antenna.location_name || '',
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

  const handleSubmit = async () => {
    try {
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
          location_name: formData.location_name || undefined,
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
          location_name: formData.location_name || undefined,
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
        data={filteredAntennas as unknown as Record<string, unknown>[]}
        page={0}
        rowsPerPage={10}
        totalRows={filteredAntennas.length}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
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
            <Box sx={{ bgcolor: 'info.lighter', p: 2, borderRadius: 1 }}>
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
                onChange={(_, value) =>
                  handleInputChange('device_id', value?.device_id || null)
                }
                disabled={!!editingAntenna}
                renderInput={(params) => (
                  <TextField {...params} label="Device *" required />
                )}
              />
              <TextField
                label="Antenna Number *"
                type="number"
                fullWidth
                required
                value={formData.antenna_no}
                onChange={(e) =>
                  handleInputChange('antenna_no', e.target.value)
                }
                disabled={!!editingAntenna}
                placeholder="1, 2, 3, ..."
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Antenna Name"
                fullWidth
                value={formData.antenna_name}
                onChange={(e) =>
                  handleInputChange('antenna_name', e.target.value)
                }
                placeholder="e.g., Gate1-IN-left"
              />
              <TextField
                label="Location Name"
                fullWidth
                value={formData.location_name}
                onChange={(e) =>
                  handleInputChange('location_name', e.target.value)
                }
                placeholder="e.g., Dock Door 3"
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
              <FormControl fullWidth>
                <InputLabel>Antenna Type</InputLabel>
                <Select
                  value={formData.antenna_type}
                  onChange={(e) =>
                    handleInputChange('antenna_type', e.target.value)
                  }
                  label="Antenna Type"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="Circular">Circular</MenuItem>
                  <MenuItem value="Linear">Linear</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2 }}>
              Hardware Details
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Polarization</InputLabel>
                <Select
                  value={formData.polarization}
                  onChange={(e) =>
                    handleInputChange('polarization', e.target.value)
                  }
                  label="Polarization"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="LHCP">LHCP</MenuItem>
                  <MenuItem value="RHCP">RHCP</MenuItem>
                  <MenuItem value="Linear">Linear</MenuItem>
                </Select>
              </FormControl>
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
              <FormControl fullWidth>
                <InputLabel>Orientation</InputLabel>
                <Select
                  value={formData.orientation}
                  onChange={(e) =>
                    handleInputChange('orientation', e.target.value)
                  }
                  label="Orientation"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="IN">IN</MenuItem>
                  <MenuItem value="OUT">OUT</MenuItem>
                  <MenuItem value="LEFT">LEFT</MenuItem>
                  <MenuItem value="RIGHT">RIGHT</MenuItem>
                </Select>
              </FormControl>
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
              <FormControl fullWidth>
                <InputLabel>Enabled</InputLabel>
                <Select
                  value={formData.is_enabled ? 'true' : 'false'}
                  onChange={(e) =>
                    handleInputChange('is_enabled', e.target.value === 'true')
                  }
                  label="Enabled"
                >
                  <MenuItem value="true">Yes (Logical ON)</MenuItem>
                  <MenuItem value="false">No (Logical OFF)</MenuItem>
                </Select>
              </FormControl>
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
