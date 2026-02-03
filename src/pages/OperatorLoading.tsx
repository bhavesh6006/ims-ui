import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
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
  Tabs,
  Tab,
  InputAdornment,
} from '@mui/material'
import ScannerIcon from '@mui/icons-material/QrCodeScanner'
import SearchIcon from '@mui/icons-material/Search'
import CancelIcon from '@mui/icons-material/Cancel'
import {
  loadingService,
  trollyService,
  mappingService,
  materialStockService,
} from '../services'
import { Alert } from '../components/molecules'
import type { Trolly, OperatorWorkOrder } from '../types'

// Test data for work orders
const mockWorkOrders: OperatorWorkOrder[] = [
  {
    id: '1',
    srNo: 1,
    workOrderNumber: 'WO-2026-001',
    date: '2026-02-01',
    tool: 'Tool A',
    subTool: 'MT-A-001', // Material Code
    doorColour: 'White',
    handle: 'Handle-X',
    micom: 'MC-100',
    lock1: 'Lock-A1',
    dispType: 'Type-1',
    inputPlan: 100,
    outputPlan: 0,
  },
  {
    id: '2',
    srNo: 2,
    workOrderNumber: 'WO-2026-002',
    date: '2026-02-02',
    tool: 'Tool B',
    subTool: 'MT-B-002',
    doorColour: 'Black',
    handle: 'Handle-Y',
    micom: 'MC-200',
    lock1: 'Lock-B2',
    dispType: 'Type-2',
    inputPlan: 150,
    outputPlan: 50,
  },
  {
    id: '3',
    srNo: 3,
    workOrderNumber: 'WO-2026-003',
    date: '2026-02-02',
    tool: 'Tool C',
    subTool: 'MT-C-003',
    doorColour: 'Silver',
    handle: 'Handle-Z',
    micom: 'MC-300',
    lock1: 'Lock-C3',
    dispType: 'Type-1',
    inputPlan: 80,
    outputPlan: 0,
  },
  {
    id: '4',
    srNo: 4,
    workOrderNumber: 'WO-2026-004',
    date: '2026-02-03',
    tool: 'Tool A',
    subTool: 'MT-A-004',
    doorColour: 'Grey',
    handle: 'Handle-X',
    micom: 'MC-400',
    lock1: 'Lock-A4',
    dispType: 'Type-3',
    inputPlan: 120,
    outputPlan: 120,
  },
  {
    id: '5',
    srNo: 5,
    workOrderNumber: 'WO-2026-005',
    date: '2026-02-03',
    tool: 'Tool D',
    subTool: 'MT-D-005',
    doorColour: 'Brown',
    handle: 'Handle-W',
    micom: 'MC-500',
    lock1: 'Lock-D5',
    dispType: 'Type-2',
    inputPlan: 90,
    outputPlan: 88,
  },
]

