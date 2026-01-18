import React, { useState, useEffect, useCallback } from 'react'
import { MainLayout } from '../components/templates'
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  Alert as MuiAlert,
  Divider,
} from '@mui/material'
import ScannerIcon from '@mui/icons-material/QrCodeScanner'
import { loadingService, workOrderService, trollyService } from '../services'
import { Alert } from '../components/molecules'
import type { Trolly, WorkOrder } from '../types'

const steps = ['Scan Trolley', 'Select Work Order', 'Loading Type', 'Confirm']

const OperatorLoading: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [trolleyCode, setTrolleyCode] = useState('')
  const [scannedTrolley, setScannedTrolley] = useState<Trolly | null>(null)
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [selectedWO, setSelectedWO] = useState('')
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(
    null
  )
  const [loadingType, setLoadingType] = useState('full')
  const [partialQuantity, setPartialQuantity] = useState(0)
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadWorkOrders = useCallback(async () => {
    try {
      const response = await workOrderService.getAll(1, 100)
      setWorkOrders(response.data.filter((wo) => wo.status === 'Open'))
    } catch {
      showAlert('Failed to load work orders', 'error')
    }
  }, [])

  useEffect(() => {
    if (activeStep === 1) {
      loadWorkOrders()
    }
  }, [activeStep, loadWorkOrders])

  useEffect(() => {
    if (selectedWO) {
      const wo = workOrders.find((w) => w.workOrderId === selectedWO)
      setSelectedWorkOrder(wo || null)
      if (loadingType === 'full' && wo) {
        setPartialQuantity(wo.quantity)
      }
    }
  }, [selectedWO, workOrders, loadingType])

  const handleScanTrolley = async () => {
    if (!trolleyCode.trim()) {
      showAlert('Please enter a trolley barcode or QR code', 'error')
      return
    }

    try {
      const response = await trollyService.scan(trolleyCode)
      setScannedTrolley(response.data || null)
      showAlert('Trolley scanned successfully', 'success')
      setActiveStep(1)
    } catch {
      showAlert('Trolley not found', 'error')
    }
  }

  const handleNext = () => {
    if (activeStep === 1 && !selectedWO) {
      showAlert('Please select a work order', 'error')
      return
    }
    if (activeStep === 2) {
      if (loadingType === 'partial' && partialQuantity <= 0) {
        showAlert('Please enter a valid quantity', 'error')
        return
      }
      if (
        loadingType === 'partial' &&
        selectedWorkOrder &&
        partialQuantity >= selectedWorkOrder.quantity
      ) {
        showAlert('Partial quantity must be less than full quantity', 'error')
        return
      }
    }
    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        trollyId: scannedTrolley!.trollyId,
        workOrderId: selectedWorkOrder!.id,
        workOrderNumber: selectedWorkOrder!.workOrderNumber,
        doorTypes: selectedWorkOrder!.doorTypes,
        loadingType: (loadingType === 'full' ? 'Full' : 'Partial') as
          | 'Full'
          | 'Partial',
        loadedQuantity:
          loadingType === 'full'
            ? selectedWorkOrder!.quantity
            : partialQuantity,
        maxCapacity: selectedWorkOrder!.quantity,
        operatorId: 'current-user-id', // TODO: Get from auth context
        operatorName: 'Current User', // TODO: Get from auth context
        timestamp: new Date().toISOString(),
        status: 'Loaded' as const,
      }

      await loadingService.createLoading(payload)
      showAlert('Loading operation completed successfully', 'success')

      // Reset form
      setTimeout(() => {
        setActiveStep(0)
        setTrolleyCode('')
        setScannedTrolley(null)
        setSelectedWO('')
        setSelectedWorkOrder(null)
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
              Scan Trolley Barcode/QR Code
            </Typography>
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
                onClick={handleScanTrolley}
                sx={{ minWidth: 120 }}
              >
                Scan
              </Button>
            </Box>
            {scannedTrolley && (
              <MuiAlert severity="success" sx={{ mt: 3 }}>
                Trolley {scannedTrolley.trollyId} ({scannedTrolley.trollyType})
                scanned successfully
              </MuiAlert>
            )}
          </Box>
        )

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Work Order
            </Typography>
            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel>Work Order</InputLabel>
              <Select
                value={selectedWO}
                onChange={(e) => setSelectedWO(e.target.value)}
              >
                {workOrders.map((wo) => (
                  <MenuItem key={wo.workOrderId} value={wo.workOrderId}>
                    {wo.workOrderId} - Qty: {wo.quantity} ({wo.classification})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedWorkOrder && (
              <Paper sx={{ mt: 3, p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Work Order Details
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Quantity
                    </Typography>
                    <Typography variant="body1">
                      {selectedWorkOrder.quantity}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Classification
                    </Typography>
                    <Typography variant="body1">
                      {selectedWorkOrder.classification}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Door Types
                    </Typography>
                    <Typography variant="body1">
                      {selectedWorkOrder.doorTypes.join(', ')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Orientation
                    </Typography>
                    <Typography variant="body1">
                      {selectedWorkOrder.doorOrientation}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
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
            {loadingType === 'full' && selectedWorkOrder && (
              <MuiAlert severity="info" sx={{ mt: 3 }}>
                Full quantity of {selectedWorkOrder.quantity} units will be
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
                    selectedWorkOrder
                      ? `Enter quantity less than ${selectedWorkOrder.quantity}`
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
                    Trolley
                  </Typography>
                  <Typography variant="body1">
                    {scannedTrolley?.trollyId} ({scannedTrolley?.trollyType})
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Work Order
                  </Typography>
                  <Typography variant="body1">
                    {selectedWorkOrder?.workOrderId}
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
                      ? selectedWorkOrder?.quantity
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
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Operator Loading
        </Typography>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 300 }}>{renderStepContent(activeStep)}</Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep === steps.length - 1 ? (
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
      </Box>
    </MainLayout>
  )
}

export default OperatorLoading
