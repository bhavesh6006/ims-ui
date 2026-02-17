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
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { DataTable, type Column } from '../components/organisms'
import { SearchBar, Alert } from '../components/molecules'
import { deviceService } from '../services'
import type {
  Device,
  DeviceCreatePayload,
  DeviceUpdatePayload,
} from '../services/deviceService'

const DeviceMaster: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const [formData, setFormData] = useState<
    DeviceCreatePayload & { status?: string }
  >({
    device_name: '',
    ip_address: '',
    location: '',
    department: '',
    installed_on: '',
    status: 'OFFLINE',
  })

  const columns: Column[] = [
    { id: 'device_name', label: 'Device Name' },
    { id: 'ip_address', label: 'IP Address' },
    { id: 'location', label: 'Location' },
    { id: 'department', label: 'Department' },
    {
      id: 'status',
      label: 'Status',
      format: (value: unknown) => {
        const status = value as string
        const colorMap: Record<
          string,
          'success' | 'error' | 'warning' | 'default'
        > = {
          ONLINE: 'success',
          OFFLINE: 'error',
          MAINTENANCE: 'warning',
        }
        return (
          <Chip
            label={status}
            color={colorMap[status] || 'default'}
            size="small"
          />
        )
      },
    },
    {
      id: 'manufacturer',
      label: 'Manufacturer',
      format: (value: unknown) => (value as string) || '-',
    },
    {
      id: 'model',
      label: 'Model',
      format: (value: unknown) => (value as string) || '-',
    },
    {
      id: 'serial_no',
      label: 'Serial No',
      format: (value: unknown) => (value as string) || '-',
    },
    {
      id: 'firmware_version',
      label: 'Firmware',
      format: (value: unknown) => (value as string) || '-',
    },
    {
      id: 'active_antennas',
      label: 'Active Antennas',
      format: (value: unknown, row?: Record<string, unknown>) => {
        if (!row) return '-'
        const active = value as number | undefined
        const total = row.total_antennas as number | undefined
        if (active === undefined || active === null) return '-'
        return `${active}${total ? `/${total}` : ''}`
      },
    },
    {
      id: 'last_seen_time',
      label: 'Last Seen',
      format: (value: unknown) => {
        if (!value) return '-'
        return new Date(value as string).toLocaleString()
      },
    },
  ]

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadDevices = useCallback(async () => {
    setLoading(true)
    try {
      const response = await deviceService.getAll()
      const devicesData = response.data || []
      setDevices(devicesData)
      setFilteredDevices(devicesData)
    } catch (error) {
      console.error('Error loading devices:', error)
      showAlert('Failed to load devices', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDevices()
  }, [loadDevices])

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredDevices(devices)
    } else {
      const searchLower = search.toLowerCase()
      const filtered = devices.filter(
        (device) =>
          device.device_name?.toLowerCase().includes(searchLower) ||
          device.ip_address?.toLowerCase().includes(searchLower) ||
          device.location?.toLowerCase().includes(searchLower) ||
          device.department?.toLowerCase().includes(searchLower) ||
          device.serial_no?.toLowerCase().includes(searchLower) ||
          device.status?.toLowerCase().includes(searchLower)
      )
      setFilteredDevices(filtered)
    }
  }, [search, devices])

  const handleAdd = () => {
    setEditingDevice(null)
    setFormData({
      device_name: '',
      ip_address: '',
      location: '',
      department: '',
      installed_on: '',
      status: 'OFFLINE',
    })
    setModalOpen(true)
  }

  const handleEdit = (row: Record<string, unknown>) => {
    const device = row as unknown as Device
    setEditingDevice(device)
    setFormData({
      device_name: device.device_name || '',
      ip_address: device.ip_address || '',
      location: device.location || '',
      department: device.department || '',
      installed_on: device.installed_on || '',
      status: device.status || 'OFFLINE',
    })
    setModalOpen(true)
  }

  const handleDelete = async (row: Record<string, unknown>) => {
    const device = row as unknown as Device
    if (
      window.confirm(
        `Are you sure you want to deactivate device "${device.device_name}"?`
      )
    ) {
      try {
        await deviceService.delete(device.device_id)
        showAlert('Device deactivated successfully', 'success')
        loadDevices()
      } catch (error) {
        console.error('Error deleting device:', error)
        showAlert('Failed to deactivate device', 'error')
      }
    }
  }

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.device_name || !formData.ip_address) {
        showAlert('Device name and IP address are required', 'error')
        return
      }

      if (editingDevice) {
        // Update existing device
        const updateData: DeviceUpdatePayload = {
          device_name: formData.device_name,
          ip_address: formData.ip_address,
          location: formData.location,
          department: formData.department,
          installed_on: formData.installed_on,
          status: formData.status as 'ONLINE' | 'OFFLINE' | 'MAINTENANCE',
        }
        await deviceService.update(editingDevice.device_id, updateData)
        showAlert('Device updated successfully', 'success')
      } else {
        // Create new device
        const createData: DeviceCreatePayload = {
          device_name: formData.device_name,
          ip_address: formData.ip_address,
          location: formData.location,
          department: formData.department,
          installed_on: formData.installed_on,
        }
        await deviceService.create(createData)
        showAlert(
          'Device created successfully. Middleware will sync device details.',
          'success'
        )
      }

      setModalOpen(false)
      loadDevices()
    } catch (error: unknown) {
      console.error('Error saving device:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to save device'
      showAlert(errorMessage, 'error')
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Device Master</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Device
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by device name, IP, location, department, serial no, or status..."
        />
      </Box>

      <DataTable
        columns={columns}
        data={filteredDevices as unknown as Record<string, unknown>[]}
        page={0}
        rowsPerPage={10}
        totalRows={filteredDevices.length}
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
              {editingDevice ? 'Edit Device' : 'Add New Device'}
            </Typography>
            <IconButton onClick={() => setModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Device Name"
                fullWidth
                required
                value={formData.device_name}
                onChange={(e) =>
                  handleInputChange('device_name', e.target.value)
                }
                placeholder="e.g., FX9600-WH-A"
              />
              <TextField
                label="IP Address"
                fullWidth
                required
                value={formData.ip_address}
                onChange={(e) =>
                  handleInputChange('ip_address', e.target.value)
                }
                placeholder="e.g., 192.168.1.100"
                disabled={!!editingDevice} // Disable IP change in edit mode
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Location"
                fullWidth
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Warehouse A - Gate 1"
              />
              <TextField
                label="Department"
                fullWidth
                value={formData.department}
                onChange={(e) =>
                  handleInputChange('department', e.target.value)
                }
                placeholder="e.g., Logistics"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Installation Date"
                type="date"
                fullWidth
                value={formData.installed_on}
                onChange={(e) =>
                  handleInputChange('installed_on', e.target.value)
                }
                InputLabelProps={{ shrink: true }}
              />
              {editingDevice && (
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status || 'OFFLINE'}
                    onChange={(e) =>
                      handleInputChange('status', e.target.value)
                    }
                    label="Status"
                  >
                    <MenuItem value="ONLINE">ONLINE</MenuItem>
                    <MenuItem value="OFFLINE">OFFLINE</MenuItem>
                    <MenuItem value="MAINTENANCE">MAINTENANCE</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          </Stack>

          {!editingDevice && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="body2" color="info.dark">
                <strong>Note:</strong> When adding a new device, only provide
                the basic information above. The middleware will automatically
                fetch and update additional details like MAC address, serial
                number, firmware version, and antenna capabilities.
              </Typography>
            </Box>
          )}

          {editingDevice && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Device Information (Read-only)
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="MAC Address"
                    fullWidth
                    value={editingDevice.mac_address || '-'}
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Hostname"
                    fullWidth
                    value={editingDevice.hostname || '-'}
                    InputProps={{ readOnly: true }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Serial Number"
                    fullWidth
                    value={editingDevice.serial_no || '-'}
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Manufacturer"
                    fullWidth
                    value={editingDevice.manufacturer || '-'}
                    InputProps={{ readOnly: true }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Model"
                    fullWidth
                    value={editingDevice.model || '-'}
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Firmware Version"
                    fullWidth
                    value={editingDevice.firmware_version || '-'}
                    InputProps={{ readOnly: true }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Total Antennas"
                    fullWidth
                    value={editingDevice.total_antennas || '-'}
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Active Antennas"
                    fullWidth
                    value={editingDevice.active_antennas || '-'}
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="CPU Usage (%)"
                    fullWidth
                    value={editingDevice.cpu_usage || '-'}
                    InputProps={{ readOnly: true }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Temperature (°C)"
                    fullWidth
                    value={editingDevice.temperature || '-'}
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Free Memory (MB)"
                    fullWidth
                    value={editingDevice.memory_free_mb || '-'}
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Uptime (sec)"
                    fullWidth
                    value={editingDevice.uptime_sec || '-'}
                    InputProps={{ readOnly: true }}
                  />
                </Box>
                <TextField
                  label="OS Description"
                  fullWidth
                  multiline
                  rows={2}
                  value={editingDevice.os_description || '-'}
                  InputProps={{ readOnly: true }}
                />
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setModalOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingDevice ? 'Update' : 'Create'}
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

export default DeviceMaster
