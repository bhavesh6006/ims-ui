import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Paper,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CategoryIcon from '@mui/icons-material/Category'
import { DataTable, type Column } from '../components/organisms'
import { SearchBar, Alert } from '../components/molecules'
import {
  trollyService,
  trolleyTypeService,
  trolleyConditionService,
} from '../services'
import type { TrolleyType } from '../services/trolleyTypeService'
import type { TrolleyCondition } from '../services/trolleyConditionService'
import type { Trolly } from '../types'
import TrolleyTypeMaster from './TrolleyTypeMaster'

const TrollyMaster: React.FC = () => {
  const [trollies, setTrollies] = useState<Trolly[]>([])
  const [trolleyTypes, setTrolleyTypes] = useState<TrolleyType[]>([])
  const [trolleyConditions, setTrolleyConditions] = useState<
    TrolleyCondition[]
  >([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTrolly, setEditingTrolly] = useState<Trolly | null>(null)
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })
  const [loading, setLoading] = useState(false)
  const [trolleyTypesOpen, setTrolleyTypesOpen] = useState(false)

  interface FormErrors {
    trollyCode?: string
    trollyTypeId?: string
    trollyConditionId?: string
    qrCode?: string
  }

  const [errors, setErrors] = useState<FormErrors>({})

  const [formData, setFormData] = useState({
    trollyCode: '',
    trollyTypeId: '' as string,
    trollyConditionId: '' as string,
    barcode: '',
    qrCode: '',
    lengthMm: '',
    widthMm: '',
    heightMm: '',
    dimensionUnit: 'mm' as 'mm' | 'cm' | 'm',
    volumeMm3: '',
    volumeUnit: 'mm³' as 'mm³' | 'cm³' | 'm³',
    ownership: '',
    notes: '',
    status: 'ACTIVE' as string,
    trolleyImage: '',
  })
  const [imagePreview, setImagePreview] = useState<string>('')

  const columns: Column[] = [
    { id: 'trolley_code', label: 'Cart Code' },
    {
      id: 'trolly_type',
      label: 'Cart Type',
      format: (value: unknown) => String(value || '-'),
    },
    {
      id: 'trolly_condition',
      label: 'Condition',
      format: (value: unknown) => String(value || '-'),
    },
    { id: 'qr_code', label: 'QR Code / RFID' },
    {
      id: 'dimensions',
      label: 'Dimensions',
      format: (_value: unknown, row?: Record<string, unknown>) => {
        const trolly = row as Trolly | undefined
        if (trolly) {
          const unit = trolly.dimension_unit || 'mm'
          return `${trolly.length_mm}×${trolly.width_mm}×${trolly.height_mm} ${unit}`
        }
        return '-'
      },
    },
    {
      id: 'volume_mm3',
      label: 'Volume',
      format: (value: unknown, row?: Record<string, unknown>) => {
        const volume = value as string
        const trolly = row as Trolly | undefined
        const unit = trolly?.volume_unit || 'mm³'
        return `${Number(volume).toLocaleString()} ${unit}`
      },
    },
    {
      id: 'trolley_image',
      label: 'Image',
      format: (value: unknown) => {
        const imageUrl = value as string
        return imageUrl ? '[Image Available]' : '[No Image]'
      },
    },
    {
      id: 'status',
      label: 'Status',
      format: (value: unknown) => String(value),
    },
  ]

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadTrollies = useCallback(async () => {
    try {
      setLoading(true)
      const response = await trollyService.getAll(page + 1, pageSize, search)
      setTrollies(response.data)
      setTotal(response.count)
    } catch {
      showAlert('Failed to load carts', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  const loadTrolleyTypes = useCallback(async () => {
    try {
      const response = await trolleyTypeService.getAll()
      const sortedTypes = response.data.sort((a, b) =>
        a.trolly_type.localeCompare(b.trolly_type)
      )
      setTrolleyTypes(sortedTypes)
    } catch {
      showAlert('Failed to load cart types', 'error')
      setTrolleyTypes([])
    }
  }, [])

  const loadTrolleyConditions = useCallback(async () => {
    try {
      const conditions = await trolleyConditionService.getAll()
      // Sort alphabetically by name
      const sortedConditions = conditions.sort((a, b) =>
        a.name.localeCompare(b.name)
      )
      setTrolleyConditions(sortedConditions)
    } catch {
      showAlert('Failed to load cart conditions', 'error')
      setTrolleyConditions([])
    }
  }, [])

  useEffect(() => {
    loadTrollies()
    loadTrolleyTypes()
    loadTrolleyConditions()
  }, [loadTrollies, loadTrolleyTypes, loadTrolleyConditions])

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.trollyCode?.trim()) {
      newErrors.trollyCode = 'Cart Code is required'
    }

    if (!formData.trollyTypeId) {
      newErrors.trollyTypeId = 'Cart Type is required'
    }

    if (!formData.trollyConditionId) {
      newErrors.trollyConditionId = 'Condition is required'
    }

    if (!formData.qrCode?.trim()) {
      newErrors.qrCode = 'QR Code / RFID is required'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleAdd = () => {
    setEditingTrolly(null)
    setFormData({
      trollyCode: '',
      trollyTypeId: '',
      trollyConditionId: '',
      barcode: '',
      qrCode: '',
      lengthMm: '',
      widthMm: '',
      heightMm: '',
      dimensionUnit: 'mm',
      volumeMm3: '',
      volumeUnit: 'mm³',
      ownership: '',
      notes: '',
      status: 'ACTIVE',
      trolleyImage: '',
    })
    setImagePreview('')
    setModalOpen(true)
  }

  const handleEdit = (trolly: Trolly) => {
    setEditingTrolly(trolly)
    setFormData({
      trollyCode: trolly.trolley_code,
      trollyTypeId:
        ((trolly as Record<string, unknown>).trolly_type_id as string) || '',
      trollyConditionId:
        ((trolly as Record<string, unknown>).trolley_condition_id as string) ||
        '',
      barcode: trolly.barcode || '',
      qrCode: trolly.qr_code || '',
      lengthMm: trolly.length_mm || '',
      widthMm: trolly.width_mm || '',
      heightMm: trolly.height_mm || '',
      dimensionUnit: (trolly.dimension_unit || 'mm') as 'mm' | 'cm' | 'm',
      volumeMm3: trolly.volume_mm3 || '',
      volumeUnit: (trolly.volume_unit || 'mm³') as 'mm³' | 'cm³' | 'm³',
      ownership:
        ((trolly as Record<string, unknown>).ownership as string) || '',
      notes: trolly.notes || '',
      status: trolly.status,
      trolleyImage:
        ((trolly as Record<string, unknown>).trolley_image as string) || '',
    })
    setImagePreview(
      ((trolly as Record<string, unknown>).trolley_image as string) || ''
    )
    setModalOpen(true)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showAlert('Please select a valid image file', 'error')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        showAlert('Image size should be less than 5MB', 'error')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setImagePreview(base64String)
        setFormData({ ...formData, trolleyImage: base64String })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDelete = async (trolly: Trolly) => {
    if (window.confirm(`Delete cart ${trolly.trolley_code}?`)) {
      try {
        await trollyService.delete(trolly.trolley_id)
        showAlert('Cart deleted', 'success')
        loadTrollies()
      } catch {
        showAlert('Failed to delete', 'error')
      }
    }
  }

  const handleSubmit = async () => {
    if (!validate()) return

    // Validate required fields
    if (!formData.trollyCode.trim()) {
      showAlert('Cart Code is required', 'error')
      return
    }
    if (!formData.trollyTypeId) {
      showAlert('Cart Type is required', 'error')
      return
    }
    if (!formData.trollyConditionId) {
      showAlert('Condition is required', 'error')
      return
    }

    try {
      const payload: Record<string, string> = {
        trolley_code: formData.trollyCode,
        trolly_type_id: formData.trollyTypeId,
        trolley_condition_id: formData.trollyConditionId,
        barcode: formData.barcode,
        qr_code: formData.qrCode,
        length_mm: formData.lengthMm || '0',
        width_mm: formData.widthMm || '0',
        height_mm: formData.heightMm || '0',
        dimension_unit: formData.dimensionUnit,
        volume_mm3: formData.volumeMm3 || '0',
        volume_unit: formData.volumeUnit,
        ownership: formData.ownership,
        notes: formData.notes,
        status: formData.status,
      }

      // For updates, always include trolley_image (even if empty to remove it)
      // For creates, only include if it exists
      if (editingTrolly) {
        payload.trolley_image = formData.trolleyImage
      } else if (formData.trolleyImage) {
        payload.trolley_image = formData.trolleyImage
      }

      if (editingTrolly) {
        await trollyService.update(editingTrolly.trolley_id, payload)
        showAlert('Cart updated', 'success')
      } else {
        await trollyService.create(payload)
        showAlert('Cart created', 'success')
      }
      setModalOpen(false)
      loadTrollies()
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response === 'object' &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message
      ) {
        showAlert(
          (error as { response: { data: { message: string } } }).response.data
            .message,
          'error'
        )
      } else {
        showAlert('Failed to save cart', 'error')
      }
    }
  }

  const handleTrolleyTypesClose = () => {
    setTrolleyTypesOpen(false)
    loadTrolleyTypes()
    loadTrollies()
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Cart Master</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={() => setTrolleyTypesOpen(true)}
          >
            Manage Cart Types
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Cart
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search carts..."
        />
      </Box>

      <DataTable<Trolly>
        columns={columns}
        data={trollies}
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
          {editingTrolly ? 'Edit Cart' : 'Add Cart'}
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
              label="Cart Code"
              value={formData.trollyCode}
              onChange={(e) => {
                setFormData({ ...formData, trollyCode: e.target.value })
                setErrors({ ...errors, trollyCode: undefined })
              }}
              fullWidth
              required
              error={Boolean(errors.trollyCode)}
              helperText={errors.trollyCode}
            />
            <Autocomplete
              fullWidth
              options={trolleyTypes}
              getOptionLabel={(option) => option.trolly_type}
              value={
                trolleyTypes.find(
                  (type) => type.trolly_type_id === formData.trollyTypeId
                ) || null
              }
              onChange={(_, newValue) => {
                setFormData({
                  ...formData,
                  trollyTypeId: newValue?.trolly_type_id || '',
                })
                setErrors({ ...errors, trollyTypeId: undefined })
              }}
              isOptionEqualToValue={(option, value) =>
                option.trolly_type_id === value.trolly_type_id
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label=" Cart Type"
                  required
                  error={Boolean(errors.trollyTypeId)}
                  helperText={errors.trollyTypeId}
                />
              )}
            />
            <Autocomplete
              fullWidth
              options={trolleyConditions}
              getOptionLabel={(option) => option.name}
              value={
                trolleyConditions.find(
                  (cond) =>
                    cond.trolley_condition_id === formData.trollyConditionId
                ) || null
              }
              onChange={(_, newValue) => {
                setFormData({
                  ...formData,
                  trollyConditionId: newValue?.trolley_condition_id || '',
                })
                setErrors({ ...errors, trollyConditionId: undefined })
              }}
              isOptionEqualToValue={(option, value) =>
                option.trolley_condition_id === value.trolley_condition_id
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Condition"
                  required
                  error={Boolean(errors.trollyConditionId)}
                  helperText={errors.trollyConditionId}
                />
              )}
            />
            <TextField
              label="QR Code / RFID"
              value={formData.qrCode}
              onChange={(e) => {
                setFormData({ ...formData, qrCode: e.target.value })
                setErrors({ ...errors, qrCode: undefined })
              }}
              fullWidth
              required
              error={Boolean(errors.qrCode)}
              helperText={errors.qrCode}
            />
            <TextField
              label="Length"
              type="number"
              value={formData.lengthMm}
              onChange={(e) =>
                setFormData({ ...formData, lengthMm: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Width"
              type="number"
              value={formData.widthMm}
              onChange={(e) =>
                setFormData({ ...formData, widthMm: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Height"
              type="number"
              value={formData.heightMm}
              onChange={(e) =>
                setFormData({ ...formData, heightMm: e.target.value })
              }
              fullWidth
            />
            <Autocomplete
              fullWidth
              options={[
                { label: 'mm', value: 'mm' },
                { label: 'cm', value: 'cm' },
                { label: 'm', value: 'm' },
              ]}
              value={
                [
                  { label: 'mm', value: 'mm' },
                  { label: 'cm', value: 'cm' },
                  { label: 'm', value: 'm' },
                ].find((opt) => opt.value === formData.dimensionUnit) || null
              }
              onChange={(_, newValue) =>
                setFormData({
                  ...formData,
                  dimensionUnit: (newValue?.value as 'mm' | 'cm' | 'm') || 'mm',
                })
              }
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) =>
                option.value === value.value
              }
              renderInput={(params) => (
                <TextField {...params} label="Dimension Unit" />
              )}
            />
            <TextField
              label="Volume"
              type="number"
              value={formData.volumeMm3}
              onChange={(e) =>
                setFormData({ ...formData, volumeMm3: e.target.value })
              }
              fullWidth
            />
            <Autocomplete
              fullWidth
              options={[
                { label: 'mm³', value: 'mm³' },
                { label: 'cm³', value: 'cm³' },
                { label: 'm³', value: 'm³' },
              ]}
              value={
                [
                  { label: 'mm³', value: 'mm³' },
                  { label: 'cm³', value: 'cm³' },
                  { label: 'm³', value: 'm³' },
                ].find((opt) => opt.value === formData.volumeUnit) || null
              }
              onChange={(_, newValue) =>
                setFormData({
                  ...formData,
                  volumeUnit:
                    (newValue?.value as 'mm³' | 'cm³' | 'm³') || 'mm³',
                })
              }
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) =>
                option.value === value.value
              }
              renderInput={(params) => (
                <TextField {...params} label="Volume Unit" />
              )}
            />
            <TextField
              label="Ownership"
              value={formData.ownership}
              onChange={(e) =>
                setFormData({ ...formData, ownership: e.target.value })
              }
              fullWidth
            />

            {/* Status and Notes in first column */}
            <Autocomplete
              fullWidth
              options={[
                { label: 'ACTIVE', value: 'ACTIVE' },
                { label: 'INACTIVE', value: 'INACTIVE' },
              ]}
              value={
                [
                  { label: 'ACTIVE', value: 'ACTIVE' },
                  { label: 'INACTIVE', value: 'INACTIVE' },
                ].find((opt) => opt.value === formData.status) || null
              }
              onChange={(_, newValue) =>
                setFormData({
                  ...formData,
                  status: newValue?.value || 'ACTIVE',
                })
              }
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) =>
                option.value === value.value
              }
              renderInput={(params) => <TextField {...params} label="Status" />}
            />

            {/* Trolley Image in second column with matching height */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  fontSize: '0.875rem',
                  color: 'rgba(0, 0, 0, 0.6)',
                  fontWeight: 400,
                }}
              >
                Cart Image (Optional)
              </Typography>
              <Paper
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  border: '2px dashed #e0e0e0',
                  backgroundColor: '#fafafa',
                  height: 'calc(100% - 28px)',
                  minHeight: 122,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    borderColor: '#bdbdbd',
                  },
                }}
                component="label"
              >
                {imagePreview ? (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Cart Preview"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 120,
                        objectFit: 'contain',
                        flex: 1,
                      }}
                    />
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={(e) => {
                        e.preventDefault()
                        setImagePreview('')
                        setFormData({ ...formData, trolleyImage: '' })
                      }}
                    >
                      Remove Image
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <CloudUploadIcon
                      sx={{ fontSize: 32, color: '#bdbdbd', mb: 0.5 }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: '#757575', display: 'block' }}
                    >
                      Click to upload
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#9e9e9e',
                        display: 'block',
                        fontSize: '0.7rem',
                      }}
                    >
                      PNG, JPG up to 5MB
                    </Typography>
                  </Box>
                )}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Paper>
            </Box>

            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              fullWidth
              multiline
              rows={6}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTrolly ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Alert
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />

      <TrolleyTypeMaster
        open={trolleyTypesOpen}
        onClose={handleTrolleyTypesClose}
        onRefresh={() => {
          loadTrolleyTypes()
          loadTrollies()
        }}
      />
    </Box>
  )
}
export default TrollyMaster
