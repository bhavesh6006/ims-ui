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
import { trollyService } from '../services'
import type { Trolly } from '../types'

const TrollyMaster: React.FC = () => {
  const [trollies, setTrollies] = useState<Trolly[]>([])
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
    trollyType: '' as string,
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
    { id: 'trolley_type', label: 'Type' },
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

  useEffect(() => {
    loadTrollies()
  }, [loadTrollies])

  const handleAdd = () => {
    setEditingTrolly(null)
    setFormData({
      trollyCode: '',
      trollyType: '',
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
      trollyType: trolly.trolley_type,
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

  const getBlankImage = (): string => {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 400
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#e0e0e0'
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, canvas.width, canvas.height)
    }
    return canvas.toDataURL('image/png')
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
    if (!formData.trollyType) {
      showAlert('Type is required', 'error')
      return
    }

    try {
      const payload = {
        trolley_code: formData.trollyCode,
        trolley_type: formData.trollyType,
        barcode: formData.barcode,
        qr_code: formData.qrCode,
        length_mm: formData.lengthMm || '0',
        width_mm: formData.widthMm || '0',
        height_mm: formData.heightMm || '0',
        volume_mm3: formData.volumeMm3 || '0',
        notes: formData.notes,
        status: formData.status,
        trolley_image: formData.trolleyImage || getBlankImage(),
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
                value={formData.trollyType}
                label="Type"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trollyType: e.target.value as string,
                  })
                }
              >
                <MenuItem value="STANDARD">Standard</MenuItem>
                <MenuItem value="LIGHT_DUTY">Light Duty</MenuItem>
                <MenuItem value="MEDIUM_DUTY">Medium Duty</MenuItem>
                <MenuItem value="HEAVY_DUTY">Heavy Duty</MenuItem>
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

            {/* Image Section - Before Notes */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, fontWeight: 600, fontSize: '0.95rem' }}
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
                  minHeight: 100,
                  width: '100%',
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
                    component="img"
                    src={imagePreview}
                    alt="Trolley Preview"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: 80,
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <CloudUploadIcon
                      sx={{ fontSize: 32, color: '#bdbdbd', mb: 0.5 }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: '#757575', display: 'block' }}
                    >
                      Click to upload image (PNG, JPG up to 5MB)
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
              {imagePreview && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => {
                    setImagePreview('')
                    setFormData({ ...formData, trolleyImage: '' })
                  }}
                >
                  Remove Image
                </Button>
              )}
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
              sx={{ gridColumn: '1 / -1' }}
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
