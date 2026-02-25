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
  FormHelperText,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { DataTable, type Column } from '../components/organisms'
import { SearchBar, Alert } from '../components/molecules'
import { storeLocationService } from '../services'
import { locationTypeService } from '../services/locationTypeService'
import type { StoreLocation } from '../types/storeLocation'
import type { LocationType } from '../types/locationType'

const StoreLocationMaster: React.FC = () => {
  const [locations, setLocations] = useState<StoreLocation[]>([])
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<StoreLocation | null>(
    null
  )
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  interface FormErrors {
    location_type_id?: string
    store_code?: string
  }

  const [errors, setErrors] = useState<FormErrors>({})

  const [formData, setFormData] = useState({
    store_code: '',
    store_name: '',
    factory_name: '',
    plant_name: '',
    hierarchy_level: '',
    total_area: '' as string | number,
    area_unit: 'sq_mtr' as 'sq_mtr' | 'sq_ft',
    remarks: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    location_type_id: '',
  })

  const columns: Column[] = [
    { id: 'store_code', label: 'Store Code' },
    { id: 'store_name', label: 'Store Name' },
    { id: 'factory_name', label: 'Factory' },
    { id: 'plant_name', label: 'Plant' },
    { id: 'hierarchy_level', label: 'Hierarchy Level' },
    {
      id: 'total_area',
      label: 'Total Area',
      format: (value: unknown, row?: Record<string, unknown>) => {
        if (!row) return '-'
        const area = value as number
        const unit = row.area_unit as string
        return area ? `${area} ${unit || ''}` : '-'
      },
    },
    {
      id: 'location_type_id',
      label: 'Location Type',
      format: (value: unknown) => {
        const typeId = value as string
        const type = locationTypes.find((lt) => lt.location_type_id === typeId)
        return type ? type.name : '-'
      },
    },
    { id: 'status', label: 'Status' },
  ]

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadLocationTypes = useCallback(async () => {
    try {
      const response = await locationTypeService.getAll()
      setLocationTypes(response.data || response)
    } catch {
      setLocationTypes([])
    }
  }, [])

  const loadLocations = useCallback(async () => {
    setLoading(true)
    try {
      const response = await storeLocationService.getAll(
        page + 1,
        pageSize,
        search
      )

      // Handle response based on the actual structure
      const locationData = response.data || []
      const totalCount = response.count || locationData.length

      setLocations(locationData)
      setTotal(totalCount)
    } catch (error) {
      console.error('Error loading locations:', error)
      showAlert('Failed to load locations', 'error')
      setLocations([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => {
    loadLocations()
    loadLocationTypes()
  }, [loadLocations, loadLocationTypes])

  // Add helper functions to map area units
  const mapApiAreaUnitToForm = (apiUnit: string): 'sq_mtr' | 'sq_ft' => {
    const mapping: Record<string, 'sq_mtr' | 'sq_ft'> = {
      SQM: 'sq_mtr',
      sq_mtr: 'sq_mtr',
      'Square Meters': 'sq_mtr',
      SQF: 'sq_ft',
      sq_ft: 'sq_ft',
      'Square Feet': 'sq_ft',
      'Sq. Foot': 'sq_ft',
    }
    return mapping[apiUnit] || 'sq_mtr'
  }

  const mapFormAreaUnitToApi = (formUnit: 'sq_mtr' | 'sq_ft'): string => {
    const mapping: Record<string, string> = {
      sq_mtr: 'SQM',
      sq_ft: 'SQF',
    }
    return mapping[formUnit] || formUnit
  }

  const handleAdd = () => {
    setEditingLocation(null)
    setFormData({
      store_code: '',
      store_name: '',
      factory_name: '',
      plant_name: '',
      hierarchy_level: '',
      total_area: '',
      area_unit: 'sq_mtr',
      remarks: '',
      status: 'ACTIVE',
      location_type_id: '',
    })
    //
    setModalOpen(true)
  }

  const handleEdit = (row: Record<string, unknown>) => {
    const location = row as unknown as StoreLocation
    setEditingLocation(location)
    setFormData({
      store_code: location.store_code || '',
      store_name: location.store_name || '',
      factory_name: location.factory_name || '',
      plant_name: location.plant_name || '',
      hierarchy_level: location.hierarchy_level || '',
      total_area: location.total_area || '',
      area_unit: mapApiAreaUnitToForm(location.area_unit || 'sq_mtr'),
      remarks: location.remarks || '',
      status: location.status,
      location_type_id:
        typeof location.location_type_id === 'string'
          ? location.location_type_id
          : typeof location.location_type_id === 'object' &&
              location.location_type_id !== null &&
              'location_type_id' in location.location_type_id &&
              typeof (
                location.location_type_id as { location_type_id: unknown }
              ).location_type_id === 'string'
            ? (location.location_type_id as { location_type_id: string })
                .location_type_id
            : '',
    })

    //
    setModalOpen(true)
  }

  const handleDelete = async (row: Record<string, unknown>) => {
    const location = row as unknown as StoreLocation
    if (
      window.confirm(
        `Are you sure you want to delete location "${location.store_name}"?`
      )
    ) {
      try {
        await storeLocationService.delete(location.store_location_id)
        showAlert('Location deleted successfully', 'success')
        loadLocations()
      } catch (error) {
        console.error('Error deleting location:', error)
        showAlert('Failed to delete location', 'error')
      }
    }
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.store_code?.trim()) {
      newErrors.store_code = 'Store Code is required'
    }

    if (!formData.location_type_id) {
      newErrors.location_type_id = 'Location Type is required'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    if (!formData.store_code.trim()) {
      showAlert('Store code is required', 'error')
      return
    }

    if (!formData.location_type_id) {
      showAlert('Location type is required', 'error')
      return
    }

    try {
      const payload = {
        store_code: formData.store_code,
        store_name: formData.store_name,
        factory_name: formData.factory_name || undefined,
        plant_name: formData.plant_name || undefined,
        hierarchy_level: formData.hierarchy_level || undefined,
        total_area: formData.total_area
          ? Number(formData.total_area)
          : undefined,
        area_unit: mapFormAreaUnitToApi(formData.area_unit),
        remarks: formData.remarks || undefined,
        status: formData.status,
        location_type_id: formData.location_type_id,
      }
      if (editingLocation) {
        await storeLocationService.update(
          editingLocation.store_location_id,
          payload
        )
        showAlert('Location updated successfully', 'success')
      } else {
        await storeLocationService.create(payload)
        showAlert('Location created successfully', 'success')
      }
      setModalOpen(false)
      loadLocations()
    } catch (error) {
      console.error('Error saving location:', error)
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Operation failed'
      showAlert(message, 'error')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Location Master</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Location
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by code, name, factory, or plant..."
        />
      </Box>

      <DataTable
        columns={columns}
        data={(locations || []) as unknown as Record<string, unknown>[]}
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
          {editingLocation ? 'Edit Location' : 'Add Location'}
          <IconButton
            onClick={() => setModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
              mb: 3,
            }}
          >
            <FormControl
              fullWidth
              required
              error={Boolean(errors.location_type_id)}
            >
              <InputLabel>Location Type</InputLabel>
              <Select
                label="Location Type"
                value={formData.location_type_id}
                onChange={(e) => {
                  setFormData({ ...formData, location_type_id: e.target.value })
                  setErrors({ ...errors, location_type_id: undefined })
                }}
              >
                {locationTypes.map((type) => (
                  <MenuItem
                    key={type.location_type_id}
                    value={type.location_type_id}
                  >
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.location_type_id}</FormHelperText>
            </FormControl>
            <TextField
              label="Store Code *"
              value={formData.store_code}
              onChange={(e) => {
                setFormData({ ...formData, store_code: e.target.value })
                setErrors({ ...errors, store_code: undefined })
              }}
              disabled={!!editingLocation}
              fullWidth
              error={Boolean(errors.store_code)}
              helperText={errors.store_code}
            />
            <TextField
              label="Store Name"
              value={formData.store_name}
              onChange={(e) =>
                setFormData({ ...formData, store_name: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Factory Name"
              value={formData.factory_name}
              onChange={(e) =>
                setFormData({ ...formData, factory_name: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Plant Name"
              value={formData.plant_name}
              onChange={(e) =>
                setFormData({ ...formData, plant_name: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Hierarchy Level"
              value={formData.hierarchy_level}
              onChange={(e) =>
                setFormData({ ...formData, hierarchy_level: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Total Area"
              type="number"
              value={formData.total_area}
              onChange={(e) =>
                setFormData({ ...formData, total_area: e.target.value })
              }
              fullWidth
              placeholder="Enter total area"
            />
            <FormControl fullWidth>
              <InputLabel>Area Unit</InputLabel>
              <Select
                label="Area Unit"
                value={formData.area_unit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    area_unit: e.target.value as 'sq_mtr' | 'sq_ft',
                  })
                }
              >
                <MenuItem value="sq_mtr">Square Meters</MenuItem>
                <MenuItem value="sq_ft">Square Feet</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'ACTIVE' | 'INACTIVE',
                  })
                }
              >
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Remarks"
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
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
