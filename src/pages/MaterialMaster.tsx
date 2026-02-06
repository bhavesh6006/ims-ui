import React, { useState, useEffect, useCallback } from 'react'
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
import {
  materialService,
  materialTypeService,
  subtoolPositionService,
} from '../services'
import type { SubtoolPosition } from '../services/subtoolPositionService'

type Material = {
  material_id: string
  material_code: string
  material_name: string
  material_type_id: string
  materialType?: { material_type: string } // For display purposes
  subtool_position_id: string[]
  subtoolPositions?: Array<{ subtool_position: string }> // For display purposes
  length_mm: string
  width_mm: string
  height_mm: string
  weight_kg: string
  status: string
  created_at: string
  updated_at: string
}

type MaterialType = {
  material_type_id: string
  material_type: string
}

const MaterialMaster: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([])
  const [subtoolPositions, setSubtoolPositions] = useState<SubtoolPosition[]>(
    []
  )
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
    materialCode: '',
    materialTypeId: '' as string,
    subtoolPositionIds: [] as string[],
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    unit: 'cm' as 'mm' | 'cm' | 'm',
    weightUnit: 'kg' as 'kg' | 'g',
    description: '',
    status: 'ACTIVE' as string,
  })

  const columns: Column[] = [
    { id: 'material_code', label: 'Material Code' },
    { id: 'material_name', label: 'Name' },
    {
      id: 'materialType',
      label: 'Type',
      format: (value: unknown) => {
        const type = value as { material_type: string } | undefined
        return type?.material_type || 'N/A'
      },
    },
    {
      id: 'subtoolPositions',
      label: 'Subtool Positions',
      format: (value: unknown) => {
        const positions = value as
          | Array<{ subtool_position: string }>
          | undefined
        if (!positions || positions.length === 0) return 'N/A'
        return positions.map((p) => p.subtool_position).join(', ')
      },
    },
    {
      id: 'length_mm', // Use an existing field
      label: 'Dimensions (mm)',
      format: (value: unknown, row?: unknown) => {
        const material = row as Material
        if (
          material &&
          material.length_mm &&
          material.width_mm &&
          material.height_mm
        ) {
          return `${material.length_mm}×${material.width_mm}×${material.height_mm}`
        }
        return 'N/A'
      },
    },
    { id: 'weight_kg', label: 'Weight (kg)' },
    { id: 'status', label: 'Status' },
  ]

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadMaterials = useCallback(async () => {
    try {
      const response = await materialService.getAll(page + 1, pageSize, search)

      // Handle different response structures
      const data = response.data || response
      const totalCount = response.count || data.length

      const mappedMaterials = (Array.isArray(data) ? data : []).map((item) => ({
        material_id: item.material_id,
        material_code: item.material_code,
        material_name: item.material_name,
        material_type_id: item.material_type_id,
        materialType: item.materialType,
        subtool_position_id: item.subtool_position_id || [],
        subtoolPositions: item.subtoolPositions || [],
        length_mm: parseFloat(String(item?.length_mm ?? 0)).toFixed(2),
        width_mm: parseFloat(String(item?.width_mm ?? 0)).toFixed(2),
        height_mm: parseFloat(String(item?.height_mm ?? 0)).toFixed(2),
        weight_kg: parseFloat(String(item?.weight_kg ?? 0)).toFixed(3),
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))

      setMaterials(mappedMaterials)
      setTotal(totalCount)
    } catch {
      showAlert('Failed to load materials', 'error')
    }
  }, [page, pageSize, search])

  const loadMaterialTypes = useCallback(async () => {
    try {
      const response = await materialTypeService.getAll()

      // Handle different response structures
      const data = response.data || response
      const types = Array.isArray(data) ? data : []

      setMaterialTypes(types)
    } catch {
      showAlert('Failed to load material types', 'error')
      setMaterialTypes([]) // Ensure it's always an array even on error
    }
  }, [])

  const loadSubtoolPositions = useCallback(async () => {
    try {
      const response = await subtoolPositionService.getAll()

      // Handle different response structures
      const data = response.data || response
      const positions = Array.isArray(data) ? data : []

      setSubtoolPositions(positions)
    } catch {
      showAlert('Failed to load subtool positions', 'error')
      setSubtoolPositions([]) // Ensure it's always an array even on error
    }
  }, [])

  useEffect(() => {
    loadMaterials()
    loadMaterialTypes()
    loadSubtoolPositions()
  }, [loadMaterials, loadMaterialTypes, loadSubtoolPositions])

  const handleAdd = () => {
    setEditingMaterial(null)
    setFormData({
      materialId: '',
      materialCode: '',
      materialName: '',
      materialTypeId: '',
      subtoolPositionIds: [],
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
      unit: 'cm',
      weightUnit: 'kg',
      description: '',
      status: 'ACTIVE',
    })
    setModalOpen(true)
  }

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setFormData({
      materialId: material.material_id,
      materialCode: material.material_code,
      materialName: material.material_name,
      materialTypeId: material.material_type_id,
      subtoolPositionIds: material.subtool_position_id || [],
      length: parseFloat(material.length_mm),
      width: parseFloat(material.width_mm),
      height: parseFloat(material.height_mm),
      weight: parseFloat(material.weight_kg),
      unit: 'mm',
      weightUnit: 'kg',
      description: '',
      status: material.status,
    })
    setModalOpen(true)
  }

  const handleDelete = async (material: Material) => {
    if (window.confirm(`Delete material ${material.material_id}?`)) {
      try {
        await materialService.delete(material.material_id)
        showAlert('Material deleted', 'success')
        loadMaterials()
      } catch {
        showAlert('Failed to delete', 'error')
      }
    }
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.materialCode.trim()) {
      showAlert('Material Code is required', 'error')
      return
    }
    if (!formData.materialName.trim()) {
      showAlert('Material Name is required', 'error')
      return
    }
    if (!formData.materialTypeId) {
      showAlert('Material Type is required', 'error')
      return
    }

    try {
      const payload = {
        material_code: formData.materialCode,
        material_name: formData.materialName,
        material_type_id: formData.materialTypeId,
        subtool_position_id:
          formData.subtoolPositionIds.length > 0
            ? formData.subtoolPositionIds
            : null,
        length_mm: formData.length.toString(),
        width_mm: formData.width.toString(),
        height_mm: formData.height.toString(),
        weight_kg: formData.weight.toString(),
        status: formData.status.toUpperCase(),
      }

      if (editingMaterial) {
        await materialService.update(editingMaterial.material_id, payload)
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
      subtoolPositionIds: typeof value === 'string' ? value.split(',') : value,
    })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Material Master</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
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

      <DataTable<Material>
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
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Material Code"
              value={formData.materialCode}
              onChange={(e) =>
                setFormData({ ...formData, materialCode: e.target.value })
              }
              required
              fullWidth
            />
            <TextField
              label="Material Name"
              value={formData.materialName}
              onChange={(e) =>
                setFormData({ ...formData, materialName: e.target.value })
              }
              required
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel>Material Type</InputLabel>
              <Select
                value={formData.materialTypeId}
                label="Material Type"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    materialTypeId: e.target.value as string,
                  })
                }
              >
                {materialTypes.map((type) => (
                  <MenuItem
                    key={type.material_type_id}
                    value={type.material_type_id}
                  >
                    {type.material_type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ gridColumn: '1 / -1' }}>
              <InputLabel>Subtool Positions</InputLabel>
              <Select
                multiple
                value={formData.subtoolPositionIds}
                onChange={handlePositionChange}
                input={<OutlinedInput label="Subtool Positions" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const position = subtoolPositions.find(
                        (p) => p.subtool_position_id === value
                      )
                      return (
                        <Chip
                          key={value}
                          label={position?.subtool_position || value}
                          size="small"
                        />
                      )
                    })}
                  </Box>
                )}
              >
                {subtoolPositions.map((position) => (
                  <MenuItem
                    key={position.subtool_position_id}
                    value={position.subtool_position_id}
                  >
                    {position.subtool_position}
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
                label="Unit"
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
                label="Weight Unit"
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
                label="Status"
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
  )
}
export default MaterialMaster
