import React from 'react'
import type { MaterialStockEntry } from './types'
import {
  Typography,
  Button,
  TextField,
  FormControl,
  Radio,
  RadioGroup,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import CancelIcon from '@mui/icons-material/Cancel'

interface EditRecordDialogProps {
  open: boolean
  editingRecord: MaterialStockEntry | null
  mappedQuantity: number
  onLoadingTypeChange: (loadingType: 'FULL' | 'PARTIAL') => void
  onPartialQuantityChange: (value: string) => void
  onSave: (record: MaterialStockEntry) => void
  onClose: () => void
}

const EditRecordDialog: React.FC<EditRecordDialogProps> = ({
  open,
  editingRecord,
  mappedQuantity,
  onLoadingTypeChange,
  onPartialQuantityChange,
  onSave,
  onClose,
}) => {
  if (!editingRecord) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Record</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Cart Code: <strong>{editingRecord.trolley_code}</strong>
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Material Code: <strong>{editingRecord.material_code}</strong>
        </Typography>
        {mappedQuantity > 0 && (
          <Typography variant="body2" sx={{ mb: 2 }} color="info.main">
            Max Quantity (Full Load): <strong>{mappedQuantity}</strong>
          </Typography>
        )}
        <FormControl component="fieldset" sx={{ mt: 2 }}>
          <RadioGroup
            value={editingRecord.loading_type}
            onChange={(e) =>
              onLoadingTypeChange(e.target.value as 'FULL' | 'PARTIAL')
            }
          >
            <FormControlLabel
              value="FULL"
              control={<Radio />}
              label="Full Loading"
            />
            <FormControlLabel
              value="PARTIAL"
              control={<Radio />}
              label="Partial Loading"
            />
          </RadioGroup>
        </FormControl>
        {editingRecord.loading_type === 'PARTIAL' && (
          <TextField
            label="Partial Quantity"
            type="number"
            value={editingRecord.quantity ?? ''}
            onChange={(e) => onPartialQuantityChange(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            helperText={`Must be less than ${mappedQuantity}`}
          />
        )}
        {editingRecord.loading_type === 'FULL' && mappedQuantity > 0 && (
          <Typography variant="body2" sx={{ mt: 2 }} color="success.main">
            Quantity will be set to: <strong>{mappedQuantity}</strong>
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="outlined"
          color="error"
          startIcon={<CancelIcon />}
        >
          Cancel
        </Button>
        <Button
          onClick={() => onSave(editingRecord)}
          variant="contained"
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditRecordDialog
