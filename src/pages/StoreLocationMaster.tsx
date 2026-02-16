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
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  TableContainer,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import { DataTable, type Column } from '../components/organisms'
import { SearchBar, Alert } from '../components/molecules'
import { storeLocationService, antennaService } from '../services'
import type { StoreLocation, AntennaMapping } from '../types/storeLocation'
import type { Antenna } from '../services/antennaService'

const StoreLocationMaster: React.FC = () => {
  const [locations, setLocations] = useState<StoreLocation[]>([])
  const [filteredLocations, setFilteredLocations] = useState<StoreLocation[]>(
    []
  )
  const [antennas, setAntennas] = useState<Antenna[]>([])
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
  })

  const [antennaMappings, setAntennaMappings] = useState<
    Array<{
      mapping_id?: string // for tracking existing mappings
      movement_type: 'IN' | 'OUT'
      antenna1_id: string
      antenna1_mapping_id?: string
      antenna2_id: string
      antenna2_mapping_id?: string
      antenna1_code?: string
      antenna1_name?: string
      antenna2_code?: string
      antenna2_name?: string
    }>
  >([])

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
      id: 'antennaMappings',
      label: 'Antenna Mappings',
      format: (value: unknown) => {
        const mappings = value as AntennaMapping[] | undefined
        if (!mappings || mappings.length === 0) return '-'
        return mappings
          .map((m) => `${m.antenna?.antenna_code} (${m.movement_type})`)
          .join(', ')
      },
    },
    { id: 'status', label: 'Status' },
  ]

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadAntennas = useCallback(async () => {
    try {
      const response = await antennaService.getAllUnmapped()
      const antennaData = response?.data ? response.data : []

      // Sort alphabetically by antenna_name
      const sortedAntennas = antennaData.sort((a, b) =>
        (a.antenna_name || '').localeCompare(b.antenna_name || '')
      )

      setAntennas(sortedAntennas)
    } catch (error) {
      console.error('Error loading antennas:', error)
      showAlert('Failed to load antennas', 'error')
      setAntennas([])
    }
  }, [])

  const loadLocations = useCallback(async () => {
    setLoading(true)
    try {
      const response = await storeLocationService.getAll()

      // Handle response based on the actual structure
      const locationData = response.data?.data || response.data || []

      // Preserve antenna_code and antenna_name in antennaMappings
      const updatedLocations = locationData.map((location: StoreLocation) => ({
        ...location,
        antennaMappings: location.antennaMappings?.map((mapping) => ({
          ...mapping,
          antenna_code: mapping.antenna?.antenna_code || '',
          antenna_name: mapping.antenna?.antenna_name || '',
        })),
      }))

      setLocations(updatedLocations)
      setFilteredLocations(updatedLocations)
    } catch (error) {
      console.error('Error loading store locations:', error)
      showAlert('Failed to load store locations', 'error')
      setLocations([])
      setFilteredLocations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLocations()
  }, [loadLocations])

  useEffect(() => {
    if (!search.trim()) {
      setFilteredLocations(locations)
    } else {
      const searchLower = search.toLowerCase()
      const filtered = locations.filter(
        (loc) =>
          loc.store_code?.toLowerCase().includes(searchLower) ||
          loc.store_name?.toLowerCase().includes(searchLower) ||
          loc.factory_name?.toLowerCase().includes(searchLower) ||
          loc.plant_name?.toLowerCase().includes(searchLower)
      )
      setFilteredLocations(filtered)
    }
  }, [search, locations])

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
    })
    setAntennaMappings([])
    loadAntennas()
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
    })

    // Group antenna mappings by movement_type and create rows
    const mappings = location.antennaMappings || []
    const groupedMappings: Record<string, AntennaMapping[]> = {}

    mappings.forEach((mapping) => {
      const key = mapping.movement_type
      if (!groupedMappings[key]) {
        groupedMappings[key] = []
      }
      groupedMappings[key].push(mapping)
    })

    const rows: Array<{
      movement_type: 'IN' | 'OUT'
      antenna1_id: string
      antenna1_mapping_id?: string
      antenna2_id: string
      antenna2_mapping_id?: string
      antenna1_code?: string
      antenna1_name?: string
      antenna2_code?: string
      antenna2_name?: string
    }> = []

    // Create rows from grouped mappings
    Object.entries(groupedMappings).forEach(([movementType, antennas]) => {
      const first = antennas[0]
      const second = antennas[1]

      rows.push({
        movement_type: movementType as 'IN' | 'OUT',
        antenna1_id: first?.antenna_id || '',
        antenna1_mapping_id: first?.mapping_id,
        antenna1_code:
          first?.antenna?.antenna_code || first?.antenna_code || '',
        antenna1_name:
          first?.antenna?.antenna_name || first?.antenna_name || '',
        antenna2_id: second?.antenna_id || '',
        antenna2_mapping_id: second?.mapping_id,
        antenna2_code:
          second?.antenna?.antenna_code || second?.antenna_code || '',
        antenna2_name:
          second?.antenna?.antenna_name || second?.antenna_name || '',
      })
    })

    setAntennaMappings(rows)
    loadAntennas()
    setModalOpen(true)
  }

  const handleDelete = async (row: Record<string, unknown>) => {
    const location = row as unknown as StoreLocation
    if (
      window.confirm(
        `Are you sure you want to delete store location "${location.store_name}"?`
      )
    ) {
      try {
        await storeLocationService.delete(location.store_location_id)
        showAlert('Store location deleted successfully', 'success')
        loadLocations()
      } catch (error) {
        console.error('Error deleting store location:', error)
        showAlert('Failed to delete store location', 'error')
      }
    }
  }

  const handleAddAntennaMapping = () => {
    setAntennaMappings([
      ...antennaMappings,
      {
        movement_type: 'IN',
        antenna1_id: '',
        antenna2_id: '',
      },
    ])
  }

  const handleRemoveAntennaMapping = (index: number) => {
    setAntennaMappings(antennaMappings.filter((_, i) => i !== index))
  }

  const handleAntennaMappingChange = (
    index: number,
    field: 'movement_type' | 'antenna1_id' | 'antenna2_id',
    value: string
  ) => {
    const updated = [...antennaMappings]
    updated[index] = { ...updated[index], [field]: value }
    setAntennaMappings(updated)
  }

  // Helper function to get available antennas for a specific row and field
  const getAvailableAntennas = (
    currentIndex: number,
    field: 'antenna1' | 'antenna2'
  ) => {
    const currentRow = antennaMappings[currentIndex]
    const otherField = field === 'antenna1' ? 'antenna2_id' : 'antenna1_id'
    const currentFieldId = field === 'antenna1' ? 'antenna1_id' : 'antenna2_id'

    // Get all selected antenna IDs except the current field's value and the other field in same row
    const selectedAntennaIds = antennaMappings
      .flatMap((m, idx) => {
        if (idx === currentIndex) {
          // For current row, only exclude the other field
          return [m[otherField]]
        }
        // For other rows, exclude both antennas
        return [m.antenna1_id, m.antenna2_id]
      })
      .filter(Boolean)

    return antennas.filter(
      (a) =>
        (a.status === 'ACTIVE' ||
          a.antenna_id === currentRow[currentFieldId]) &&
        !selectedAntennaIds.includes(a.antenna_id)
    )
  }

  const handleSubmit = async () => {
    if (!formData.store_code.trim()) {
      showAlert('Store code is required', 'error')
      return
    }

    // Validate that each row has at least the first antenna
    for (let i = 0; i < antennaMappings.length; i++) {
      if (!antennaMappings[i].antenna1_id) {
        showAlert(`Row ${i + 1}: First antenna is required`, 'error')
        return
      }
    }

    try {
      if (editingLocation) {
        // For editing, determine which mappings are new, existing, or removed
        const existingMappings = editingLocation.antennaMappings || []

        const mappingsToAdd: Array<{
          antenna_id: string
          movement_type: 'IN' | 'OUT'
        }> = []
        const mappingsToRemove: string[] = []
        const mappingsToUpdate: Array<{
          mapping_id: string
          antenna_id: string
          movement_type: 'IN' | 'OUT'
        }> = []

        // Track which existing mappings are still in use
        const usedMappingIds = new Set<string>()

        // Process each row
        antennaMappings.forEach((row) => {
          // Handle antenna 1
          if (row.antenna1_id) {
            if (row.antenna1_mapping_id) {
              // Existing mapping - check if it needs update
              const existing = existingMappings.find(
                (m) => m.mapping_id === row.antenna1_mapping_id
              )
              if (
                existing &&
                (existing.antenna_id !== row.antenna1_id ||
                  existing.movement_type !== row.movement_type)
              ) {
                mappingsToUpdate.push({
                  mapping_id: row.antenna1_mapping_id,
                  antenna_id: row.antenna1_id,
                  movement_type: row.movement_type,
                })
              }
              usedMappingIds.add(row.antenna1_mapping_id)
            } else {
              // New mapping
              mappingsToAdd.push({
                antenna_id: row.antenna1_id,
                movement_type: row.movement_type,
              })
            }
          }

          // Handle antenna 2
          if (row.antenna2_id) {
            if (row.antenna2_mapping_id) {
              // Existing mapping - check if it needs update
              const existing = existingMappings.find(
                (m) => m.mapping_id === row.antenna2_mapping_id
              )
              if (
                existing &&
                (existing.antenna_id !== row.antenna2_id ||
                  existing.movement_type !== row.movement_type)
              ) {
                mappingsToUpdate.push({
                  mapping_id: row.antenna2_mapping_id,
                  antenna_id: row.antenna2_id,
                  movement_type: row.movement_type,
                })
              }
              usedMappingIds.add(row.antenna2_mapping_id)
            } else {
              // New mapping
              mappingsToAdd.push({
                antenna_id: row.antenna2_id,
                movement_type: row.movement_type,
              })
            }
          }
        })

        // Find mappings to remove (existed before but not in current config)
        existingMappings.forEach((m) => {
          if (m.mapping_id && !usedMappingIds.has(m.mapping_id)) {
            mappingsToRemove.push(m.mapping_id)
          }
        })

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
          antenna_mappings_to_add:
            mappingsToAdd.length > 0 ? mappingsToAdd : undefined,
          antenna_mappings_to_remove:
            mappingsToRemove.length > 0 ? mappingsToRemove : undefined,
          antenna_mappings_to_update:
            mappingsToUpdate.length > 0 ? mappingsToUpdate : undefined,
        }

        await storeLocationService.update(
          editingLocation.store_location_id,
          payload
        )
        showAlert('Store location updated successfully', 'success')
      } else {
        // For creating, send all mappings
        const antenna_mappings: Array<{
          antenna_id: string
          movement_type: 'IN' | 'OUT'
        }> = []

        antennaMappings.forEach((row) => {
          if (row.antenna1_id) {
            antenna_mappings.push({
              antenna_id: row.antenna1_id,
              movement_type: row.movement_type,
            })
          }

          if (row.antenna2_id) {
            antenna_mappings.push({
              antenna_id: row.antenna2_id,
              movement_type: row.movement_type,
            })
          }
        })

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
          antenna_mappings,
        }

        await storeLocationService.create(payload)
        showAlert('Store location created successfully', 'success')
      }
      setModalOpen(false)
      loadLocations()
    } catch (error) {
      console.error('Error saving store location:', error)
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Operation failed'
      showAlert(message, 'error')
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
          placeholder="Search by code, name, factory, or plant..."
        />
      </Box>

      <DataTable
        columns={columns}
        data={(filteredLocations || []) as unknown as Record<string, unknown>[]}
        page={0}
        rowsPerPage={10}
        totalRows={(filteredLocations || []).length}
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
          {editingLocation ? 'Edit Store Location' : 'Add Store Location'}
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
            <TextField
              label="Store Code *"
              value={formData.store_code}
              onChange={(e) =>
                setFormData({ ...formData, store_code: e.target.value })
              }
              disabled={!!editingLocation}
              fullWidth
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

          <Box sx={{ mt: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">Antenna Mappings</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddAntennaMapping}
              >
                Add Mapping
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Movement Type</TableCell>
                    <TableCell>First Antenna *</TableCell>
                    <TableCell>Second Antenna (Optional)</TableCell>
                    <TableCell width={80}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {antennaMappings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No antenna mappings added
                      </TableCell>
                    </TableRow>
                  ) : (
                    antennaMappings.map((mapping, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={mapping.movement_type}
                              onChange={(e) =>
                                handleAntennaMappingChange(
                                  index,
                                  'movement_type',
                                  e.target.value as 'IN' | 'OUT'
                                )
                              }
                            >
                              <MenuItem value="IN">IN</MenuItem>
                              <MenuItem value="OUT">OUT</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" required>
                            <Select
                              value={mapping.antenna1_id}
                              onChange={(e) =>
                                handleAntennaMappingChange(
                                  index,
                                  'antenna1_id',
                                  e.target.value
                                )
                              }
                              displayEmpty
                              renderValue={(selected) => {
                                if (!selected) {
                                  return (
                                    <em style={{ color: '#999' }}>
                                      Select First Antenna *
                                    </em>
                                  )
                                }
                                const antenna = antennas.find(
                                  (a) => a.antenna_id === selected
                                )
                                return antenna
                                  ? `${antenna.antenna_code} - ${antenna.antenna_name}`
                                  : `${mapping.antenna1_code} - ${mapping.antenna1_name}`
                              }}
                            >
                              {getAvailableAntennas(index, 'antenna1').map(
                                (antenna) => (
                                  <MenuItem
                                    key={antenna.antenna_id}
                                    value={antenna.antenna_id}
                                  >
                                    {antenna.antenna_code} -{' '}
                                    {antenna.antenna_name}
                                  </MenuItem>
                                )
                              )}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={mapping.antenna2_id}
                              onChange={(e) =>
                                handleAntennaMappingChange(
                                  index,
                                  'antenna2_id',
                                  e.target.value
                                )
                              }
                              displayEmpty
                              renderValue={(selected) => {
                                if (!selected) {
                                  return (
                                    <em style={{ color: '#999' }}>
                                      Select Second Antenna (Optional)
                                    </em>
                                  )
                                }
                                const antenna = antennas.find(
                                  (a) => a.antenna_id === selected
                                )
                                return antenna
                                  ? `${antenna.antenna_code} - ${antenna.antenna_name}`
                                  : `${mapping.antenna2_code} - ${mapping.antenna2_name}`
                              }}
                            >
                              <MenuItem value="">
                                <em>None</em>
                              </MenuItem>
                              {getAvailableAntennas(index, 'antenna2').map(
                                (antenna) => (
                                  <MenuItem
                                    key={antenna.antenna_id}
                                    value={antenna.antenna_id}
                                  >
                                    {antenna.antenna_code} -{' '}
                                    {antenna.antenna_name}
                                  </MenuItem>
                                )
                              )}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveAntennaMapping(index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
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
