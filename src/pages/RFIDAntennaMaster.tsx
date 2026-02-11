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
import { antennaService } from '../services'
import type { RFIDAntenna } from '../types'

const RFIDAntennaMaster: React.FC = () => {
  const [antennas, setAntennas] = useState<RFIDAntenna[]>([])

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAntenna, setEditingAntenna] = useState<RFIDAntenna | null>(null)
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    antenna_code: '',
    antenna_name: '',
    antenna_type: '' as 'RFID' | 'BLE' | '',
    reader_id: '',
    reader_port: '' as string | number,
    antenna_role: '' as string,
    frequency_range: '',
    gain_dbi: '' as string | number,
    orientation: '' as string,
    mounting_type: '' as string,
    tx_power_dbm: '' as string | number,
    coverage_desc: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'Maintenance',
    remarks: '',
  })

  const columns: Column[] = [
    { id: 'antenna_code', label: 'Antenna Code' },
    { id: 'antenna_name', label: 'Name' },
    { id: 'antenna_role', label: 'Role' },
    { id: 'reader_id', label: 'Reader IP' },
    { id: 'antenna_type', label: 'Type' },
    { id: 'status', label: 'Status' },
  ]

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadAntennas = useCallback(async () => {
    try {
      setLoading(true)
      const response = await antennaService.getAll()
      setAntennas(response.data)
      setTotal(response.count)
    } catch {
      showAlert('Failed to load antennas', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => {
    loadAntennas()
  }, [loadAntennas])

  const handleAdd = () => {
    setEditingAntenna(null)
    setFormData({
      antenna_code: '',
      antenna_name: '',
      antenna_type: '',
      reader_id: '',
      reader_port: '',
      antenna_role: '',
      frequency_range: '',
      gain_dbi: '',
      orientation: '',
      mounting_type: '',
      tx_power_dbm: '',
      coverage_desc: '',
      status: 'ACTIVE',
      remarks: '',
    })
    setModalOpen(true)
  }

  const handleEdit = (antenna: RFIDAntenna) => {
    setEditingAntenna(antenna)
    setFormData({
      antenna_code: antenna.antenna_code,
      antenna_name: antenna.antenna_name || '',
      antenna_type: antenna.antenna_type || '',
      reader_id: antenna.reader_id || '',
      reader_port: antenna.reader_port ?? '',
      antenna_role: antenna.antenna_role || '',
      frequency_range: antenna.frequency_range || '',
      gain_dbi: antenna.gain_dbi ?? '',
      orientation: antenna.orientation || '',
      mounting_type: antenna.mounting_type || '',
      tx_power_dbm: antenna.tx_power_dbm ?? '',
      coverage_desc: antenna.coverage_desc || '',
      status: antenna.status,
      remarks: antenna.remarks || '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (antenna: RFIDAntenna) => {
    if (
      window.confirm('Delete antenna? This will Permanently delete record.')
    ) {
      try {
        await antennaService.delete(antenna.antenna_id)
        showAlert('Antenna deleted', 'success')
        loadAntennas()
      } catch (error) {
        showAlert(
          error instanceof Error ? error.message : 'Failed to delete',
          'error'
        )
      }
    }
  }

  const handleSubmit = async () => {
    try {
      if (!formData.antenna_code) {
        showAlert('Antenna code is required', 'error')
        return
      }

      if (!formData.antenna_type) {
        showAlert('Antenna type is required', 'error')
        return
      }

      const payload = {
        antenna_code: formData.antenna_code,
        antenna_name: formData.antenna_name,
        antenna_type: formData.antenna_type,
        frequency_range: formData.frequency_range,
        gain_dbi: formData.gain_dbi ? Number(formData.gain_dbi) : undefined,
        reader_id: formData.reader_id,
        reader_port: formData.reader_port
          ? Number(formData.reader_port)
          : undefined,
        antenna_role: formData.antenna_role,
        orientation: formData.orientation,
        mounting_type: formData.mounting_type,
        tx_power_dbm: formData.tx_power_dbm
          ? Number(formData.tx_power_dbm)
          : undefined,
        coverage_desc: formData.coverage_desc,
        status: formData.status,
        remarks: formData.remarks,
      }

      if (editingAntenna) {
        await antennaService.update(editingAntenna.antenna_id, payload)
        showAlert('Antenna updated', 'success')
      } else {
        await antennaService.create(payload)
        showAlert('Antenna created', 'success')
      }
      setModalOpen(false)
      loadAntennas()
    } catch (error) {
      showAlert(
        error instanceof Error ? error.message : 'Operation failed',
        'error'
      )
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">RFID Antenna Master</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Antenna
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search antennas..."
        />
      </Box>

      <DataTable
        columns={columns}
        data={antennas as Array<Record<string, unknown>>}
        page={page}
        rowsPerPage={pageSize}
        totalRows={total}
        onPageChange={setPage}
        onRowsPerPageChange={setPageSize}
        onEdit={(row) => handleEdit(row as RFIDAntenna)}
        onDelete={(row) => handleDelete(row as RFIDAntenna)}
        loading={loading}
      />

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingAntenna ? 'Edit Antenna' : 'Add Antenna'}
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
              label="Antenna Code *"
              value={formData.antenna_code}
              onChange={(e) =>
                setFormData({ ...formData, antenna_code: e.target.value })
              }
              disabled={!!editingAntenna}
              fullWidth
              required
            />
            <TextField
              label="Antenna Name"
              value={formData.antenna_name}
              onChange={(e) =>
                setFormData({ ...formData, antenna_name: e.target.value })
              }
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel>Antenna Type</InputLabel>
              <Select
                label="Antenna Type"
                value={formData.antenna_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    antenna_type: e.target.value as 'RFID' | 'BLE',
                  })
                }
              >
                <MenuItem value="RFID">RFID</MenuItem>
                <MenuItem value="BLE">BLE</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Frequency Range"
              value={formData.frequency_range}
              onChange={(e) =>
                setFormData({ ...formData, frequency_range: e.target.value })
              }
              fullWidth
              placeholder="e.g., 915 MHz"
            />
            <TextField
              label="Gain (dBi)"
              type="number"
              value={formData.gain_dbi}
              onChange={(e) =>
                setFormData({ ...formData, gain_dbi: e.target.value })
              }
              fullWidth
              placeholder="Enter gain value"
            />
            <TextField
              label="Reader IP"
              value={formData.reader_id}
              onChange={(e) =>
                setFormData({ ...formData, reader_id: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Reader Port"
              type="number"
              value={formData.reader_port}
              onChange={(e) =>
                setFormData({ ...formData, reader_port: e.target.value })
              }
              fullWidth
              placeholder="Enter port number"
            />
            <TextField
              label="Antenna Role"
              value={formData.antenna_role}
              onChange={(e) =>
                setFormData({ ...formData, antenna_role: e.target.value })
              }
              fullWidth
              placeholder="e.g., Entry, Exit, Internal"
            />
            <TextField
              label="Orientation"
              value={formData.orientation}
              onChange={(e) =>
                setFormData({ ...formData, orientation: e.target.value })
              }
              fullWidth
              placeholder="e.g., Horizontal, Vertical"
            />
            <TextField
              label="Mounting Type"
              value={formData.mounting_type}
              onChange={(e) =>
                setFormData({ ...formData, mounting_type: e.target.value })
              }
              fullWidth
              placeholder="e.g., Gate, Wall, Ceiling"
            />
            <TextField
              label="TX Power (dBm)"
              type="number"
              value={formData.tx_power_dbm}
              onChange={(e) =>
                setFormData({ ...formData, tx_power_dbm: e.target.value })
              }
              fullWidth
              placeholder="Enter power value"
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as
                      | 'ACTIVE'
                      | 'INACTIVE'
                      | 'Maintenance',
                  })
                }
              >
                <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Coverage Description"
              value={formData.coverage_desc}
              onChange={(e) =>
                setFormData({ ...formData, coverage_desc: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Remarks"
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingAntenna ? 'Update' : 'Create'}
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
export default RFIDAntennaMaster
