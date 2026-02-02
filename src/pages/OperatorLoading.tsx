import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  Alert as MuiAlert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import ScannerIcon from '@mui/icons-material/QrCodeScanner'
import { loadingService, trollyService } from '../services'
import { Alert } from '../components/molecules'
import type { Trolly, OperatorWorkOrder } from '../types'

// Test data for work orders
const mockWorkOrders: OperatorWorkOrder[] = [
  {
    id: '1',
    srNo: 1,
    date: '2026-02-01',
    tool: 'Tool A',
    subTool: 'ST-01',
    doorColour: 'White',
    handle: 'Handle-X',
    micom: 'MC-100',
    lock1: 'Lock-A1',
    dispType: 'Type-1',
    inputPlan: 100,
    outputPlan: 95,
  },
  {
    id: '2',
    srNo: 2,
    date: '2026-02-02',
    tool: 'Tool B',
    subTool: 'ST-02',
    doorColour: 'Black',
    handle: 'Handle-Y',
    micom: 'MC-200',
    lock1: 'Lock-B2',
    dispType: 'Type-2',
    inputPlan: 150,
    outputPlan: 145,
  },
  {
    id: '3',
    srNo: 3,
    date: '2026-02-02',
    tool: 'Tool C',
    subTool: 'ST-03',
    doorColour: 'Silver',
    handle: 'Handle-Z',
    micom: 'MC-300',
    lock1: 'Lock-C3',
    dispType: 'Type-1',
    inputPlan: 80,
    outputPlan: 78,
  },
  {
    id: '4',
    srNo: 4,
    date: '2026-02-03',
    tool: 'Tool A',
    subTool: 'ST-04',
    doorColour: 'Grey',
    handle: 'Handle-X',
    micom: 'MC-400',
    lock1: 'Lock-A4',
    dispType: 'Type-3',
    inputPlan: 120,
    outputPlan: 115,
  },
  {
    id: '5',
    srNo: 5,
    date: '2026-02-03',
    tool: 'Tool D',
    subTool: 'ST-05',
    doorColour: 'Brown',
    handle: 'Handle-W',
    micom: 'MC-500',
    lock1: 'Lock-D5',
    dispType: 'Type-2',
    inputPlan: 90,
    outputPlan: 88,
  },
]

const steps = ['Select Work Order', 'Scan Trolley', 'Loading Type', 'Confirm']

