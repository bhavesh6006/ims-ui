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
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
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
    trollyType: 'STANDARD' as
      | 'HEAVY_DUTY'
      | 'LIGHT_DUTY'
      | 'MEDIUM_DUTY'
      | 'STANDARD',
    barcode: '',
    qrCode: '',
    lengthMm: '',
    widthMm: '',
    heightMm: '',
    volumeMm3: '',
    notes: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  })

  const columns: Column[] = [
    { id: 'trolley_code', label: 'Trolley Code' },
    { id: 'trolley_type', label: 'Type' },
    { id: 'barcode', label: 'Barcode' },
    { id: 'qr_code', label: 'QR Code' },
    {
      id: 'dimensions',
      label: 'Dimensions (L×W×H mm)',
      format: (value: unknown, row?: Record<string, unknown>) => {
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
      setTotal(response.total)
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
      trollyType: 'STANDARD',
      barcode: '',
      qrCode: '',
      lengthMm: '',
      widthMm: '',
      heightMm: '',
      volumeMm3: '',
      notes: '',
      status: 'ACTIVE',
    })
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
    })
    setModalOpen(true)
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
    try {
      const payload = {
        trolley_code: formData.trollyCode,
        trolley_type: formData.trollyType,
        barcode: formData.barcode,
        qr_code: formData.qrCode,
        length_mm: formData.lengthMm,
        width_mm: formData.widthMm,
        height_mm: formData.heightMm,
        volume_mm3: formData.volumeMm3,
        notes: formData.notes,
        status: formData.status,
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
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.trollyType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trollyType: e.target.value as
                      | 'HEAVY_DUTY'
                      | 'LIGHT_DUTY'
                      | 'MEDIUM_DUTY'
                      | 'STANDARD',
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
              required
            />
            <TextField
              label="Width (mm)"
              type="number"
              value={formData.widthMm}
              onChange={(e) =>
                setFormData({ ...formData, widthMm: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="Height (mm)"
              type="number"
              value={formData.heightMm}
              onChange={(e) =>
                setFormData({ ...formData, heightMm: e.target.value })
              }
              fullWidth
              required
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
