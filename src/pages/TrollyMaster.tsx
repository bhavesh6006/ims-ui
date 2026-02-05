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
  Paper,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { DataTable, type Column } from '../components/organisms'
import { SearchBar, Alert } from '../components/molecules'
import { trollyService, trolleyTypeService } from '../services'
import type { TrolleyType } from '../services/trolleyTypeService'
import type { Trolly } from '../types'

const TrollyMaster: React.FC = () => {
  const [trollies, setTrollies] = useState<Trolly[]>([])
  const [trolleyTypes, setTrolleyTypes] = useState<TrolleyType[]>([])
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

  const [formData, setFormData] = useState({
    trollyCode: '',
    trollyTypeId: '' as string,
    barcode: '',
    qrCode: '',
    lengthMm: '',
    widthMm: '',
    heightMm: '',
    volumeMm3: '',
    notes: '',
    status: 'ACTIVE' as string,
    trolleyImage: '',
  })
  const [imagePreview, setImagePreview] = useState<string>('')

  const columns: Column[] = [
    { id: 'trolley_code', label: 'Trolley Code' },
    {
      id: 'trolly_type',
      label: 'Type',
      format: (value: unknown) => String(value || '-'),
    },
    { id: 'barcode', label: 'Barcode' },
    { id: 'qr_code', label: 'QR Code' },
    {
      id: 'dimensions',
      label: 'Dimensions (L×W×H mm)',
      format: (_value: unknown, row?: Record<string, unknown>) => {
        const trolly = row as Trolly | undefined
        if (trolly) {
          return `${trolly.length_mm}×${trolly.width_mm}×${trolly.height_mm}`
        }
        return '-'
      },
    },
    {
      id: 'volume_mm3',
      label: 'Volume (mm³)',
      format: (value: unknown) => {
        const volume = value as string
        return Number(volume).toLocaleString()
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
      const response = await trollyService.getAll(page + 1, pageSize, search)
      setTrollies(response.data)
      setTotal(response.count)
    } catch {
      showAlert('Failed to load trollies', 'error')
    }
  }, [page, pageSize, search])

  const loadTrolleyTypes = useCallback(async () => {
    try {
      const response = await trolleyTypeService.getAll()

      // Handle different response structures
      const data = response.data || response
      const types = Array.isArray(data) ? data : []

      setTrolleyTypes(types)
    } catch {
      showAlert('Failed to load trolley types', 'error')
      setTrolleyTypes([]) // Ensure it's always an array even on error
    }
  }, [])

  useEffect(() => {
    loadTrollies()
    loadTrolleyTypes()
  }, [loadTrollies, loadTrolleyTypes])

  const handleAdd = () => {
    setEditingTrolly(null)
    setFormData({
      trollyCode: '',
      trollyTypeId: '',
      barcode: '',
      qrCode: '',
      lengthMm: '',
      widthMm: '',
      heightMm: '',
      volumeMm3: '',
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
      barcode: trolly.barcode || '',
      qrCode: trolly.qr_code || '',
      lengthMm: trolly.length_mm,
      widthMm: trolly.width_mm,
      heightMm: trolly.height_mm,
      volumeMm3: trolly.volume_mm3,
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
    if (window.confirm(`Delete trolly ${trolly.trolley_code}?`)) {
      try {
        await trollyService.delete(trolly.trolley_id)
        showAlert('Trolly deleted', 'success')
        loadTrollies()
      } catch {
        showAlert('Failed to delete', 'error')
      }
    }
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.trollyCode.trim()) {
      showAlert('Trolley Code is required', 'error')
      return
    }
    if (!formData.trollyTypeId) {
      showAlert('Type is required', 'error')
      return
    }

    try {
      const payload: Record<string, string> = {
        trolley_code: formData.trollyCode,
        trolly_type_id: formData.trollyTypeId,
        barcode: formData.barcode,
        qr_code: formData.qrCode,
        length_mm: formData.lengthMm || '0',
        width_mm: formData.widthMm || '0',
        height_mm: formData.heightMm || '0',
        volume_mm3: formData.volumeMm3 || '0',
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
        showAlert('Trolly updated', 'success')
      } else {
        await trollyService.create(payload)
        showAlert('Trolly created', 'success')
      }
      setModalOpen(false)
      loadTrollies()
    } catch {
      showAlert('Operation failed', 'error')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Trolly Master</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Trolly
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search trollies..."
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
      />

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTrolly ? 'Edit Trolly' : 'Add Trolly'}
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
              label="Trolley Code"
              value={formData.trollyCode}
              onChange={(e) =>
                setFormData({ ...formData, trollyCode: e.target.value })
              }
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.trollyTypeId}
                label="Type"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trollyTypeId: e.target.value as string,
                  })
                }
              >
                {trolleyTypes.map((type) => (
                  <MenuItem
                    key={type.trolly_type_id}
                    value={type.trolly_type_id}
                  >
                    {type.trolly_type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Barcode"
              value={formData.barcode}
              onChange={(e) =>
                setFormData({ ...formData, barcode: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="QR Code"
              value={formData.qrCode}
              onChange={(e) =>
                setFormData({ ...formData, qrCode: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Length (mm)"
              type="number"
              value={formData.lengthMm}
              onChange={(e) =>
                setFormData({ ...formData, lengthMm: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Width (mm)"
              type="number"
              value={formData.widthMm}
              onChange={(e) =>
                setFormData({ ...formData, widthMm: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Height (mm)"
              type="number"
              value={formData.heightMm}
              onChange={(e) =>
                setFormData({ ...formData, heightMm: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Volume (mm³)"
              type="number"
              value={formData.volumeMm3}
              onChange={(e) =>
                setFormData({ ...formData, volumeMm3: e.target.value })
              }
              fullWidth
            />

            {/* Status and Notes in first column */}
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

            {/* Trolley Image in second column with matching height */}
            <Box sx={{ gridRow: 'span 2' }}>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  fontSize: '0.875rem',
                  color: 'rgba(0, 0, 0, 0.6)',
                  fontWeight: 400,
                }}
              >
                Trolley Image (Optional)
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
                      alt="Trolley Preview"
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
              rows={3}
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
    </Box>
  )
}
export default TrollyMaster
