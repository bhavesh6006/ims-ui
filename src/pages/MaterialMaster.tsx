import React, { useState, useEffect, useCallback } from 'react'
import { MainLayout } from '../components/templates'
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  OutlinedInput,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { DataTable, type Column } from '../components/organisms'
import { SearchBar, Alert } from '../components/molecules'
import { materialService } from '../services'
import type { Material } from '../types'

const POSITIONS = [
  'Left',
  'Right',
  'Left Upper',
  'Left Lower',
  'Right Upper',
  'Right Lower',
]

const MaterialMaster: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const [formData, setFormData] = useState({
    materialId: '',
    materialName: '',
    materialType: 'Plastic' as
      | 'Plastic'
      | 'Metal'
      | 'Rubber'
      | 'Composite'
      | 'Other',
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    unit: 'cm' as 'mm' | 'cm' | 'm',
    weightUnit: 'kg' as 'kg' | 'g',
    allowedPositions: [] as string[],
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
  })

  const columns: Column[] = [
    { id: 'materialId', label: 'Material ID' },
    { id: 'materialName', label: 'Name' },
    { id: 'materialType', label: 'Type' },
    {
      id: 'dimensions',
      label: 'Dimensions',
      format: (dim: {
        length: number
        width: number
        height: number
        unit: string
      }) => `${dim.length}×${dim.width}×${dim.height} ${dim.unit}`,
    },
    {
      id: 'allowedPositions',
      label: 'Positions',
      format: (positions: string[]) => positions.join(', '),
    },
    {
      id: 'status',
      label: 'Status',
    },
  ]

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadMaterials = useCallback(async () => {
    try {
      const response = await materialService.getAll(page + 1, pageSize, search)
      setMaterials(response.data)
      setTotal(response.total)
    } catch {
      showAlert('Failed to load materials', 'error')
    }
  }, [page, pageSize, search])

  useEffect(() => {
    loadMaterials()
  }, [loadMaterials])

  const handleAdd = () => {
    setEditingMaterial(null)
    setFormData({
      materialId: '',
      materialName: '',
      materialType: 'Plastic',
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
      unit: 'cm',
      weightUnit: 'kg',
      allowedPositions: [],
      description: '',
      status: 'Active',
    })
    setModalOpen(true)
  }

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setFormData({
      materialId: material.materialId,
      materialName: material.materialName,
      materialType: material.materialType,
      length: material.dimensions.length,
      width: material.dimensions.width,
      height: material.dimensions.height,
      weight: material.dimensions.weight || 0,
      unit: material.dimensions.unit,
      weightUnit: material.dimensions.weightUnit || 'kg',
      allowedPositions: material.allowedPositions || [],
      description: material.description || '',
      status: material.status,
    })
    setModalOpen(true)
  }

  const handleDelete = async (material: Material) => {
    if (window.confirm(`Delete material ${material.materialId}?`)) {
      try {
        await materialService.delete(material.id)
        showAlert('Material deleted', 'success')
        loadMaterials()
      } catch {
        showAlert('Failed to delete', 'error')
      }
    }
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        materialId: formData.materialId,
        materialName: formData.materialName,
        materialType: formData.materialType,
        dimensions: {
          length: formData.length,
          width: formData.width,
          height: formData.height,
          weight: formData.weight,
          unit: formData.unit,
          weightUnit: formData.weightUnit,
        },
        allowedPositions: formData.allowedPositions as Array<
          | 'Left'
          | 'Right'
          | 'Left Upper'
          | 'Left Lower'
          | 'Right Upper'
          | 'Right Lower'
        >,
        status: formData.status,
      }

      if (editingMaterial) {
        await materialService.update(editingMaterial.id, payload)
        showAlert('Material updated', 'success')
      } else {
        await materialService.create(payload)
        showAlert('Material created', 'success')
      }
      setModalOpen(false)
      loadMaterials()
    } catch {
      showAlert('Operation failed', 'error')
    }
  }

  const handlePositionChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    setFormData({
      ...formData,
      allowedPositions: typeof value === 'string' ? value.split(',') : value,
    })
  }

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Material Master</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Material
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search materials..."
          />
        </Box>

        <DataTable
          columns={columns}
          data={materials}
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
            {editingMaterial ? 'Edit Material' : 'Add Material'}
            <IconButton
              onClick={() => setModalOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              <TextField
                label="Material ID"
                value={formData.materialId}
                onChange={(e) =>
                  setFormData({ ...formData, materialId: e.target.value })
                }
                fullWidth
              />
              <TextField
                label="Material Name"
                value={formData.materialName}
                onChange={(e) =>
                  setFormData({ ...formData, materialName: e.target.value })
                }
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Material Type</InputLabel>
                <Select
                  value={formData.materialType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      materialType: e.target.value as
                        | 'Plastic'
                        | 'Metal'
                        | 'Rubber'
                        | 'Composite'
                        | 'Other',
                    })
                  }
                >
                  <MenuItem value="Plastic">Plastic</MenuItem>
                  <MenuItem value="Metal">Metal</MenuItem>
                  <MenuItem value="Rubber">Rubber</MenuItem>
                  <MenuItem value="Composite">Composite</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ gridColumn: '1 / -1' }}>
                <InputLabel>Allowed Positions</InputLabel>
                <Select
                  multiple
                  value={formData.allowedPositions}
                  onChange={handlePositionChange}
                  input={<OutlinedInput label="Allowed Positions" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {POSITIONS.map((position) => (
                    <MenuItem key={position} value={position}>
                      {position}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Length"
                type="number"
                value={formData.length}
                onChange={(e) =>
                  setFormData({ ...formData, length: Number(e.target.value) })
                }
                fullWidth
              />
              <TextField
                label="Width"
                type="number"
                value={formData.width}
                onChange={(e) =>
                  setFormData({ ...formData, width: Number(e.target.value) })
                }
                fullWidth
              />
              <TextField
                label="Height"
                type="number"
                value={formData.height}
                onChange={(e) =>
                  setFormData({ ...formData, height: Number(e.target.value) })
                }
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unit: e.target.value as 'mm' | 'cm' | 'm',
                    })
                  }
                >
                  <MenuItem value="mm">mm</MenuItem>
                  <MenuItem value="cm">cm</MenuItem>
                  <MenuItem value="m">m</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Weight"
                type="number"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: Number(e.target.value) })
                }
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Weight Unit</InputLabel>
                <Select
                  value={formData.weightUnit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weightUnit: e.target.value as 'kg' | 'g',
                    })
                  }
                >
                  <MenuItem value="g">g</MenuItem>
                  <MenuItem value="kg">kg</MenuItem>
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
              {editingMaterial ? 'Update' : 'Create'}
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
    </MainLayout>
  )
}

export default MaterialMaster
