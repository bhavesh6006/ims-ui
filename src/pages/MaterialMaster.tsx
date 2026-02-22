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
  FormHelperText,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { DataTable, type Column } from '../components/organisms'
import { SearchBar, Alert } from '../components/molecules'
import {
  materialService,
  materialTypeService,
  subtoolService,
} from '../services'
import type { Subtool } from '../services/subtoolService'

type Material = {
  material_id: string
  material_code: string
  material_name: string
  material_type_id: string
  materialType?: { material_type: string } // For display purposes
  subtool_id: string
  subtool?: { subtool_id: string; name: string } // For display purposes
  subtoolName?: string // For display purposes - extracted from subtool.name
  length_mm: string
  width_mm: string
  height_mm: string
  dimension_unit: string
  weight_kg: string
  weight_unit: string
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
  const [subtools, setSubtools] = useState<Subtool[]>([])
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

  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    materialId: '',
    materialName: '',
    materialCode: '',
    materialTypeId: '' as string,
    subtoolId: '' as string,
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    unit: 'cm' as 'mm' | 'cm' | 'm',
    weightUnit: 'kg' as 'kg' | 'g',
    description: '',
    status: 'ACTIVE' as string,
  })

  interface FormErrors {
    material_code?: string
    material_name?: string
    material_type_id?: string
    subtool_id?: string
  }

  const [errors, setErrors] = useState<FormErrors>({})

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
      id: 'subtoolName',
      label: 'Subtool',
      format: (value: unknown) => {
        const name = value as string | undefined
        return name || 'N/A'
      },
    },
    {
      id: 'length_mm',
      label: 'Dimensions',
      format: (_value: unknown, row?: unknown) => {
        const material = row as Material
        if (
          material &&
          material.length_mm &&
          material.width_mm &&
          material.height_mm
        ) {
          const unit = material.dimension_unit || 'mm'
          return `${material.length_mm}×${material.width_mm}×${material.height_mm} ${unit}`
        }
        return 'N/A'
      },
    },
    {
      id: 'weight_kg',
      label: 'Weight',
      format: (value: unknown, row?: unknown) => {
        const material = row as Material
        const unit = material?.weight_unit || 'kg'
        return value ? `${value} ${unit}` : 'N/A'
      },
    },
    { id: 'status', label: 'Status' },
  ]

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadMaterials = useCallback(async () => {
    try {
      setLoading(true)
      const response = await materialService.getAll(page + 1, pageSize, search)

      // Handle different response structures
      const data = response.data || response
      const totalCount = response.count || data.length

      const mappedMaterials: Material[] = (Array.isArray(data) ? data : []).map(
        (item) => {
          // Handle materialType
          const materialTypeObj: { material_type: string } = {
            material_type: '',
          }
          if (
            item.materialType &&
            typeof item.materialType === 'object' &&
            'material_type' in item.materialType
          ) {
            materialTypeObj.material_type = String(
              (item.materialType as { material_type: string }).material_type ??
                ''
            )
          } else if ('material_type' in item) {
            materialTypeObj.material_type = String(item.material_type ?? '')
          }

          // Handle subtool
          let subtoolObj: { subtool_id: string; name: string } | undefined =
            undefined
          if (
            item.subtool &&
            typeof item.subtool === 'object' &&
            'subtool_id' in item.subtool &&
            'name' in item.subtool
          ) {
            const s = item.subtool as { subtool_id: string; name: string }
            subtoolObj = {
              subtool_id: String(s.subtool_id ?? ''),
              name: String(s.name ?? ''),
            }
          }

          return {
            material_id: String(item.material_id ?? ''),
            material_code: String(item.material_code ?? ''),
            material_name: String(item.material_name ?? ''),
            material_type_id: String(item.material_type_id ?? ''),
            materialType: materialTypeObj,
            subtool_id: String(item.subtool_id ?? ''),
            subtool: subtoolObj,
            subtoolName: subtoolObj ? subtoolObj.name : '',
            length_mm: parseFloat(String(item?.length_mm ?? 0)).toFixed(2),
            width_mm: parseFloat(String(item?.width_mm ?? 0)).toFixed(2),
            height_mm: parseFloat(String(item?.height_mm ?? 0)).toFixed(2),
            dimension_unit: String(item.dimension_unit ?? 'mm'),
            weight_kg: parseFloat(String(item?.weight_kg ?? 0)).toFixed(3),
            weight_unit: String(item.weight_unit ?? 'kg'),
            status: String(item.status ?? ''),
            created_at: String(item.created_at ?? ''),
            updated_at: String(item.updated_at ?? ''),
          }
        }
      )

      setMaterials(mappedMaterials)
      setTotal(totalCount)
    } catch {
      showAlert('Failed to load materials', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  const loadMaterialTypes = useCallback(async () => {
    try {
      let types = await materialTypeService.getAll()
      // Handle wrapped response (e.g., { data: [...] })
      if (!Array.isArray(types) && types && Array.isArray(types.data)) {
        types = types.data
      }
      const sortedTypes = types.sort((a, b) =>
        a.material_type.localeCompare(b.material_type)
      )
      setMaterialTypes(sortedTypes)
    } catch {
      showAlert('Failed to load material types', 'error')
      setMaterialTypes([])
    }
  }, [])

  const loadSubtools = useCallback(async () => {
    try {
      let subtoolList = await subtoolService.getAll()
      // Handle wrapped response (e.g., { data: [...] })
      if (
        !Array.isArray(subtoolList) &&
        subtoolList &&
        Array.isArray(subtoolList.data)
      ) {
        subtoolList = subtoolList.data
      }
      const sortedSubtools = subtoolList.sort((a, b) =>
        a.name.localeCompare(b.name)
      )
      setSubtools(sortedSubtools)
    } catch {
      showAlert('Failed to load subtools', 'error')
      setSubtools([])
    }
  }, [])

  useEffect(() => {
    loadMaterials()
    loadMaterialTypes()
    loadSubtools()
  }, [loadMaterials, loadMaterialTypes, loadSubtools])

  const handleAdd = () => {
    setEditingMaterial(null)
    setFormData({
      materialId: '',
      materialCode: '',
      materialName: '',
      materialTypeId: '',
      subtoolId: '',
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
      subtoolId: material.subtool_id || '',
      length: parseFloat(material.length_mm),
      width: parseFloat(material.width_mm),
      height: parseFloat(material.height_mm),
      weight: parseFloat(material.weight_kg),
      unit: (material.dimension_unit || 'mm') as 'mm' | 'cm' | 'm',
      weightUnit: (material.weight_unit || 'kg') as 'kg' | 'g',
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

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.materialCode?.trim()) {
      newErrors.material_code = 'Material Code is required'
    }

    if (!formData.materialName?.trim()) {
      newErrors.material_name = 'Material Name is required'
    }

    if (!formData.materialTypeId) {
      newErrors.material_type_id = 'Material Type is required'
    }

    if (!formData.subtoolId) {
      newErrors.subtool_id = 'Subtool is required'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

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
        subtool_id: formData.subtoolId || null,
        length_mm: formData.length.toString(),
        width_mm: formData.width.toString(),
        height_mm: formData.height.toString(),
        dimension_unit: formData.unit,
        weight_kg: formData.weight.toString(),
        weight_unit: formData.weightUnit,
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
        loading={loading}
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
              onChange={(e) => {
                setFormData({ ...formData, materialCode: e.target.value })
                setErrors({ ...errors, material_code: undefined })
              }}
              required
              fullWidth
              error={Boolean(errors.material_code)}
              helperText={errors.material_code}
            />
            <TextField
              label="Material Name"
              value={formData.materialName}
              onChange={(e) => {
                setFormData({ ...formData, materialName: e.target.value })
                setErrors({ ...errors, material_name: undefined })
              }}
              required
              fullWidth
              error={Boolean(errors.material_name)}
              helperText={errors.material_name}
            />
            <FormControl
              fullWidth
              required
              error={Boolean(errors.material_type_id)}
            >
              <InputLabel>Material Type</InputLabel>
              <Select
                value={formData.materialTypeId}
                label="Material Type"
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    materialTypeId: e.target.value as string,
                  })
                  setErrors({ ...errors, material_type_id: undefined })
                }}
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
              <FormHelperText>{errors.material_type_id}</FormHelperText>
            </FormControl>
            <FormControl fullWidth required error={Boolean(errors.subtool_id)}>
              <InputLabel>Subtool</InputLabel>
              <Select
                value={formData.subtoolId}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    subtoolId: e.target.value as string,
                  })
                  setErrors({ ...errors, subtool_id: undefined })
                }}
                label="Subtool"
              >
                <MenuItem value="">None</MenuItem>
                {subtools.map((subtool) => (
                  <MenuItem key={subtool.subtool_id} value={subtool.subtool_id}>
                    {subtool.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.subtool_id}</FormHelperText>
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
                <MenuItem value="cm">cm</MenuItem>
                <MenuItem value="m">m</MenuItem>
                <MenuItem value="mm">mm</MenuItem>
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
