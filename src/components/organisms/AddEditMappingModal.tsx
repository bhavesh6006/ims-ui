import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
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
  Divider,
  Chip,
  Alert,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import GroupWorkIcon from '@mui/icons-material/GroupWork'
import { v4 as uuidv4 } from 'uuid'
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

interface GroupRow {
  group_id: string
  material_ids: string[]
  group_total_quantity: number | string
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
  const [groupRows, setGroupRows] = useState<GroupRow[]>([])
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [effectiveTo, setEffectiveTo] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [removedMaterialIds, setRemovedMaterialIds] = useState<string[]>([])
  const [removedGroupIds, setRemovedGroupIds] = useState<string[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)

  const usedMaterialIds = useMemo(() => {
    const ids = new Set<string>()
    materialRows.forEach((r) => {
      if (r.material_id) ids.add(r.material_id)
    })
    groupRows.forEach((g) => {
      g.material_ids.forEach((mid) => {
        if (mid) ids.add(mid)
      })
    })
    return ids
  }, [materialRows, groupRows])

  useEffect(() => {
    if (open) {
      loadDropdownData()
      setValidationError(null)
      if (isEditMode && editData) {
        setSelectedTrolleyTypeId(editData.trolley_type_id)
        populateFromEditData(editData)
      } else {
        resetForm()
      }
    }
  }, [open, isEditMode, editData])

  const populateFromEditData = (data: TrolleyTypeMapping) => {
    const individualMappings = data.mappings.filter((m) => !m.is_group_mapping)
    const groupMappings = data.mappings.filter((m) => m.is_group_mapping)

    setMaterialRows(
      individualMappings.map((m: MappingItem) => ({
        id: m.mapping_id,
        material_id: m.material?.material_id || '',
        max_quantity: m.max_quantity,
        isNew: false,
      }))
    )

    const groupMap: Record<string, MappingItem[]> = {}
    groupMappings.forEach((m) => {
      if (m.mapping_group_id) {
        if (!groupMap[m.mapping_group_id]) {
          groupMap[m.mapping_group_id] = []
        }
        groupMap[m.mapping_group_id].push(m)
      }
    })

    setGroupRows(
      Object.entries(groupMap).map(([groupId, members]) => ({
        group_id: groupId,
        material_ids: members.map((m) => m.material?.material_id || ''),
        group_total_quantity: members[0]?.group_total_quantity || 0,
        isNew: false,
      }))
    )

    setRemovedMaterialIds([])
    setRemovedGroupIds([])
  }

  const loadDropdownData = async () => {
    try {
      const [trolleyTypesRes, materialsRes] = await Promise.all([
        trolleyTypeService.getAll(),
        materialService.getAll(1, 10000),
      ])
      setTrolleyTypes(trolleyTypesRes?.data || [])
      setMaterials(materialsRes?.data || [])
    } catch (error) {
      console.error('Failed to load dropdown data', error)
      setTrolleyTypes([])
      setMaterials([])
    }
  }

  const resetForm = () => {
    setSelectedTrolleyTypeId('')
    setMaterialRows([])
    setGroupRows([])
    setEffectiveFrom(new Date().toISOString().split('T')[0])
    setEffectiveTo('')
    setNotes('')
    setRemovedMaterialIds([])
    setRemovedGroupIds([])
    setValidationError(null)
  }

  const handleAddRow = () => {
    setMaterialRows([
      ...materialRows,
      { id: uuidv4(), material_id: '', max_quantity: '', isNew: true },
    ])
  }

