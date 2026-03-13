import React from 'react'
import {
  Box,
  Typography,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert as MuiAlert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CancelIcon from '@mui/icons-material/Cancel'
import EditIcon from '@mui/icons-material/Edit'
import type { WorkOrderResponse } from '../../services/workOrderService'
import type { MaterialStockEntry } from './types'

interface LoadingDialogProps {
  open: boolean
  activeTab: number
  selectedOperatorWO: WorkOrderResponse | null
  trolleyQRCode: string
  scanning: boolean
  loadingEntries: boolean
  materialStockEntries: MaterialStockEntry[]
  dialogMessage: {
    text: string
    severity: 'success' | 'error' | 'info' | 'warning'
  } | null
  trolleyInputRef: React.RefObject<HTMLInputElement | null>
  convertToLocalTime: (utcTimestamp: string) => string
  onTrolleyInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onTrolleyKeyDown: (e: React.KeyboardEvent) => void
  onEditRecord: (record: MaterialStockEntry) => void
  onClose: () => void
  onClearDialogMessage: () => void
}

const LoadingDialog: React.FC<LoadingDialogProps> = ({
  open,
  activeTab,
  selectedOperatorWO,
  trolleyQRCode,
  scanning,
  loadingEntries,
  materialStockEntries,
  dialogMessage,
  trolleyInputRef,
  convertToLocalTime,
  onTrolleyInputChange,
  onTrolleyKeyDown,
  onEditRecord,
  onClose,
  onClearDialogMessage,
}) => {
  if (!selectedOperatorWO) return null

  // Check if output plan has reached or exceeded input plan
  const isLoadingComplete =
    selectedOperatorWO.output_plan >= selectedOperatorWO.input_plan

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">
            {activeTab === 0
              ? 'Load Material onto Cart'
              : 'Loaded Material onto Cart'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'primary.lighter' }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            Work Order: {selectedOperatorWO.work_order_number}
          </Typography>
          <Typography variant="body2">
            Tool: {selectedOperatorWO.tool} | Material Code:{' '}
            <strong>{selectedOperatorWO.sub_tool}</strong> | Door Colour:{' '}
            {selectedOperatorWO.door_colour} | Handle:{' '}
            {selectedOperatorWO.handle} | Micon: {selectedOperatorWO.micom} |
            Lock Type: {selectedOperatorWO.lock1} | Disp Type:{' '}
            {selectedOperatorWO.disp_type} | Date: {selectedOperatorWO.date}
          </Typography>
          <Typography variant="body2">
            Planned: {selectedOperatorWO.input_plan} | Current Output:{' '}
            {selectedOperatorWO.output_plan} | Produced Quantity in Stock:{' '}
            {selectedOperatorWO.output_plan -
              selectedOperatorWO.consumed_quantity}
          </Typography>
        </Paper>

        {activeTab === 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Scan or Enter Cart Code
            </Typography>

            {isLoadingComplete ? (
              <MuiAlert severity="warning" sx={{ mb: 3 }}>
                Loading is complete. Output plan (
                {selectedOperatorWO.output_plan}) has reached or exceeded the
                input plan ({selectedOperatorWO.input_plan}). No more carts can
                be loaded.
              </MuiAlert>
            ) : (
              <TextField
                inputRef={trolleyInputRef}
                name="trolleyQRCode"
                label="Cart Code"
                value={trolleyQRCode}
                onChange={onTrolleyInputChange}
                onKeyDown={onTrolleyKeyDown}
                fullWidth
                autoFocus
                placeholder="Scan or type cart code"
                disabled={scanning}
                helperText={
                  scanning
                    ? 'Processing...'
                    : 'Place cursor here and scan with your barcode/QR scanner device, or type the code manually'
                }
                sx={{ mb: 3 }}
              />
            )}
          </>
        )}

        {dialogMessage && (
          <MuiAlert
            severity={dialogMessage.severity}
            sx={{ mb: 3 }}
            onClose={onClearDialogMessage}
          >
            {dialogMessage.text}
          </MuiAlert>
        )}

        <Typography variant="h6" sx={{ mb: 2 }}>
          Already Loaded Records
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                {[
                  'Cart Code',
                  'Sub Tool',
                  'Quantity',
                  'Loading Type',
                  'Status',
                  'Location',
                  'Loaded At',
                  'Remarks',
                  'Action',
                ].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontSize: '16px',
                      width: [
                        'Quantity',
                        'Loading Type',
                        'Status',
                        'Location',
                        'Action',
                      ].includes(h)
                        ? '10%'
                        : '15%',
                    }}
                  >
                    <strong>{h}</strong>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingEntries ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography>Loading...</Typography>
                  </TableCell>
                </TableRow>
              ) : materialStockEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography>No records found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                materialStockEntries.map((entry, index) => (
                  <TableRow key={entry.id || index}>
                    <TableCell>{entry.trolley_qr_code}</TableCell>
                    <TableCell>{entry.material_code}</TableCell>
                    <TableCell>{entry.quantity}</TableCell>
                    <TableCell>{entry.loading_type}</TableCell>
                    <TableCell>{entry.status}</TableCell>
                    <TableCell>{entry.location_name || '-'}</TableCell>
                    <TableCell>
                      {entry.loaded_at
                        ? convertToLocalTime(entry.loaded_at)
                        : '-'}
                    </TableCell>
                    <TableCell>{entry.remarks || '-'}</TableCell>
                    <TableCell>
                      {/* Show edit button for all tabs, disabled if not IN_STOCK */}
                      <IconButton
                        size="small"
                        onClick={() => onEditRecord(entry)}
                        disabled={entry.status !== 'IN_STOCK'}
                        sx={{
                          border: '1px solid',
                          borderColor:
                            entry.status === 'IN_STOCK'
                              ? 'primary.main'
                              : 'grey.400',
                          color:
                            entry.status === 'IN_STOCK'
                              ? 'primary.main'
                              : 'grey.400',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          '&:hover': {
                            backgroundColor:
                              entry.status === 'IN_STOCK'
                                ? 'primary.lighter'
                                : 'transparent',
                            borderColor:
                              entry.status === 'IN_STOCK'
                                ? 'primary.dark'
                                : 'grey.400',
                          },
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          color="error"
          startIcon={<CancelIcon />}
          onClick={onClose}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default LoadingDialog
