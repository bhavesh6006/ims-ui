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
import { mappingService, trollyService, materialService } from '../services'
import type { TrollyMaterialMapping, Trolly, Material } from '../types'

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

  const [formData, setFormData] = useState({
    trollyId: '',
    materialId: '',
    maxCapacity: 0,
    effectiveFrom: '',
    effectiveTo: '',
    notes: '',
    status: 'ACTIVE' as string,
  })

  const columns: Column[] = [
    { id: 'trollyId', label: 'Trolly ID' },
    { id: 'materialId', label: 'Material ID' },
    { id: 'maxCapacity', label: 'Max Capacity' },
    {
      id: 'effectiveFrom',
      label: 'Effective From',
      format: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      id: 'effectiveTo',
      label: 'Effective To',
      format: (date: string) =>
        date ? new Date(date).toLocaleDateString() : 'N/A',
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
      setTotal(response.total)
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
    setFormData({
      trollyId: '',
      materialId: '',
      maxCapacity: 0,
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      notes: '',
      status: 'ACTIVE',
    })
    setModalOpen(true)
  }

  const handleEdit = (mapping: TrollyMaterialMapping) => {
    setEditingMapping(mapping)
    setFormData({
      trollyId: mapping.trollyId,
      materialId: mapping.materialId,
      maxCapacity: mapping.maxCapacity,
      effectiveFrom: new Date(mapping.effectiveFrom)
        .toISOString()
        .split('T')[0],
      effectiveTo: mapping.effectiveTo
        ? new Date(mapping.effectiveTo).toISOString().split('T')[0]
        : '',
      notes: mapping.notes || '',
      status: mapping.status,
    })
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
    try {
      // Validate compatibility
      const isCompatible = await mappingService.validateCompatibility(
        formData.trollyId,
        formData.materialId,
        formData.maxCapacity
      )

      if (!isCompatible) {
        showAlert('Trolly and Material are not compatible', 'error')
        return
      }

      const payload = {
        trollyId: formData.trollyId,
        materialId: formData.materialId,
        trollyType: formData.trollyId.split('-')[0] || 'Bin',
        materialType: formData.materialId.split('-')[0] || 'Plastic',
        maxCapacity: formData.maxCapacity,
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: formData.effectiveTo || undefined,
        effectiveDate: formData.effectiveFrom,
        notes: formData.notes,
        version: 1,
        status: formData.status,
      }

      if (editingMapping) {
        await mappingService.update(editingMapping.id, payload)
        showAlert('Mapping updated', 'success')
      } else {
        await mappingService.create(payload)
        showAlert('Mapping created', 'success')
      }
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingMapping ? 'Edit Mapping' : 'Add Mapping'}
          <IconButton
            onClick={() => setModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Trolly</InputLabel>
              <Select
                value={formData.trollyId}
                onChange={(e) =>
                  setFormData({ ...formData, trollyId: e.target.value })
                }
                disabled={!!editingMapping}
              >
                {trollies.map((trolly) => (
                  <MenuItem key={trolly.id} value={trolly.trollyId}>
                    {trolly.trollyId} ({trolly.trollyType})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Material</InputLabel>
              <Select
                value={formData.materialId}
                onChange={(e) =>
                  setFormData({ ...formData, materialId: e.target.value })
                }
                disabled={!!editingMapping}
              >
                {materials.map((material) => (
                  <MenuItem key={material.id} value={material.materialId}>
                    {material.materialId} - {material.materialName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Max Capacity"
              type="number"
              value={formData.maxCapacity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxCapacity: Number(e.target.value),
                })
              }
              fullWidth
            />
            <TextField
              label="Effective From"
              type="date"
              value={formData.effectiveFrom}
              onChange={(e) =>
                setFormData({ ...formData, effectiveFrom: e.target.value })
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Effective To"
              type="date"
              value={formData.effectiveTo}
              onChange={(e) =>
                setFormData({ ...formData, effectiveTo: e.target.value })
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
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
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingMapping ? 'Update' : 'Create'}
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