  const handleRemoveRow = (rowId: string) => {
    const row = materialRows.find((r) => r.id === rowId)
    if (row && !row.isNew && row.material_id) {
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

  const handleAddGroup = () => {
    setGroupRows([
      ...groupRows,
      {
        group_id: uuidv4(),
        material_ids: ['', ''],
        group_total_quantity: '',
        isNew: true,
      },
    ])
  }

  const handleRemoveGroup = (groupId: string) => {
    const group = groupRows.find((g) => g.group_id === groupId)
    if (group && !group.isNew) {
      setRemovedGroupIds([...removedGroupIds, group.group_id])
    }
    setGroupRows(groupRows.filter((g) => g.group_id !== groupId))
  }

  const handleGroupMaterialChange = (
    groupId: string,
    index: number,
    materialId: string
  ) => {
    setGroupRows(
      groupRows.map((g) => {
        if (g.group_id !== groupId) return g
        const newIds = [...g.material_ids]
        newIds[index] = materialId
        return { ...g, material_ids: newIds }
      })
    )
  }

  const handleGroupQuantityChange = (groupId: string, value: string) => {
    setGroupRows(
      groupRows.map((g) =>
        g.group_id === groupId ? { ...g, group_total_quantity: value } : g
      )
    )
  }

  const handleAddMaterialToGroup = (groupId: string) => {
    setGroupRows(
      groupRows.map((g) =>
        g.group_id === groupId
          ? { ...g, material_ids: [...g.material_ids, ''] }
          : g
      )
    )
  }

  const handleRemoveMaterialFromGroup = (groupId: string, index: number) => {
    setGroupRows(
      groupRows.map((g) => {
        if (g.group_id !== groupId) return g
        if (g.material_ids.length <= 2) return g
        const newIds = g.material_ids.filter((_, i) => i !== index)
        return { ...g, material_ids: newIds }
      })
    )
  }

  const getAvailableMaterials = (currentMaterialId?: string) => {
    return materials.filter(
      (m) =>
        !usedMaterialIds.has(m.material_id) ||
        m.material_id === currentMaterialId
    )
  }

  const validate = (): boolean => {
    setValidationError(null)

    if (!selectedTrolleyTypeId) {
      setValidationError('Please select a cart type')
      return false
    }

    if (materialRows.length === 0 && groupRows.length === 0) {
      setValidationError('Please add at least one individual material or group')
      return false
    }

    for (const row of materialRows) {
      if (!row.material_id) {
        setValidationError('Please select material for all individual rows')
        return false
      }
      if (!row.max_quantity || Number(row.max_quantity) <= 0) {
        setValidationError(
          'Max quantity must be greater than 0 for all individual materials'
        )
        return false
      }
    }

    for (let i = 0; i < groupRows.length; i++) {
      const group = groupRows[i]
      const filledMaterials = group.material_ids.filter((id) => id)
      if (filledMaterials.length < 2) {
        setValidationError(`Group ${i + 1}: At least 2 materials are required`)
        return false
      }
      if (
        !group.group_total_quantity ||
        Number(group.group_total_quantity) <= 0
      ) {
        setValidationError(
          `Group ${i + 1}: Total quantity must be greater than 0`
        )
        return false
      }
      const uniqueInGroup = new Set(filledMaterials)
      if (uniqueInGroup.size !== filledMaterials.length) {
        setValidationError(
          `Group ${i + 1}: Duplicate materials found within the group`
        )
        return false
      }
    }

    const allIds: string[] = []
    materialRows.forEach((r) => {
      if (r.material_id) allIds.push(r.material_id)
    })
    groupRows.forEach((g) => {
      g.material_ids.forEach((id) => {
        if (id) allIds.push(id)
      })
    })
    const uniqueAll = new Set(allIds)
    if (uniqueAll.size !== allIds.length) {
      setValidationError(
        'A material cannot be used in multiple mappings (individual or group)'
      )
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    try {
      if (isEditMode) {
        const existingMaterials = materialRows.filter((r) => !r.isNew)
        const newMaterials = materialRows.filter((r) => r.isNew)
        const existingGroups = groupRows.filter((g) => !g.isNew)
        const newGroups = groupRows.filter((g) => g.isNew)

        const payload = {
          materials_to_add: newMaterials.map((m) => ({
            material_id: m.material_id,
            max_quantity: Number(m.max_quantity),
          })),
          materials_to_remove: removedMaterialIds,
          materials_to_update: existingMaterials.map((m) => ({
            material_id: m.material_id,
            max_quantity: Number(m.max_quantity),
          })),
          groups_to_add: newGroups.map((g) => ({
            material_ids: g.material_ids.filter((id) => id),
            group_total_quantity: Number(g.group_total_quantity),
          })),
          groups_to_remove: removedGroupIds,
          groups_to_update: existingGroups.map((g) => ({
            mapping_group_id: g.group_id,
            group_total_quantity: Number(g.group_total_quantity),
            material_ids: g.material_ids.filter((id) => id),
          })),
          updated_by: 'current-user-uuid',
        }

        await mappingService.update(selectedTrolleyTypeId, payload)
      } else {
        const payload = {
          trolley_type_id: selectedTrolleyTypeId,
          materials: materialRows.map((m) => ({
            material_id: m.material_id,
            max_quantity: Number(m.max_quantity),
          })),
          groups: groupRows.map((g) => ({
            material_ids: g.material_ids.filter((id) => id),
            group_total_quantity: Number(g.group_total_quantity),
          })),
          effective_from: effectiveFrom,
          effective_to: effectiveTo || undefined,
          notes: notes || undefined,
          created_by: 'current-user-uuid',
        }

        await mappingService.create(payload)
      }

      onSuccess()
    } catch (error) {
      console.error('Failed to save mapping', error)
      setValidationError('Failed to save mapping. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {isEditMode
          ? 'Edit Cart Material Mapping'
          : 'Add Cart Material Mapping'}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {validationError && (
            <Alert severity="error" onClose={() => setValidationError(null)}>
              {validationError}
            </Alert>
          )}

          {/* Cart Type Selection */}
          <Autocomplete
            fullWidth
            options={[
              { trolly_type_id: '', trolly_type: 'Select Cart Type' },
              ...trolleyTypes,
            ]}
            getOptionLabel={(option) => option.trolly_type}
            value={
              [
                { trolly_type_id: '', trolly_type: 'Select Cart Type' },
                ...trolleyTypes,
              ].find((type) => type.trolly_type_id === selectedTrolleyTypeId) ||
              null
            }
            onChange={(_, newValue) =>
              setSelectedTrolleyTypeId(newValue?.trolly_type_id || '')
            }
            disabled={isEditMode}
            isOptionEqualToValue={(option, value) =>
              option.trolly_type_id === value.trolly_type_id
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cart Type"
                required
                error={Boolean(selectedTrolleyTypeId === '' && validationError)}
              />
            )}
          />

          {/* ========== Individual Materials Section ========== */}
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Individual Materials ({materialRows.length})
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

            {materialRows.length > 0 && (
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
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
                        <TableCell>
                          <Autocomplete
                            fullWidth
                            size="small"
                            options={getAvailableMaterials(row.material_id)}
                            getOptionLabel={(option) =>
                              option.material_id
                                ? `${option.material_code} - ${option.material_name}`
                                : ''
                            }
                            value={
                              materials.find(
                                (m) => m.material_id === row.material_id
                              ) || null
                            }
                            onChange={(_, newValue) =>
                              handleRowChange(
                                row.id,
                                'material_id',
                                newValue?.material_id || ''
                              )
                            }
                            isOptionEqualToValue={(option, value) =>
                              option.material_id === value.material_id
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Select Material"
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
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
                        <TableCell sx={{ textAlign: 'center' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveRow(row.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {materialRows.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                No individual materials added. You can add individual materials
                or groups below.
              </Typography>
            )}
          </Box>

          <Divider />

          {/* ========== Group Materials Section ========== */}
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupWorkIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Material Groups ({groupRows.length})
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<GroupWorkIcon />}
                onClick={handleAddGroup}
                color="primary"
              >
                Add Group
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Group 2 or more materials together. The total quantity will be
              divided equally among group members. During loading, the cart will
              be marked as partially loaded until all group materials are
              loaded.
            </Typography>

            {groupRows.map((group, gIndex) => {
              const perMaterial =
                group.group_total_quantity &&
                group.material_ids.filter((id) => id).length >= 2
                  ? Math.floor(
                      Number(group.group_total_quantity) /
                        group.material_ids.filter((id) => id).length
                    )
                  : 0
              return (
                <Paper
                  key={group.group_id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 2,
                    borderColor: 'primary.light',
                    borderWidth: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Chip
                        label={`Group ${gIndex + 1}`}
                        color="primary"
                        size="small"
                      />
                      {perMaterial > 0 && (
                        <Chip
                          label={`${perMaterial} per material`}
                          variant="outlined"
                          size="small"
                          color="info"
                        />
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveGroup(group.group_id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <TextField
                      type="number"
                      size="small"
                      label="Group Total Quantity"
                      value={group.group_total_quantity}
                      onChange={(e) =>
                        handleGroupQuantityChange(
                          group.group_id,
                          e.target.value
                        )
                      }
                      inputProps={{ min: 1 }}
                      sx={{ width: 250 }}
                      helperText={
                        perMaterial > 0
                          ? `Each material gets ${perMaterial} units (${Number(group.group_total_quantity)} ÷ ${group.material_ids.filter((id) => id).length})`
                          : 'Enter total quantity for the group'
                      }
                    />
                  </Box>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>
                            Material
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 120 }}>
                            Share
                          </TableCell>
                          <TableCell sx={{ width: 60, textAlign: 'center' }}>
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {group.material_ids.map((matId, mIndex) => (
                          <TableRow key={`${group.group_id}-${mIndex}`}>
                            <TableCell>
                              <Autocomplete
                                fullWidth
                                size="small"
                                options={getAvailableMaterials(matId)}
                                getOptionLabel={(option) =>
                                  option.material_id
                                    ? `${option.material_code} - ${option.material_name}`
                                    : ''
                                }
                                value={
                                  materials.find(
                                    (m) => m.material_id === matId
                                  ) || null
                                }
                                onChange={(_, newValue) =>
                                  handleGroupMaterialChange(
                                    group.group_id,
                                    mIndex,
                                    newValue?.material_id || ''
                                  )
                                }
                                isOptionEqualToValue={(option, value) =>
                                  option.material_id === value.material_id
                                }
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder="Select Material"
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {perMaterial > 0 ? perMaterial : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleRemoveMaterialFromGroup(
                                    group.group_id,
                                    mIndex
                                  )
                                }
                                color="error"
                                disabled={group.material_ids.length <= 2}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddMaterialToGroup(group.group_id)}
                    sx={{ mt: 1 }}
                  >
                    Add Material to Group
                  </Button>
                </Paper>
              )
            })}

            {groupRows.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                No groups added. Click &quot;Add Group&quot; to create a
                material group.
              </Typography>
            )}
          </Box>

          {!isEditMode && (
            <>
              <Divider />
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
              <TextField
                label="Notes"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
              />
            </>
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
