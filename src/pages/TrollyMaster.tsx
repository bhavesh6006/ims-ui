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
    trollyId: '',
    trollyType: 'Bin' as 'Bin' | 'Rack' | 'Pallet' | 'Cage',
    barcode: '',
    qrCode: '',
    length: 0,
    width: 0,
    height: 0,
    volume: 0,
    unit: 'cm' as 'mm' | 'cm' | 'm',
    notes: '',
    status: 'Active' as 'Active' | 'Inactive',
  })

  const columns: Column[] = [
    { id: 'trollyId', label: 'Trolly ID' },
    { id: 'trollyType', label: 'Type' },
    { id: 'barcode', label: 'Barcode' },
    { id: 'qrCode', label: 'QR Code' },
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
      id: 'status',
      label: 'Status',
      format: (status: string) => status,
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
      trollyId: '',
      trollyType: 'Bin',
      barcode: '',
      qrCode: '',
      length: 0,
      width: 0,
      height: 0,
      volume: 0,
      unit: 'cm',
      notes: '',
      status: 'Active',
    })
    setModalOpen(true)
  }

  const handleEdit = (trolly: Trolly) => {
    setEditingTrolly(trolly)
    setFormData({
      trollyId: trolly.trollyId,
      trollyType: trolly.trollyType === 'Other' ? 'Bin' : trolly.trollyType,
      barcode: trolly.barcode || '',
      qrCode: trolly.qrCode || '',
      length: trolly.dimensions.length,
      width: trolly.dimensions.width,
      height: trolly.dimensions.height,
      volume: trolly.dimensions.volume || 0,
      unit: trolly.dimensions.unit,
      notes: trolly.notes || '',
      status: trolly.status,
    })
    setModalOpen(true)
  }

  const handleDelete = async (trolly: Trolly) => {
    if (window.confirm(`Delete trolly ${trolly.trollyId}?`)) {
      try {
        await trollyService.delete(trolly.id)
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
        trollyId: formData.trollyId,
        trollyType: formData.trollyType,
        barcode: formData.barcode,
        qrCode: formData.qrCode,
        dimensions: {
          length: formData.length,
          width: formData.width,
          height: formData.height,
          volume: formData.volume,
          unit: formData.unit,
        },
        notes: formData.notes,
        status: formData.status,
      }

      if (editingTrolly) {
        await trollyService.update(editingTrolly.id, payload)
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

      <DataTable
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
              label="Trolly ID"
              value={formData.trollyId}
              onChange={(e) =>
                setFormData({ ...formData, trollyId: e.target.value })
              }
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.trollyType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trollyType: e.target.value as
                      | 'Bin'
                      | 'Rack'
                      | 'Pallet'
                      | 'Cage',
                  })
                }
              >
                <MenuItem value="Bin">Bin</MenuItem>
                <MenuItem value="Rack">Rack</MenuItem>
                <MenuItem value="Pallet">Pallet</MenuItem>
                <MenuItem value="Cage">Cage</MenuItem>
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
              label="Volume"
              type="number"
              value={formData.volume}
              onChange={(e) =>
                setFormData({ ...formData, volume: Number(e.target.value) })
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
                    status: e.target.value as 'Active' | 'Inactive',
                  })
                }
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
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
