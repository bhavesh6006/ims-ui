import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  trolleyTypeService,
  materialService,
  mappingService,
} from '../../services'
import type {
  TrolleyTypeMapping,
  TrolleyType,
  Material,
  MappingItem,
} from '../../types/mapping'

interface AddEditMappingModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editData: TrolleyTypeMapping | null
  isEditMode: boolean
}

interface MaterialRow {
  id: string
  material_id: string
  max_quantity: number | string
  isNew?: boolean
}

const AddEditMappingModal: React.FC<AddEditMappingModalProps> = ({
  open,
  onClose,
  onSuccess,
  editData,
  isEditMode,
}) => {
  const [trolleyTypes, setTrolleyTypes] = useState<TrolleyType[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedTrolleyTypeId, setSelectedTrolleyTypeId] = useState('')
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([])
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [effectiveTo, setEffectiveTo] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [removedMaterialIds, setRemovedMaterialIds] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      loadDropdownData()
      if (isEditMode && editData) {
        setSelectedTrolleyTypeId(editData.trolley_type_id)
        setMaterialRows(
          editData.mappings.map((m: MappingItem) => ({
            id: m.mapping_id,
            material_id: m.material?.material_id || '',
            max_quantity: m.max_quantity,
            isNew: false,
          }))
        )
      } else {
        resetForm()
      }
    }
  }, [open, isEditMode, editData])

  const loadDropdownData = async () => {
    try {
      const [trolleyTypesRes, materialsRes] = await Promise.all([
        trolleyTypeService.getAll(),
        materialService.getAll(1, 100),
      ])

      setTrolleyTypes(trolleyTypesRes || [])
      setMaterials(materialsRes.data || [])
    } catch (error) {
      console.error('Failed to load dropdown data', error)
      setTrolleyTypes([])
      setMaterials([])
    }
  }

  const resetForm = () => {
    setSelectedTrolleyTypeId('')
    setMaterialRows([
      {
        id: crypto.randomUUID(),
        material_id: '',
        max_quantity: '',
        isNew: true,
      },
    ])
    setEffectiveFrom(new Date().toISOString().split('T')[0])
    setEffectiveTo('')
    setNotes('')
    setRemovedMaterialIds([])
  }

  const handleAddRow = () => {
    setMaterialRows([
      ...materialRows,
      {
        id: crypto.randomUUID(),
        material_id: '',
        max_quantity: '',
        isNew: true,
      },
    ])
  }

  const handleRemoveRow = (rowId: string) => {
    const row = materialRows.find((r) => r.id === rowId)
    if (row && !row.isNew) {
      setRemovedMaterialIds([...removedMaterialIds, row.material_id])
    }
    setMaterialRows(materialRows.filter((r) => r.id !== rowId))
  }

  const handleRowChange = (
    rowId: string,
    field: string,
    value: string | number
  ) => {
    setMaterialRows(
      materialRows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    )
  }

  const handleSubmit = async () => {
    // Validation
    if (!selectedTrolleyTypeId) {
      alert('Please select a trolley type')
      return
    }

    if (materialRows.length === 0) {
      alert('Please add at least one material')
      return
    }

    for (const row of materialRows) {
      if (!row.material_id) {
        alert('Please select material for all rows')
        return
      }
      if (!row.max_quantity || row.max_quantity <= 0) {
        alert('Max quantity must be greater than 0')
        return
      }
    }

    setLoading(true)
    try {
      if (isEditMode) {
        // Update existing mapping
        const existingMaterials = materialRows.filter((r) => !r.isNew)
        const newMaterials = materialRows.filter((r) => r.isNew)
        const payload = {
          materials_to_add: newMaterials.map((m) => ({
            material_id: m.material_id,
            max_quantity: m.max_quantity,
          })),
          materials_to_remove: removedMaterialIds,
          materials_to_update: existingMaterials.map((m) => ({
            material_id: m.material_id,
            max_quantity: m.max_quantity,
          })),
          updated_by: 'current-user-uuid', // Replace with actual user ID from auth
        }

        await mappingService.update(selectedTrolleyTypeId, payload)
      } else {
        // Create new mapping
        const payload = {
          trolley_type_id: selectedTrolleyTypeId,
          materials: materialRows.map((m) => ({
            material_id: m.material_id,
            max_quantity: m.max_quantity,
          })),
          effective_from: effectiveFrom,
          effective_to: effectiveTo || undefined,
          notes: notes || undefined,
          created_by: 'current-user-uuid', // Replace with actual user ID from auth
        }

        await mappingService.create(payload)
      }

      onSuccess()
    } catch (error) {
      console.error('Failed to save mapping', error)
      alert('Failed to save mapping')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {isEditMode
          ? 'Edit Trolley Material Mapping'
          : 'Add Trolley Material Mapping'}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Trolley Type Selection */}
          <FormControl fullWidth>
            <InputLabel>Trolley Type</InputLabel>
            <Select
              value={selectedTrolleyTypeId}
              onChange={(e) => setSelectedTrolleyTypeId(e.target.value)}
              disabled={isEditMode}
              label="Trolley Type"
            >
              <MenuItem value="">
                <em>Select Trolley Type</em>
              </MenuItem>
              {trolleyTypes.map((type) => (
                <MenuItem key={type.trolly_type_id} value={type.trolly_type_id}>
                  {type.trolly_type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Materials Table */}
          <Box>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Materials ({materialRows.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddRow}
              >
                Add Material
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: '50%' }}>
                      Material
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '35%' }}>
                      Max Quantity
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        width: '15%',
                        textAlign: 'center',
                      }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {materialRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell sx={{ width: '50%' }}>
                        <FormControl fullWidth size="small">
                          <Select
                            value={row.material_id}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                'material_id',
                                e.target.value
                              )
                            }
                          >
                            <MenuItem value="">
                              <em>Select Material</em>
                            </MenuItem>
                            {materials.map((material: Material) => (
                              <MenuItem
                                key={material.material_id}
                                value={material.material_id}
                              >
                                {material.material_code} -{' '}
                                {material.material_name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell sx={{ width: '35%' }}>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          value={row.max_quantity}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              'max_quantity',
                              e.target.value
                            )
                          }
                          inputProps={{ min: 1 }}
                          placeholder="Enter quantity"
                        />
                      </TableCell>
                      <TableCell sx={{ width: '15%', textAlign: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveRow(row.id)}
                          color="error"
                          disabled={materialRows.length === 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Additional Fields (only for create mode) */}
          {!isEditMode && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Effective From"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Effective To"
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
          )}
          {!isEditMode && (
            <TextField
              label="Notes"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddEditMappingModal
