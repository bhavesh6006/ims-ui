import React, { useEffect } from 'react'
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Box,
  Typography,
} from '@mui/material'
import { EditButton, DeleteButton, ViewButton } from '../atoms'

export interface Column {
  id: string
  label: string
  minWidth?: number
  align?: 'left' | 'right' | 'center'
  format?: (value: unknown, row?: Record<string, unknown>) => string
}

interface DataTableProps<T = Record<string, unknown>> {
  columns: Column[]
  data: T[]
  page: number
  rowsPerPage: number
  totalRows: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onView?: (row: T) => void
  showActions?: boolean
  loading?: boolean
}

const DataTable = <
  T extends Record<string, unknown> = Record<string, unknown>,
>({
  columns,
  data = [],
  page,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  loading = false,
}: DataTableProps<T>) => {
  const safeData = Array.isArray(data) ? data : []
  const totalColumns = columns.length + (showActions ? 1 : 0)

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(totalRows / rowsPerPage) - 1)
    if (page > maxPage && totalRows > 0) {
      onPageChange(0)
    }
  }, [totalRows, rowsPerPage, page, onPageChange])

  const handleChangePage = (_event: unknown, newPage: number) => {
    onPageChange(newPage)
  }

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onRowsPerPageChange(parseInt(event.target.value, 10))
    onPageChange(0)
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer>
        <MuiTable stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
              {showActions && <TableCell align="center">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={totalColumns} align="center">
                  <Typography variant="body2" color="text.secondary" py={3}>
                    Loading...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : safeData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalColumns} align="center">
                  <Typography variant="body2" color="text.secondary" py={3}>
                    No data available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              safeData.map((row, index) => (
                <TableRow hover key={index}>
                  {columns.map((column) => {
                    const value = row[column.id]
                    return (
                      <TableCell key={column.id} align={column.align}>
                        {
                          (column.format
                            ? column.format(value, row)
                            : value) as React.ReactNode
                        }
                      </TableCell>
                    )
                  })}
                  {showActions && (
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: 1,
                        }}
                      >
                        {onView && <ViewButton onClick={() => onView(row)} />}
                        {onEdit && <EditButton onClick={() => onEdit(row)} />}
                        {onDelete && (
                          <DeleteButton onClick={() => onDelete(row)} />
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </MuiTable>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalRows}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  )
}

export default DataTable