const OperatorLoading: React.FC = () => {
  const [ACTIVEStep, setACTIVEStep] = useState(0)
  const [operatorWorkOrders, setOperatorWorkOrders] = useState<
    OperatorWorkOrder[]
  >([])
  const [selectedOperatorWO, setSelectedOperatorWO] =
    useState<OperatorWorkOrder | null>(null)
  const [trolleyCode, setTrolleyCode] = useState('')
  const [scannedTrolley, setScannedTrolley] = useState<Trolly | null>(null)
  const [loadingType, setLoadingType] = useState('full')
  const [partialQuantity, setPartialQuantity] = useState(0)
  const [scanModalOpen, setScanModalOpen] = useState(false)
  const [scanInput, setScanInput] = useState('')
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  // Load operator work orders on component mount
  useEffect(() => {
    // Simulate API call - later replace with actual API
    setTimeout(() => {
      setOperatorWorkOrders(mockWorkOrders)
    }, 500)
  }, [])

  const handleSelectWorkOrder = (workOrder: OperatorWorkOrder) => {
    setSelectedOperatorWO(workOrder)
    showAlert(`Work Order ${workOrder.srNo} selected successfully`, 'success')
    setACTIVEStep(1)
  }

  const handleScanTrolley = async () => {
    if (!trolleyCode.trim()) {
      showAlert('Please enter a trolley barcode or QR code', 'error')
      return
    }

    try {
      const response = await trollyService.scan(trolleyCode)
      setScannedTrolley(response.data || null)
      showAlert('Trolley scanned successfully', 'success')
    } catch {
      showAlert('Trolley not found', 'error')
    }
  }

  const handleOpenScanModal = () => {
    setScanModalOpen(true)
    setScanInput('')
  }

  const handleCloseScanModal = () => {
    setScanModalOpen(false)
    setScanInput('')
  }

  const handleScanFromModal = async () => {
    if (!scanInput.trim()) {
      showAlert('Please enter a trolley code', 'error')
      return
    }

    try {
      const response = await trollyService.scan(scanInput)
      setScannedTrolley(response.data || null)
      setTrolleyCode(scanInput)
      showAlert('Trolley scanned successfully', 'success')
      handleCloseScanModal()
    } catch {
      showAlert('Trolley not found', 'error')
    }
  }

  const handleNext = async () => {
    if (ACTIVEStep === 0 && !selectedOperatorWO) {
      showAlert('Please select a work order', 'error')
      return
    }
    if (ACTIVEStep === 1) {
      // If trolley code is entered but not scanned, scan it first
      if (trolleyCode.trim() && !scannedTrolley) {
        try {
          const response = await trollyService.scan(trolleyCode)
          setScannedTrolley(response.data || null)
          showAlert('Trolley scanned successfully', 'success')
          setACTIVEStep((prev) => prev + 1)
          return
        } catch {
          showAlert('Trolley not found', 'error')
          return
        }
      }
      // If no code entered and no trolley scanned
      if (!scannedTrolley) {
        showAlert('Please scan a trolley', 'error')
        return
      }
    }
    if (ACTIVEStep === 2) {
      if (loadingType === 'partial' && partialQuantity <= 0) {
        showAlert('Please enter a valid quantity', 'error')
        return
      }
      if (
        loadingType === 'partial' &&
        selectedOperatorWO &&
        partialQuantity >= selectedOperatorWO.outputPlan
      ) {
        showAlert('Partial quantity must be less than output plan', 'error')
        return
      }
    }
    setACTIVEStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setACTIVEStep((prev) => prev - 1)
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        trollyId: scannedTrolley!.trolley_id,
        workOrderId: selectedOperatorWO!.id,
        workOrderNumber: `WO-${selectedOperatorWO!.srNo}`,
        doorTypes: [selectedOperatorWO!.tool],
        loadingType: (loadingType === 'full' ? 'Full' : 'Partial') as
          | 'Full'
          | 'Partial',
        loadedQuantity:
          loadingType === 'full'
            ? selectedOperatorWO!.outputPlan
            : partialQuantity,
        maxCapacity: selectedOperatorWO!.outputPlan,
        operatorId: 'current-user-id', // TODO: Get from auth context
        operatorName: 'Current User', // TODO: Get from auth context
        timestamp: new Date().toISOString(),
        status: 'Loaded' as const,
      }

      await loadingService.createLoading(payload)
      showAlert('Loading operation completed successfully', 'success')

      // Reset form
      setTimeout(() => {
        setACTIVEStep(0)
        setSelectedOperatorWO(null)
        setTrolleyCode('')
        setScannedTrolley(null)
        setLoadingType('full')
        setPartialQuantity(0)
      }, 2000)
    } catch {
      showAlert('Failed to complete loading operation', 'error')
    }
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Work Order
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 3, maxHeight: 500 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Sr. No.</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Date</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Tool</strong>
                    </TableCell>
                    <TableCell>
                      <strong>SUB Tool</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Door Colour</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Handle</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Micom</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Lock1</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Disp Type</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Input Plan</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Output Plan</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Action</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {operatorWorkOrders.map((wo) => (
                    <TableRow
                      key={wo.id}
                      selected={selectedOperatorWO?.id === wo.id}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: 'action.selected',
                        },
                      }}
                    >
                      <TableCell>{wo.srNo}</TableCell>
                      <TableCell>{wo.date}</TableCell>
                      <TableCell>{wo.tool}</TableCell>
                      <TableCell>{wo.subTool}</TableCell>
                      <TableCell>{wo.doorColour}</TableCell>
                      <TableCell>{wo.handle}</TableCell>
                      <TableCell>{wo.micom}</TableCell>
                      <TableCell>{wo.lock1}</TableCell>
                      <TableCell>{wo.dispType}</TableCell>
                      <TableCell>{wo.inputPlan}</TableCell>
                      <TableCell>{wo.outputPlan}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleSelectWorkOrder(wo)}
                          disabled={selectedOperatorWO?.id === wo.id}
                        >
                          {selectedOperatorWO?.id === wo.id
                            ? 'Selected'
                            : 'Select'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {selectedOperatorWO && (
              <MuiAlert severity="success" sx={{ mt: 3 }}>
                Work Order {selectedOperatorWO.srNo} selected. Click "Next" to
                proceed with trolley scanning.
              </MuiAlert>
            )}
          </Box>
        )

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Scan Trolley Barcode/QR Code
            </Typography>
            {selectedOperatorWO && (
              <Paper sx={{ p: 2, mb: 3, backgroundColor: 'info.lighter' }}>
                <Typography variant="subtitle2" color="info.main">
                  Selected Work Order: {selectedOperatorWO.tool} -{' '}
                  {selectedOperatorWO.subTool} (Sr. No.{' '}
                  {selectedOperatorWO.srNo})
                </Typography>
              </Paper>
            )}
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <TextField
                label="Trolley Code"
                value={trolleyCode}
                onChange={(e) => setTrolleyCode(e.target.value)}
                fullWidth
                placeholder="Enter or scan barcode/QR code"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleScanTrolley()
                  }
                }}
              />
              <Button
                variant="contained"
                startIcon={<ScannerIcon />}
                onClick={handleOpenScanModal}
                sx={{ minWidth: 120 }}
              >
                Scan
              </Button>
            </Box>
            {scannedTrolley && (
              <MuiAlert severity="success" sx={{ mt: 3 }}>
                Trolley {scannedTrolley.trolley_id} (
                {scannedTrolley.trolley_type}) scanned successfully
              </MuiAlert>
            )}
          </Box>
        )

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Loading Type
            </Typography>
            <FormControl component="fieldset" sx={{ mt: 3 }}>
              <RadioGroup
                value={loadingType}
                onChange={(e) => setLoadingType(e.target.value)}
              >
                <FormControlLabel
                  value="full"
                  control={<Radio />}
                  label="Full Loading"
                />
                <FormControlLabel
                  value="partial"
                  control={<Radio />}
                  label="Partial Loading"
                />
              </RadioGroup>
            </FormControl>
            {loadingType === 'full' && selectedOperatorWO && (
              <MuiAlert severity="info" sx={{ mt: 3 }}>
                Full quantity of {selectedOperatorWO.outputPlan} units will be
                loaded
              </MuiAlert>
            )}
            {loadingType === 'partial' && (
              <Box sx={{ mt: 3 }}>
                <TextField
                  label="Partial Quantity"
                  type="number"
                  value={partialQuantity}
                  onChange={(e) => setPartialQuantity(Number(e.target.value))}
                  fullWidth
                  helperText={
                    selectedOperatorWO
                      ? `Enter quantity less than ${selectedOperatorWO.outputPlan}`
                      : 'Select a work order first'
                  }
                />
              </Box>
            )}
          </Box>
        )

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirm Loading Operation
            </Typography>
            <Paper sx={{ mt: 3, p: 2 }}>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Work Order
                  </Typography>
                  <Typography variant="body1">
                    Sr. No. {selectedOperatorWO?.srNo} -{' '}
                    {selectedOperatorWO?.tool} ({selectedOperatorWO?.subTool})
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Work Order Details
                  </Typography>
                  <Typography variant="body1">
                    Date: {selectedOperatorWO?.date}, Door Colour:{' '}
                    {selectedOperatorWO?.doorColour}, Disp Type:{' '}
                    {selectedOperatorWO?.dispType}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Trolley
                  </Typography>
                  <Typography variant="body1">
                    {scannedTrolley?.trolley_id} ({scannedTrolley?.trolley_type}
                    )
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Loading Type
                  </Typography>
                  <Typography variant="body1">
                    {loadingType === 'full'
                      ? 'Full Loading'
                      : 'Partial Loading'}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Quantity
                  </Typography>
                  <Typography variant="body1">
                    {loadingType === 'full'
                      ? selectedOperatorWO?.outputPlan
                      : partialQuantity}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Operator Loading
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Stepper activeStep={ACTIVEStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 300 }}>{renderStepContent(ACTIVEStep)}</Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={ACTIVEStep === 0} onClick={handleBack}>
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {ACTIVEStep === steps.length - 1 ? (
              <Button variant="contained" onClick={handleSubmit}>
                Submit
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      <Alert
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />

      {/* Scan Modal */}
      <Dialog
        open={scanModalOpen}
        onClose={handleCloseScanModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScannerIcon color="primary" />
            <Typography variant="h6">Scan Trolley</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Please scan the trolley barcode or QR code using your scanner
              device, or enter the code manually.
            </Typography>
            <TextField
              autoFocus
              label="Trolley Code"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              fullWidth
              placeholder="Scan or enter trolley code"
              sx={{ mt: 2 }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleScanFromModal()
                }
              }}
            />
            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="caption" color="info.main">
                💡 Tip: Focus on the input field and use your barcode/QR scanner
                to automatically fill the code.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseScanModal} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleScanFromModal}
            variant="contained"
            startIcon={<ScannerIcon />}
          >
            Confirm Scan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
export default OperatorLoading
