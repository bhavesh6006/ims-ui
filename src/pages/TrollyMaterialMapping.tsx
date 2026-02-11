import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { SearchBar, Alert } from '../components/molecules'
import { mappingService } from '../services'
import AddEditMappingModal from '../components/organisms/AddEditMappingModal'
import ViewMappingModal from '../components/organisms/ViewMappingModal'
import { EditButton, ViewButton } from '../components/atoms'
import type { TrolleyTypeMapping, MappingItem } from '../types/mapping'

const TrollyMaterialMapping: React.FC = () => {
  const [mappings, setMappings] = useState<TrolleyTypeMapping[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [addEditModalOpen, setAddEditModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedMapping, setSelectedMapping] =
    useState<TrolleyTypeMapping | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })
  const [loading, setLoading] = useState(false)

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadMappings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await mappingService.getAll(page + 1, pageSize, search)

      // Group mappings by trolley type
      const mappingsArray = response.data as unknown as MappingItem[]

      const groupedMappings = mappingsArray.reduce(
        (acc: Record<string, TrolleyTypeMapping>, mapping: MappingItem) => {
          const trolleyTypeId = mapping.trolleyType?.trolly_type_id || ''
          const trolleyType = mapping.trolleyType?.trolly_type || ''

          if (!acc[trolleyTypeId]) {
            acc[trolleyTypeId] = {
              trolley_type_id: trolleyTypeId,
              trolley_type: trolleyType,
              total_materials: 0,
              mappings: [],
            }
          }

          acc[trolleyTypeId].mappings.push(mapping)
          acc[trolleyTypeId].total_materials =
            acc[trolleyTypeId].mappings.length

          return acc
        },
        {} as Record<string, TrolleyTypeMapping>
      )

      setMappings(Object.values(groupedMappings))
      setTotal(Object.keys(groupedMappings).length)
    } catch {
      showAlert('Failed to load mappings', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => {
    loadMappings()
  }, [loadMappings])

  const handleAdd = () => {
    setSelectedMapping(null)
    setIsEditMode(false)
    setAddEditModalOpen(true)
  }

  const handleEdit = (mapping: TrolleyTypeMapping) => {
    setSelectedMapping(mapping)
    setIsEditMode(true)
    setAddEditModalOpen(true)
  }

  const handleView = (mapping: TrolleyTypeMapping) => {
    setSelectedMapping(mapping)
    setViewModalOpen(true)
  }

  const handleSuccess = () => {
    loadMappings()
    setAddEditModalOpen(false)
    showAlert(
      isEditMode
        ? 'Mapping updated successfully'
        : 'Mapping created successfully',
      'success'
    )
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPageSize(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Trolley-Material Mapping</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Mapping
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by trolley type..."
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 600 }}>Trolley Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                Number of Materials Mapped
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                <Box
                  sx={{ display: 'flex', justifyContent: 'flex-end', pr: 0 }}
                >
                  <span style={{ marginRight: '72px' }}>Action</span>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={13} align="center">
                  <Typography variant="body2" color="text.secondary" py={3}>
                    Loading...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : mappings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ py: 3 }}
                  >
                    No mappings found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              mappings.map((mapping) => (
                <TableRow key={mapping.trolley_type_id} hover>
                  <TableCell>{mapping.trolley_type}</TableCell>
                  <TableCell>{mapping.total_materials}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <ViewButton onClick={() => handleView(mapping)} />
                      <EditButton onClick={() => handleEdit(mapping)} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      <AddEditMappingModal
        open={addEditModalOpen}
        onClose={() => setAddEditModalOpen(false)}
        onSuccess={handleSuccess}
        editData={selectedMapping}
        isEditMode={isEditMode}
      />

      <ViewMappingModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        mapping={selectedMapping}
      />

      <Alert
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />
    </Box>
  )
}

export default TrollyMaterialMapping