const OperatorLoading: React.FC = () => {
  const [operatorWorkOrders, setOperatorWorkOrders] = useState<
    OperatorWorkOrder[]
  >([])
  const [selectedOperatorWO, setSelectedOperatorWO] =
    useState<OperatorWorkOrder | null>(null)
  const [trolleyCode, setTrolleyCode] = useState('')
  const [scannedTrolley, setScannedTrolley] = useState<Trolly | null>(null)
  const [loadingType, setLoadingType] = useState('full')
  const [partialQuantity, setPartialQuantity] = useState(0)
  const [mappedQuantity, setMappedQuantity] = useState(0)
  const [showLoadingScreen, setShowLoadingScreen] = useState(false)
  const [activeTab, setActiveTab] = useState(0) // 0: Pending, 1: Closed
  const [searchQuery, setSearchQuery] = useState('')
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
    setShowLoadingScreen(true)
    showAlert(`Work Order ${workOrder.workOrderNumber} selected`, 'success')
  }

  const handleCancelLoading = () => {
    setShowLoadingScreen(false)
    setSelectedOperatorWO(null)
    setTrolleyCode('')
    setScannedTrolley(null)
    setLoadingType('full')
    setPartialQuantity(0)
    setMappedQuantity(0)
  }

  const handleScanClick = () => {
    // Simulate barcode scanner - in real implementation, this will trigger actual scanner device
    // For now, we'll just focus the input field for manual entry or scanner input
    const input = document.querySelector(
      'input[name="trolleyCode"]'
    ) as HTMLInputElement
    if (input) {
      input.focus()
    }
    showAlert('Ready to scan - please use your scanner device', 'success')
  }

  const handleNextAfterScan = async () => {
    if (!trolleyCode.trim()) {
      showAlert('Please enter a trolley barcode or QR code', 'error')
      return
    }

    try {
      const response = await trollyService.scan(trolleyCode)
      setScannedTrolley(response.data || null)
      showAlert('Trolley scanned successfully', 'success')

      // Fetch material-trolley mapping
      if (selectedOperatorWO) {
        await fetchMaterialTrolleyMapping(
          selectedOperatorWO.subTool,
          trolleyCode
        )
      }
    } catch {
      showAlert('Trolley not found', 'error')
    }
  }

  const fetchMaterialTrolleyMapping = async (
    materialCode: string,
    trolleyCode: string
  ) => {
    try {
      const response = await mappingService.getMaterialTrolleyMapping(
        materialCode,
        trolleyCode
      )
      if (response.data && response.data.quantity) {
        setMappedQuantity(response.data.quantity)
        showAlert(
          `Mapping found: ${response.data.quantity} units available`,
          'success'
        )
      }
    } catch {
      showAlert(
        'No mapping found for this material-trolley combination',
        'error'
      )
      setMappedQuantity(0)
    }
  }

  // Filter work orders based on tab and search query
  const getFilteredWorkOrders = () => {
    let filtered = operatorWorkOrders

    // Filter by tab (Pending/Closed)
    if (activeTab === 0) {
      // Pending/Balance: outputPlan < inputPlan
      filtered = filtered.filter((wo) => wo.outputPlan < wo.inputPlan)
    } else {
      // Closed: outputPlan >= inputPlan
      filtered = filtered.filter((wo) => wo.outputPlan >= wo.inputPlan)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (wo) =>
          wo.date.toLowerCase().includes(query) ||
          wo.subTool.toLowerCase().includes(query) ||
          wo.workOrderNumber.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  const handleSubmit = async () => {
    if (!scannedTrolley || !selectedOperatorWO) {
      showAlert('Please complete all required steps', 'error')
      return
    }

    if (loadingType === 'partial' && partialQuantity <= 0) {
      showAlert('Please enter a valid quantity', 'error')
      return
    }

    if (loadingType === 'partial' && partialQuantity > mappedQuantity) {
      showAlert(
        `Quantity cannot exceed mapped quantity (${mappedQuantity})`,
        'error'
      )
      return
    }

    try {
      const loadedQuantity =
        loadingType === 'full' ? mappedQuantity : partialQuantity
      const newOutputPlan = selectedOperatorWO.outputPlan + loadedQuantity

      // Create loading record
      const loadingPayload = {
        trollyId: scannedTrolley.trolley_id,
        workOrderId: selectedOperatorWO.id,
        workOrderNumber: selectedOperatorWO.workOrderNumber,
        doorTypes: [selectedOperatorWO.tool],
        loadingType: (loadingType === 'full' ? 'Full' : 'Partial') as
          | 'Full'
          | 'Partial',
        loadedQuantity: loadedQuantity,
        maxCapacity: selectedOperatorWO.inputPlan,
        operatorId: 'current-user-id', // TODO: Get from auth context
        operatorName: 'Current User', // TODO: Get from auth context
        timestamp: new Date().toISOString(),
        status: 'Loaded' as const,
      }

      await loadingService.createLoading(loadingPayload)

      // Update work order output plan
      // TODO: Add API call to update work order
      // await workOrderService.updateOutputPlan(selectedOperatorWO.id, newOutputPlan)

      // Create material stock record
      const materialStockPayload = {
        materialCode: selectedOperatorWO.subTool,
        trolleyCode: scannedTrolley.trolley_id,
        quantity: loadedQuantity,
        location: '', // Blank for now, will be updated via RFID integration
        workOrderId: selectedOperatorWO.id,
        workOrderNumber: selectedOperatorWO.workOrderNumber,
        loadingType: (loadingType === 'full' ? 'FULL' : 'PARTIAL') as
          | 'FULL'
          | 'PARTIAL',
        loadedBy: 'current-user-id', // TODO: Get from auth context
        status: 'IN_STOCK' as 'IN_STOCK' | 'IN_TRANSIT' | 'CONSUMED',
      }

      await materialStockService.createStock(materialStockPayload)

      showAlert('Loading operation completed successfully', 'success')

      // Update local state
      setOperatorWorkOrders((prev) =>
        prev.map((wo) =>
          wo.id === selectedOperatorWO.id
            ? { ...wo, outputPlan: newOutputPlan }
            : wo
        )
      )

      // Reset form
      setTimeout(() => {
        handleCancelLoading()
      }, 2000)
    } catch {
      showAlert('Failed to complete loading operation', 'error')
    }
  }

  const renderMainScreen = () => {
    const filteredOrders = getFilteredWorkOrders()

    return (
      <Box>
        {/* Search Box */}
        <TextField
          fullWidth
          placeholder="Search by Date, Material Code (SUB Tool), or Work Order Number"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {/* Tabs for Pending/Closed */}
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="Pending / Balance Work Orders" />
          <Tab label="Closed Work Orders" />
        </Tabs>

        {/* Work Orders Table */}
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Sr. No.</strong>
                </TableCell>
                <TableCell>
                  <strong>Work Order No.</strong>
                </TableCell>
                <TableCell>
                  <strong>Date</strong>
                </TableCell>
                <TableCell>
                  <strong>Tool</strong>
                </TableCell>
                <TableCell>
                  <strong>Material Code (SUB Tool)</strong>
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
                  <strong>Balance</strong>
                </TableCell>
                <TableCell>
                  <strong>Action</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} align="center">
                    <Typography variant="body2" color="text.secondary" py={3}>
                      No work orders found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((wo) => (
                  <TableRow key={wo.id}>
                    <TableCell>{wo.srNo}</TableCell>
                    <TableCell>{wo.workOrderNumber}</TableCell>
                    <TableCell>{wo.date}</TableCell>
                    <TableCell>{wo.tool}</TableCell>
                    <TableCell>
                      <strong>{wo.subTool}</strong>
                    </TableCell>
                    <TableCell>{wo.doorColour}</TableCell>
                    <TableCell>{wo.handle}</TableCell>
                    <TableCell>{wo.micom}</TableCell>
                    <TableCell>{wo.lock1}</TableCell>
                    <TableCell>{wo.dispType}</TableCell>
                    <TableCell>{wo.inputPlan}</TableCell>
                    <TableCell>{wo.outputPlan}</TableCell>
                    <TableCell>{wo.inputPlan - wo.outputPlan}</TableCell>
                    <TableCell>
                      {activeTab === 0 ? (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleSelectWorkOrder(wo)}
                        >
                          Loading
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Completed
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    )
  }

  const renderLoadingScreen = () => {
    if (!selectedOperatorWO) return null

    return (
      <Box>
        {/* Work Order Info */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'primary.lighter' }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            Selected Work Order: {selectedOperatorWO.workOrderNumber}
          </Typography>
          <Typography variant="body2">
            Tool: {selectedOperatorWO.tool} | Material Code:{' '}
            <strong>{selectedOperatorWO.subTool}</strong> | Date:{' '}
            {selectedOperatorWO.date}
          </Typography>
          <Typography variant="body2">
            Input Plan: {selectedOperatorWO.inputPlan} | Current Output:{' '}
            {selectedOperatorWO.outputPlan} | Balance:{' '}
            {selectedOperatorWO.inputPlan - selectedOperatorWO.outputPlan}
          </Typography>
        </Paper>

        {/* Trolley Scan Section */}
        {!scannedTrolley ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              Scan Trolley Barcode/QR Code
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 3, mb: 3 }}>
              <TextField
                name="trolleyCode"
                label="Trolley Code"
                value={trolleyCode}
                onChange={(e) => setTrolleyCode(e.target.value)}
                fullWidth
                placeholder="Enter or scan barcode/QR code"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && trolleyCode.trim()) {
                    handleNextAfterScan()
                  }
                }}
              />
              <Button
                variant="outlined"
                startIcon={<ScannerIcon />}
                onClick={handleScanClick}
                sx={{ minWidth: 120 }}
              >
                Scan
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleNextAfterScan}
                disabled={!trolleyCode.trim()}
                sx={{ minWidth: 120 }}
              >
                Next
              </Button>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="caption" color="info.main">
                💡 Tip: Click "Scan" button and use your barcode/QR scanner
                device, or enter the code manually and click "Next"
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box>
            <MuiAlert severity="success" sx={{ mb: 3 }}>
              Trolley {scannedTrolley.trolley_id} ({scannedTrolley.trolley_type}
              ) scanned successfully
            </MuiAlert>

            {mappedQuantity > 0 && (
              <MuiAlert severity="info" sx={{ mb: 3 }}>
                Material-Trolley mapping found: {mappedQuantity} units available
              </MuiAlert>
            )}

            {/* Loading Type Selection */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Select Loading Type
            </Typography>
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <RadioGroup
                value={loadingType}
                onChange={(e) => {
                  setLoadingType(e.target.value)
                  if (e.target.value === 'full') {
                    setPartialQuantity(0)
                  }
                }}
              >
                <FormControlLabel
                  value="full"
                  control={<Radio />}
                  label={`Full Loading (${mappedQuantity} units)`}
                  disabled={mappedQuantity === 0}
                />
                <FormControlLabel
                  value="partial"
                  control={<Radio />}
                  label="Partial Loading"
                  disabled={mappedQuantity === 0}
                />
              </RadioGroup>
            </FormControl>

            {loadingType === 'partial' && (
              <Box sx={{ mt: 3 }}>
                <TextField
                  label="Partial Quantity"
                  type="number"
                  value={partialQuantity}
                  onChange={(e) => setPartialQuantity(Number(e.target.value))}
                  fullWidth
                  helperText={`Enter quantity (Max: ${mappedQuantity} units from mapping)`}
                  inputProps={{ min: 1, max: mappedQuantity }}
                />
              </Box>
            )}

            {/* Confirmation Summary */}
            {(loadingType === 'full' || partialQuantity > 0) && (
              <Paper sx={{ mt: 3, p: 2, backgroundColor: 'success.lighter' }}>
                <Typography
                  variant="subtitle2"
                  color="success.main"
                  gutterBottom
                >
                  Loading Summary
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Typography variant="body2">
                    Material Code: <strong>{selectedOperatorWO.subTool}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Trolley: <strong>{scannedTrolley.trolley_id}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Loading Type:{' '}
                    <strong>
                      {loadingType === 'full'
                        ? 'Full Loading'
                        : 'Partial Loading'}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    Quantity to Load:{' '}
                    <strong>
                      {loadingType === 'full'
                        ? mappedQuantity
                        : partialQuantity}{' '}
                      units
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    New Output Plan:{' '}
                    <strong>
                      {selectedOperatorWO.outputPlan +
                        (loadingType === 'full'
                          ? mappedQuantity
                          : partialQuantity)}
                    </strong>
                  </Typography>
                </Box>
              </Paper>
            )}

            {/* Action Buttons */}
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}
            >
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleCancelLoading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmit}
                disabled={
                  !scannedTrolley ||
                  mappedQuantity === 0 ||
                  (loadingType === 'partial' && partialQuantity <= 0)
                }
              >
                Confirm & Save
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Operator Loading
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        {!showLoadingScreen ? renderMainScreen() : renderLoadingScreen()}
      </Paper>

      <Alert
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />
    </Box>
  )
}

export default OperatorLoading
