import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
  Chip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import type { TrolleyTypeMapping, MappingItem } from '../../types/mapping'

interface ViewMappingModalProps {
  open: boolean
  onClose: () => void
  mapping: TrolleyTypeMapping | null
}

const ViewMappingModal: React.FC<ViewMappingModalProps> = ({
  open,
  onClose,
  mapping,
}) => {
  if (!mapping) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        View Cart Material Mapping
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Cart Type
          </Typography>
          <Typography variant="h6">{mapping.trolley_type}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
            Total Materials Mapped: {mapping.total_materials}
          </Typography>
        </Box>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>Material Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Material Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Material Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Max Quantity</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mapping.mappings && mapping.mappings.length > 0 ? (
                mapping.mappings.map((item: MappingItem) => (
                  <TableRow key={item.mapping_id}>
                    <TableCell>{item.material?.material_code}</TableCell>
                    <TableCell>{item.material?.material_name}</TableCell>
                    <TableCell>
                      {item.material?.materialType?.material_type}
                    </TableCell>
                    <TableCell>{item.max_quantity}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={item.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No materials mapped
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ViewMappingModal
