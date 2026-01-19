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
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { DataTable, type Column } from '../components/organisms'
import { SearchBar, Alert } from '../components/molecules'
import { storeLocationService } from '../services'
import type { StoreLocation } from '../types'

const StoreLocationMaster: React.FC = () => {
  const [locations, setLocations] = useState<StoreLocation[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<StoreLocation | null>(
    null
  )
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const [formData, setFormData] = useState({
    locationId: '',
    locationName: '',
    locationType: 'Store' as 'Factory' | 'Plant' | 'Store',
    parentLocationId: '',
    factoryCode: '',
    plantCode: '',
    storeCode: '',
    area: 0,
    areaUnit: 'sqm' as 'sqft' | 'sqm',
    associatedAntennaIds: [] as string[],
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
  })

  const columns: Column[] = [
    { id: 'locationId', label: 'Location ID' },
    { id: 'locationName', label: 'Name' },
    { id: 'locationType', label: 'Type' },
    { id: 'parentLocationId', label: 'Parent Location' },
    {
      id: 'area',
      label: 'Area',
      format: (area: number) => `${area}`,
    },
    { id: 'status', label: 'Status' },
  ]

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadLocations = useCallback(async () => {
    try {
      const response = await storeLocationService.getAll(
        page + 1,
        pageSize,
        search
      )
      setLocations(response.data)
      setTotal(response.total)
    } catch {
      showAlert('Failed to load locations', 'error')
    }
  }, [page, pageSize, search])

  useEffect(() => {
    loadLocations()
  }, [loadLocations])

  const handleAdd = () => {
    setEditingLocation(null)
    setFormData({
      locationId: '',
      locationName: '',
      locationType: 'Store',
      parentLocationId: '',
      factoryCode: '',
      plantCode: '',
      storeCode: '',
      area: 0,
      areaUnit: 'sqm',
      associatedAntennaIds: [],
      description: '',
      status: 'Active',
    })
    setModalOpen(true)
  }

  const handleEdit = (location: StoreLocation) => {
    setEditingLocation(location)
    setFormData({
      locationId: location.storeLocationId || '',
      locationName: location.storeName || '',
      locationType: 'Store',
      parentLocationId: '',
      factoryCode: location.hierarchy?.factory || '',
      plantCode: location.hierarchy?.plant || '',
      storeCode: location.hierarchy?.store || '',
      area: location.area?.value || 0,
      areaUnit: location.area?.unit === 'sq_mtr' ? 'sqm' : 'sqft',
      associatedAntennaIds: location.rfidAntennas || [],
      description: location.remarks || '',
      status: location.status,
    })
    setModalOpen(true)
  }

  const handleDelete = async (location: StoreLocation) => {
    if (window.confirm('Delete location?')) {
      try {
        await storeLocationService.delete(location.id)
        showAlert('Location deleted', 'success')
        loadLocations()
      } catch {
        showAlert('Failed to delete', 'error')
      }
    }
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        storeLocationId: formData.locationId,
        storeName: formData.locationName,
        factoryName: formData.factoryCode || 'Default Factory',
        plantBuildingName: formData.plantCode || 'Default Plant',
        hierarchy: {
          factory: formData.factoryCode || 'Default',
          plant: formData.plantCode || 'Default',
          store: formData.storeCode || formData.locationId,
        },
        area: {
          value: formData.area || 0,
          unit:
            formData.areaUnit === 'sqm'
              ? ('sq_mtr' as const)
              : ('sq_ft' as const),
        },
        rfidAntennas: formData.associatedAntennaIds,
        bleGateways: [],
        remarks: formData.description,
        status: formData.status,
      }

      if (editingLocation) {
        await storeLocationService.update(editingLocation.id, payload)
        showAlert('Location updated', 'success')
      } else {
        await storeLocationService.create(payload)
        showAlert('Location created', 'success')
      }
      setModalOpen(false)
      loadLocations()
    } catch {
      showAlert('Operation failed', 'error')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Store Location Master</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Location
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search locations..."
        />
      </Box>

      <DataTable
        columns={columns}
        data={locations}
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
          {editingLocation ? 'Edit Location' : 'Add Location'}
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
              label="Location ID"
              value={formData.locationId}
              onChange={(e) =>
                setFormData({ ...formData, locationId: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Location Name"
              value={formData.locationName}
              onChange={(e) =>
                setFormData({ ...formData, locationName: e.target.value })
              }
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.locationType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    locationType: e.target.value as
                      | 'Factory'
                      | 'Plant'
                      | 'Store',
                  })
                }
              >
                <MenuItem value="Factory">Factory</MenuItem>
                <MenuItem value="Plant">Plant</MenuItem>
                <MenuItem value="Store">Store</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Parent Location</InputLabel>
              <Select
                value={formData.parentLocationId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parentLocationId: e.target.value,
                  })
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
              label="Factory Code"
              value={formData.factoryCode}
              onChange={(e) =>
                setFormData({ ...formData, factoryCode: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Plant Code"
              value={formData.plantCode}
              onChange={(e) =>
                setFormData({ ...formData, plantCode: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Store Code"
              value={formData.storeCode}
              onChange={(e) =>
                setFormData({ ...formData, storeCode: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Area"
              type="number"
              value={formData.area}
              onChange={(e) =>
                setFormData({ ...formData, area: Number(e.target.value) })
              }
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Area Unit</InputLabel>
              <Select
                value={formData.areaUnit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    areaUnit: e.target.value as 'sqft' | 'sqm',
                  })
                }
              >
                <MenuItem value="sqft">sq ft</MenuItem>
                <MenuItem value="sqm">sq m</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'Active' | 'Inactive',
                  })
                }
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
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
            {editingLocation ? 'Update' : 'Create'}
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
export default StoreLocationMaster
