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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import { DataTable, type Column } from '../components/organisms'
import { SearchBar, Alert } from '../components/molecules'
import { mappingService, trollyService, materialService } from '../services'
import type { TrollyMaterialMapping, Trolly, Material } from '../types'

interface MappingRow {
  id: string
  materialId: string
  maxCapacity: number
  effectiveFrom: string
  effectiveTo: string
  notes: string
}

const TrollyMaterialMapping: React.FC = () => {
  const [mappings, setMappings] = useState<TrollyMaterialMapping[]>([])
  const [trollies, setTrollies] = useState<Trolly[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMapping, setEditingMapping] =
    useState<TrollyMaterialMapping | null>(null)
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const [selectedTrollyId, setSelectedTrollyId] = useState('')
  const [mappingRows, setMappingRows] = useState<MappingRow[]>([])

  const columns: Column[] = [
    { id: 'trollyId', label: 'Trolly ID' },
    { id: 'materialId', label: 'Material ID' },
    { id: 'maxCapacity', label: 'Max Capacity' },
    {
      id: 'effectiveFrom',
      label: 'Effective From',
      format: (value: unknown) => {
        if (typeof value === 'string') {
          return new Date(value).toLocaleDateString()
        }
        return 'N/A'
      },
    },
    {
      id: 'effectiveTo',
      label: 'Effective To',
      format: (value: unknown) => {
        if (typeof value === 'string') {
          return new Date(value).toLocaleDateString()
        }
        return 'N/A'
      },
    },
    { id: 'status', label: 'Status' },
  ]

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadMappings = useCallback(async () => {
    try {
      const response = await mappingService.getAll(page + 1, pageSize, search)
      setMappings(response.data)
      setTotal(response.count)
    } catch {
      showAlert('Failed to load mappings', 'error')
    }
  }, [page, pageSize, search])

  const loadDropdownData = useCallback(async () => {
    try {
      const [trolliesRes, materialsRes] = await Promise.all([
        trollyService.getAll(1, 100),
        materialService.getAll(1, 100),
      ])
      setTrollies(trolliesRes.data)
      setMaterials(materialsRes.data)
    } catch {
      showAlert('Failed to load dropdown data', 'error')
    }
  }, [])

  useEffect(() => {
    loadMappings()
    loadDropdownData()
  }, [loadMappings, loadDropdownData])

  const handleAdd = () => {
    setEditingMapping(null)
    setSelectedTrollyId('')
    setMappingRows([
      {
        id: '1',
        materialId: '',
        maxCapacity: 0,
        effectiveFrom: new Date().toISOString().split('T')[0],
        effectiveTo: '',
        notes: '',
      },
    ])
    setModalOpen(true)
  }

  const handleAddMore = () => {
    const newId = (
      Math.max(...mappingRows.map((r) => Number(r.id)), 0) + 1
    ).toString()
    setMappingRows([
      ...mappingRows,
      {
        id: newId,
        materialId: '',
        maxCapacity: 0,
        effectiveFrom: new Date().toISOString().split('T')[0],
        effectiveTo: '',
        notes: '',
      },
    ])
  }

  const handleRowChange = (rowId: string, field: string, value: unknown) => {
    setMappingRows(
      mappingRows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    )
  }

  const handleRemoveRow = (rowId: string) => {
    if (mappingRows.length > 1) {
      setMappingRows(mappingRows.filter((row) => row.id !== rowId))
    } else {
      showAlert('At least one material must be mapped', 'error')
    }
  }

  const handleEdit = (mapping: TrollyMaterialMapping) => {
    setEditingMapping(mapping)
    setSelectedTrollyId(mapping.trollyId)
    setMappingRows([
      {
        id: mapping.id,
        materialId: mapping.materialId,
        maxCapacity: mapping.maxCapacity,
        effectiveFrom: new Date(mapping.effectiveFrom)
          .toISOString()
          .split('T')[0],
        effectiveTo: mapping.effectiveTo
          ? new Date(mapping.effectiveTo).toISOString().split('T')[0]
          : '',
        notes: mapping.notes || '',
      },
    ])
    setModalOpen(true)
  }

  const handleDelete = async (mapping: TrollyMaterialMapping) => {
    if (window.confirm('Delete this mapping?')) {
      try {
        await mappingService.delete(mapping.id)
        showAlert('Mapping deleted', 'success')
        loadMappings()
      } catch {
        showAlert('Failed to delete', 'error')
      }
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!selectedTrollyId) {
      showAlert('Please select a Trolly', 'error')
      return
    }

    if (mappingRows.length === 0) {
      showAlert('Please add at least one material mapping', 'error')
      return
    }

    // Validate all rows
    for (const row of mappingRows) {
      if (!row.materialId) {
        showAlert('Please select a material for all rows', 'error')
        return
      }
      if (row.maxCapacity <= 0) {
        showAlert('Max Capacity must be greater than 0', 'error')
        return
      }
    }

    try {
      const selectedTrolly = trollies.find(
        (t) => (t.trolley_id || t.trollyId) === selectedTrollyId
      )
      if (!selectedTrolly) {
        showAlert('Invalid trolly selected', 'error')
        return
      }

      // Create multiple mappings in parallel
      const promises = mappingRows.map((row) => {
        const payload = {
          trollyId: selectedTrollyId,
          materialId: row.materialId,
          trollyType:
            selectedTrolly.trolley_type || selectedTrolly.trollyType || 'Bin',
          materialType: row.materialId.split('-')[0] || 'Plastic',
          maxCapacity: row.maxCapacity,
          effectiveFrom: row.effectiveFrom,
          effectiveTo: row.effectiveTo || undefined,
          effectiveDate: row.effectiveFrom,
          notes: row.notes,
          version: 1,
          status: 'ACTIVE',
        }

        if (editingMapping && row.id === editingMapping.id) {
          return mappingService.update(editingMapping.id, payload)
        } else {
          return mappingService.create(payload)
        }
      })

      await Promise.all(promises)
      showAlert(
        `${mappingRows.length} material mapping(s) created successfully`,
        'success'
      )
      setModalOpen(false)
      loadMappings()
    } catch {
      showAlert('Operation failed', 'error')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Trolly-Material Mapping</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Mapping
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search mappings..."
        />
      </Box>

      <DataTable
        columns={columns}
        data={mappings}
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
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          {editingMapping ? 'Edit Mapping' : 'Add Multiple Material Mappings'}
          <IconButton
            onClick={() => setModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Trolly Selection */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                Select Trolly
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Trolly</InputLabel>
                <Select
                  value={selectedTrollyId}
                  onChange={(e) => setSelectedTrollyId(e.target.value)}
                  disabled={!!editingMapping}
                  label="Trolly"
                >
                  {trollies.map((trolly) => {
                    const trollyId = String(
                      trolly.trolley_id || trolly.trollyId || ''
                    )
                    const trollyCode = String(
                      trolly.trolley_code || trolly.trollyCode || ''
                    )
                    return (
                      <MenuItem key={String(trolly.id)} value={trollyId}>
                        {trollyCode}
                      </MenuItem>
                    )
                  })}
                </Select>
              </FormControl>
            </Box>

            {/* Materials Grid */}
            <Box>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Material Mappings ({mappingRows.length})
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddMore}
                >
                  Add More
                </Button>
              </Box>

              <TableContainer
                component={Paper}
                sx={{ mb: 2, maxHeight: 500, overflowY: 'auto' }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>
                        Material
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>
                        Max Capacity
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 130 }}>
                        Effective From
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 130 }}>
                        Effective To
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>
                        Notes
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 50 }}>
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mappingRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <InputLabel>Material</InputLabel>
                            <Select
                              label="Material"
                              value={row.materialId}
                              onChange={(e) =>
                                handleRowChange(
                                  row.id,
                                  'materialId',
                                  e.target.value
                                )
                              }
                            >
                              <MenuItem value="">
                                <em>Select Material</em>
                              </MenuItem>
                              {materials.map((material) => {
                                const matId = String(material.material_id)
                                const matCode = String(material.material_code)
                                return (
                                  <MenuItem key={matId} value={matId}>
                                    {matCode}
                                  </MenuItem>
                                )
                              })}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={row.maxCapacity}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                'maxCapacity',
                                Number(e.target.value)
                              )
                            }
                            inputProps={{ min: 0 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            size="small"
                            value={row.effectiveFrom}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                'effectiveFrom',
                                e.target.value
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            size="small"
                            value={row.effectiveTo}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                'effectiveTo',
                                e.target.value
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            multiline
                            rows={1}
                            size="small"
                            value={row.notes}
                            onChange={(e) =>
                              handleRowChange(row.id, 'notes', e.target.value)
                            }
                            sx={{ maxWidth: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveRow(row.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingMapping ? 'Update' : 'Create Mappings'}
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
export default TrollyMaterialMapping
