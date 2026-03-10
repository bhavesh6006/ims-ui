import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { DataTable, type Column } from '../components/organisms'
import { SearchBar, Alert } from '../components/molecules'
import { trolleyTypeService } from '../services'
import type { TrolleyType } from '../services/trolleyTypeService'

interface Props {
  open: boolean
  onClose: () => void
  onRefresh?: () => void
}

const TrolleyTypeMaster: React.FC<Props> = ({ open, onClose, onRefresh }) => {
  const [types, setTypes] = useState<TrolleyType[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editingType, setEditingType] = useState<TrolleyType | null>(null)
  const [typeName, setTypeName] = useState('')
  const [typeNameError, setTypeNameError] = useState('')

  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadTypes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await trolleyTypeService.getAll(
        page + 1,
        pageSize,
        search
      )
      setTypes(response.data)
      setTotal(response.count)
    } catch {
      showAlert('Failed to load cart types', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => {
    if (open) loadTypes()
  }, [open, loadTypes])

  const columns: Column[] = [
    { id: 'trolly_type', label: 'Cart Type' },
    {
      id: 'created_at',
      label: 'Created At',
      format: (value: unknown) =>
        value ? new Date(value as string).toLocaleDateString() : '-',
    },
  ]

  const handleAdd = () => {
    setEditingType(null)
    setTypeName('')
    setTypeNameError('')
    setFormOpen(true)
  }

  const handleEdit = (row: Record<string, unknown>) => {
    const type = row as unknown as TrolleyType
    setEditingType(type)
    setTypeName(type.trolly_type)
    setTypeNameError('')
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    if (!typeName.trim()) {
      setTypeNameError('Cart Type name is required')
      return
    }
    try {
      if (editingType) {
        await trolleyTypeService.update(editingType.trolly_type_id, {
          trolly_type: typeName.trim(),
        })
        showAlert('Cart type updated', 'success')
      } else {
        await trolleyTypeService.create({ trolly_type: typeName.trim() })
        showAlert('Cart type created', 'success')
      }
      setFormOpen(false)
      loadTypes()
      onRefresh?.()
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Failed to save cart type'
      showAlert(msg, 'error')
    }
  }

  return (
    <>
      {/* Main Cart Types Dialog */}
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Cart Types
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search cart types..."
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              size="medium"
            >
              Add Cart Type
            </Button>
          </Box>

          <DataTable<Record<string, unknown>>
            columns={columns}
            data={types as unknown as Record<string, unknown>[]}
            page={page}
            rowsPerPage={pageSize}
            totalRows={total}
            onPageChange={setPage}
            onRowsPerPageChange={setPageSize}
            onEdit={handleEdit}
            loading={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add / Edit Form Dialog */}
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {editingType ? 'Edit Cart Type' : 'Add Cart Type'}
          <IconButton
            onClick={() => setFormOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Cart Type Name"
            value={typeName}
            onChange={(e) => {
              setTypeName(e.target.value)
              setTypeNameError('')
            }}
            fullWidth
            required
            autoFocus
            error={Boolean(typeNameError)}
            helperText={typeNameError}
            sx={{ mt: 1 }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            Name will be saved in uppercase.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingType ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Alert
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />
    </>
  )
}

export default TrolleyTypeMaster
