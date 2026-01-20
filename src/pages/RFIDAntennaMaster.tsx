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
  Switch,
  FormControlLabel,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { DataTable, type Column } from '../components/organisms'
import { SearchBar, Alert } from '../components/molecules'
import { rfidAntennaService, storeLocationService } from '../services'
import type { RFIDAntenna, StoreLocation } from '../types'

const RFIDAntennaMaster: React.FC = () => {
  const [antennas, setAntennas] = useState<RFIDAntenna[]>([])
  const [locations, setLocations] = useState<StoreLocation[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAntenna, setEditingAntenna] = useState<RFIDAntenna | null>(null)
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const [formData, setFormData] = useState({
    antennaId: '',
    antennaName: '',
    readerIp: '',
    readerPort: 0,
    antennaRole: 'Entry' as 'Entry' | 'Exit' | 'Internal',
    locationId: '',
    gateId: '',
    powerLevel: 30,
    frequency: 915,
    orientation: 'Horizontal' as 'Horizontal' | 'Vertical',
    mountingHeight: 0,
    isACTIVE: true,
    maintenanceMode: false,
    description: '',
    status: 'ACTIVE' as string,
  })

  const columns: Column[] = [
    { id: 'antennaId', label: 'Antenna ID' },
    { id: 'antennaName', label: 'Name' },
    { id: 'antennaRole', label: 'Role' },
    {
      id: 'readerIp',
      label: 'Reader IP',
    },
    { id: 'locationId', label: 'Location' },
    {
      id: 'isACTIVE',
      label: 'ACTIVE',
      format: (value: boolean) => (value ? 'Yes' : 'No'),
    },
    { id: 'status', label: 'Status' },
  ]

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadAntennas = useCallback(async () => {
    try {
      const response = await rfidAntennaService.getAll(
        page + 1,
        pageSize,
        search
      )
      setAntennas(response.data)
      setTotal(response.total)
    } catch {
      showAlert('Failed to load antennas', 'error')
    }
  }, [page, pageSize, search])

  const loadLocations = useCallback(async () => {
    try {
      const response = await storeLocationService.getAll(1, 100)
      setLocations(response.data)
    } catch {
      console.error('Failed to load locations')
    }
  }, [])

  useEffect(() => {
    loadAntennas()
    loadLocations()
  }, [loadAntennas, loadLocations])

  const handleAdd = () => {
    setEditingAntenna(null)
    setFormData({
      antennaId: '',
      antennaName: '',
      readerIp: '',
      readerPort: 5084,
      antennaRole: 'Entry',
      locationId: '',
      gateId: '',
      powerLevel: 30,
      frequency: 915,
      orientation: 'Horizontal',
      mountingHeight: 0,
      isACTIVE: true,
      maintenanceMode: false,
      description: '',
      status: 'ACTIVE',
    })
    setModalOpen(true)
  }

  const handleEdit = (antenna: RFIDAntenna) => {
    setEditingAntenna(antenna)
    setFormData({
      antennaId: antenna.antennaId,
      antennaName: antenna.antennaName,
      readerIp: antenna.readerId || '',
      readerPort: antenna.readerPortNumber || 0,
      antennaRole:
        antenna.antennaRole === 'Entry' || antenna.antennaRole === 'Exit'
          ? antenna.antennaRole
          : 'Internal',
      locationId: antenna.storeLocationId || '',
      gateId: antenna.gateId || '',
      powerLevel: antenna.txPower || 30,
      frequency: 915,
      orientation:
        antenna.orientation === 'Left' || antenna.orientation === 'Right'
          ? 'Horizontal'
          : 'Vertical',
      mountingHeight: 0,
      isACTIVE: antenna.status === 'ACTIVE',
      maintenanceMode: antenna.status === 'Maintenance',
      description: antenna.remarks || '',
      status: antenna.status === 'Maintenance' ? 'INACTIVE' : antenna.status,
    })
    setModalOpen(true)
  }

  const handleDelete = async (antenna: RFIDAntenna) => {
    if (window.confirm('Delete antenna?')) {
      try {
        await rfidAntennaService.delete(antenna.id)
        showAlert('Antenna deleted', 'success')
        loadAntennas()
      } catch {
        showAlert('Failed to delete', 'error')
      }
    }
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        antennaId: formData.antennaId,
        antennaName: formData.antennaName,
        antennaType: 'Circular Polarized' as const,
        frequencyRange: `${formData.frequency} MHz`,
        gain: 6,
        readerId: formData.readerIp,
        readerPortNumber: formData.readerPort,
        antennaRole:
          formData.antennaRole === 'Internal'
            ? ('Inside Zone' as const)
            : formData.antennaRole,
        orientation:
          formData.orientation === 'Horizontal'
            ? ('Left' as const)
            : ('Top' as const),
        mountingType: 'Gate' as const,
        txPower: formData.powerLevel,
        coverageArea: `${formData.mountingHeight}m`,
        storeLocationId: formData.locationId || undefined,
        gateId: formData.gateId || undefined,
        status: formData.maintenanceMode
          ? ('Maintenance' as const)
          : formData.status,
        remarks: formData.description,
      }

      if (editingAntenna) {
        await rfidAntennaService.update(editingAntenna.id, payload)
        showAlert('Antenna updated', 'success')
      } else {
        await rfidAntennaService.create(payload)
        showAlert('Antenna created', 'success')
      }
      setModalOpen(false)
      loadAntennas()
    } catch {
      showAlert('Operation failed', 'error')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">RFID Antenna Master</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Antenna
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search antennas..."
        />
      </Box>

      <DataTable
        columns={columns}
        data={antennas}
        page={page}
        rowsPerPage={pageSize}
        totalRows={total}
        onPageChange={setPage}
        onRowsPerPageChange={setPageSize}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingAntenna ? 'Edit Antenna' : 'Add Antenna'}
          <IconButton
            onClick={() => setModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Antenna ID"
              value={formData.antennaId}
              onChange={(e) =>
                setFormData({ ...formData, antennaId: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Antenna Name"
              value={formData.antennaName}
              onChange={(e) =>
                setFormData({ ...formData, antennaName: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Reader IP"
              value={formData.readerIp}
              onChange={(e) =>
                setFormData({ ...formData, readerIp: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Reader Port"
              type="number"
              value={formData.readerPort}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  readerPort: Number(e.target.value),
                })
              }
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.antennaRole}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    antennaRole: e.target.value as
                      | 'Entry'
                      | 'Exit'
                      | 'Internal',
                  })
                }
              >
                <MenuItem value="Entry">Entry</MenuItem>
                <MenuItem value="Exit">Exit</MenuItem>
                <MenuItem value="Internal">Internal</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={formData.locationId}
                onChange={(e) =>
                  setFormData({ ...formData, locationId: e.target.value })
                }
              >
                <MenuItem value="">None</MenuItem>
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.locationId}>
                    {loc.locationName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Gate ID"
              value={formData.gateId}
              onChange={(e) =>
                setFormData({ ...formData, gateId: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Power Level (dBm)"
              type="number"
              value={formData.powerLevel}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  powerLevel: Number(e.target.value),
                })
              }
              fullWidth
            />
            <TextField
              label="Frequency (MHz)"
              type="number"
              value={formData.frequency}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  frequency: Number(e.target.value),
                })
              }
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Orientation</InputLabel>
              <Select
                value={formData.orientation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    orientation: e.target.value as 'Horizontal' | 'Vertical',
                  })
                }
              >
                <MenuItem value="Horizontal">Horizontal</MenuItem>
                <MenuItem value="Vertical">Vertical</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Mounting Height (m)"
              type="number"
              value={formData.mountingHeight}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mountingHeight: Number(e.target.value),
                })
              }
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as string,
                  })
                }
              >
                <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                <MenuItem value="INACTIVE">INACTIVE</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isACTIVE}
                  onChange={(e) =>
                    setFormData({ ...formData, isACTIVE: e.target.checked })
                  }
                />
              }
              label="Is ACTIVE"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.maintenanceMode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maintenanceMode: e.target.checked,
                    })
                  }
                />
              }
              label="Maintenance Mode"
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
              sx={{ gridColumn: '1 / -1' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
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
