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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material'
import ScannerIcon from '@mui/icons-material/QrCodeScanner'
import SearchIcon from '@mui/icons-material/Search'
import CancelIcon from '@mui/icons-material/Cancel'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CloseIcon from '@mui/icons-material/Close'
import {
  trollyService,
  mappingService,
  materialStockService,
  workOrderService,
  materialService,
} from '../services'
import { Alert } from '../components/molecules'
import type { Trolly } from '../types'
import type { WorkOrderResponse } from '../services/workOrderService'
import type { MaterialTrolleyMapping } from '../services/mappingService'

interface MaterialStockEntry {
  id?: number
  trolley_code: string
  material_code: string
  quantity: number
  loading_type: string
  status: string
  location?: string
  loaded_at?: string
  remarks?: string
  work_order_id?: number
  work_order_number?: string
  loaded_by?: string
  created_at?: string
  updated_at?: string
}

const OperatorLoading: React.FC = () => {
  const [operatorWorkOrders, setOperatorWorkOrders] = useState<
    WorkOrderResponse[]
  >([])
  const [selectedOperatorWO, setSelectedOperatorWO] =
    useState<WorkOrderResponse | null>(null)
  const [trolleyQRCode, settrolleyQRCode] = useState('')
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
  const [mappingData, setMappingData] = useState<MaterialTrolleyMapping | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingWorkOrder, setViewingWorkOrder] =
    useState<WorkOrderResponse | null>(null)
  const [materialStockEntries, setMaterialStockEntries] = useState<
    MaterialStockEntry[]
  >([])
  const [loadingEntries, setLoadingEntries] = useState(false)

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const fetchWorkOrders = async (filters?: Record<string, unknown>) => {
    try {
      setLoading(true)
      const response = await workOrderService.getAll(filters)
      if (response.success && response.data) {
        setOperatorWorkOrders(response.data.workOrders)
      }
    } catch (error) {
      showAlert('Failed to load work orders', 'error')
      console.error('Work order fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load operator work orders on component mount
  useEffect(() => {
    fetchWorkOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectWorkOrder = (workOrder: WorkOrderResponse) => {
    setSelectedOperatorWO(workOrder)
    setShowLoadingScreen(true)
    showAlert(`Work Order ${workOrder.work_order_number} selected`, 'success')
  }

  const handleCancelLoading = () => {
    setShowLoadingScreen(false)
    setSelectedOperatorWO(null)
    settrolleyQRCode('')
    setScannedTrolley(null)
    setLoadingType('full')
    setPartialQuantity(0)
    setMappedQuantity(0)
  }

  const handleScanClick = () => {
    // Simulate barcode scanner - in real implementation, this will trigger actual scanner device
    // For now, we'll just focus the input field for manual entry or scanner input
    const input = document.querySelector(
      'input[name="trolleyQRCode"]'
    ) as HTMLInputElement
    if (input) {
      input.focus()
    }
    showAlert('Ready to scan - please use your scanner device', 'success')
  }

  const handleNextAfterScan = async () => {
    if (!trolleyQRCode.trim()) {
      showAlert('Please enter a trolley barcode or QR code', 'error')
      return
    }

    try {
      const trolleyResponse = await trollyService.scan(trolleyQRCode)
      const trolleyData = (trolleyResponse.data.data ||
        trolleyResponse.data) as Trolly

      if (!trolleyData) {
        showAlert('Trolley not found', 'error')
        return
      }

      setScannedTrolley(trolleyData)
      showAlert('Trolley scanned successfully', 'success')

      const trolleyTypeId = trolleyData.trolly_type_id

      // Fetch material details by material code
      if (selectedOperatorWO?.sub_tool && trolleyTypeId) {
        try {
          const materialResponse = await materialService.getByCode(
            selectedOperatorWO.sub_tool
          )
          if (materialResponse.success && materialResponse.data) {
            const fetchedMaterialId = materialResponse.data.material_id

            // Now fetch mapping with the correct material_id
            await fetchMaterialTrolleyMapping(
              String(fetchedMaterialId),
              String(trolleyTypeId)
            )
          } else {
            showAlert('Material not found', 'error')
          }
        } catch (error) {
          showAlert('Failed to fetch material details', 'error')
          console.error('Material fetch error:', error)
        }
      } else {
        showAlert('Missing material code or trolley type information', 'error')
      }
    } catch (error) {
      showAlert('Failed to scan trolley', 'error')
      console.error('Trolley scan error:', error)
    }
  }

  const fetchMaterialTrolleyMapping = async (
    materialId: string,
    trolleyTypeId: string
  ) => {
    try {
      const response = await mappingService.getMaterialTrolleyMapping(
        materialId,
        trolleyTypeId
      )
      if (response.success && response.data) {
        setMappingData(response.data)
        setMappedQuantity(response.data.max_quantity || 0)
        showAlert(
          `Mapping found: Max ${response.data.max_quantity} units for ${response.data.trolleyType?.trolly_type}`,
          'success'
        )
      } else {
        showAlert(
          'No mapping found for this material-trolley type combination',
          'error'
        )
        setMappedQuantity(0)
        setMappingData(null)
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error.response as { data?: { message?: string } })?.data
              ?.message ||
            'No mapping found for this material-trolley type combination'
          : 'No mapping found for this material-trolley type combination'
      showAlert(errorMessage, 'error')
      setMappedQuantity(0)
      setMappingData(null)
      console.error('Material mapping error:', error)
    }
  }

  const handleViewEntries = async (workOrder: WorkOrderResponse) => {
    setViewingWorkOrder(workOrder)
    setViewDialogOpen(true)
    setLoadingEntries(true)

    try {
      const response = await materialStockService.getByWorkOrder(workOrder.id)
      if (response.success && response.data) {
        setMaterialStockEntries(response.data)
      } else {
        setMaterialStockEntries([])
      }
    } catch (error) {
      showAlert('Failed to load material stock entries', 'error')
      console.error('Material stock fetch error:', error)
      setMaterialStockEntries([])
    } finally {
      setLoadingEntries(false)
    }
  }

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false)
    setViewingWorkOrder(null)
    setMaterialStockEntries([])
  }

  // Filter work orders based on tab and search query
  const getFilteredWorkOrders = () => {
    let filtered = operatorWorkOrders

    if (activeTab === 0) {
      // Pending/Balance: status is PENDING or IN_PROGRESS and output_plan < input_plan
      filtered = filtered.filter(
        (wo) =>
          (wo.status === 'PENDING' || wo.status === 'IN_PROGRESS') &&
          wo.output_plan < wo.input_plan
      )
    } else {
      // Closed: status is COMPLETED or CLOSED or output_plan >= input_plan
      filtered = filtered.filter(
        (wo) =>
          wo.status === 'COMPLETED' ||
          wo.status === 'CLOSED' ||
          wo.output_plan >= wo.input_plan
      )
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (wo) =>
          wo.date.toLowerCase().includes(query) ||
          wo.sub_tool.toLowerCase().includes(query) ||
          wo.work_order_number.toLowerCase().includes(query)
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
        `Quantity cannot exceed maximum quantity (${mappedQuantity})`,
        'error'
      )
      return
    }

    try {
      const loadedQuantity =
        loadingType === 'full' ? mappedQuantity : partialQuantity
      const newOutputPlan = selectedOperatorWO.output_plan + loadedQuantity
      const newInputPlan = selectedOperatorWO.input_plan
      const newConsumedQuantity = selectedOperatorWO.consumed_quantity
      const newRemainingQuantity =
        newInputPlan - newOutputPlan - newConsumedQuantity

      // Determine new status
      let newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' =
        selectedOperatorWO.status
      if (newInputPlan === 0) {
        newStatus = 'CLOSED'
      } else if (newOutputPlan > 0) {
        newStatus = 'IN_PROGRESS'
      }

      // Create material stock record
      const materialStockPayload = {
        material_code: selectedOperatorWO.sub_tool,
        trolley_code: scannedTrolley.trolley_code,
        quantity: loadedQuantity,
        location: '',
        work_order_id: selectedOperatorWO.id,
        work_order_number: selectedOperatorWO.work_order_number,
        loading_type: loadingType === 'full' ? 'FULL' : 'PARTIAL',
        loaded_by: 'current-user-id', // TODO: Get from auth context
        loaded_at: new Date().toISOString(),
        status: 'IN_STOCK',
        remarks: `Loaded from trolley ${scannedTrolley.trolley_code} (${scannedTrolley.trolly_type})`,
      }

      await materialStockService.createStock(materialStockPayload)

      // Update work order
      const updatePayload = {
        input_plan: newInputPlan,
        output_plan: newOutputPlan,
        consumed_quantity: newConsumedQuantity,
        balance_quantity: newRemainingQuantity,
        status: newStatus,
        updated_by: 'current-user-id', // TODO: Get from auth context
      }

      await workOrderService.update(selectedOperatorWO.id, updatePayload)

      showAlert('Loading operation completed successfully', 'success')

      // Refresh work orders list
      await fetchWorkOrders()

      // Reset form
      setTimeout(() => {
        handleCancelLoading()
      }, 2000)
    } catch (error) {
      showAlert('Failed to complete loading operation', 'error')
      console.error('Submit error:', error)
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

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="Pending / Balance Work Orders" />
          <Tab label="Closed Work Orders" />
        </Tabs>

        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
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
                  <strong>Planned</strong>
                </TableCell>
                <TableCell>
                  <strong>In Stock</strong>
                </TableCell>
                <TableCell>
                  <strong>Consumed</strong>
                </TableCell>
                <TableCell>
                  <strong>Pending</strong>
                </TableCell>
                <TableCell>
                  <strong>Action</strong>
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
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} align="center">
                    <Typography variant="body2" color="text.secondary" py={3}>
                      No work orders found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((wo) => (
                  <TableRow key={wo.id}>
                    <TableCell>{wo.work_order_number}</TableCell>
                    <TableCell>{wo.date}</TableCell>
                    <TableCell>{wo.tool}</TableCell>
                    <TableCell>
                      <strong>{wo.sub_tool}</strong>
                    </TableCell>
                    <TableCell>{wo.door_colour}</TableCell>
                    <TableCell>{wo.handle}</TableCell>
                    <TableCell>{wo.micom}</TableCell>
                    <TableCell>{wo.lock1}</TableCell>
                    <TableCell>{wo.disp_type}</TableCell>
                    <TableCell>{wo.input_plan}</TableCell>
                    <TableCell>{wo.output_plan}</TableCell>
                    <TableCell>{wo.consumed_quantity}</TableCell>
                    <TableCell>
                      {wo.input_plan - wo.output_plan - wo.consumed_quantity}
                    </TableCell>
                    <TableCell>
                      {activeTab === 0 ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            color="info"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewEntries(wo)}
                          >
                            View
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handleSelectWorkOrder(wo)}
                          >
                            Load
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            color="info"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewEntries(wo)}
                          >
                            View
                          </Button>
                          <Typography variant="body2" color="text.secondary">
                            Completed
                          </Typography>
                        </Box>
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
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'primary.lighter' }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            Selected Work Order: {selectedOperatorWO.work_order_number}
          </Typography>
          <Typography variant="body2">
            Tool: {selectedOperatorWO.tool} | Material Code:{' '}
            <strong>{selectedOperatorWO.sub_tool}</strong> | Date:{' '}
            {selectedOperatorWO.date}
          </Typography>
          <Typography variant="body2">
            Planned: {selectedOperatorWO.input_plan} | Current Output:{' '}
            {selectedOperatorWO.output_plan} | Balance:{' '}
            {selectedOperatorWO.output_plan -
              selectedOperatorWO.consumed_quantity}
          </Typography>
        </Paper>

        {!scannedTrolley ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              Scan Trolley Barcode/QR Code
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 3, mb: 3 }}>
              <TextField
                name="trolleyQRCode"
                label="Trolley barcode/QR Code"
                value={trolleyQRCode}
                onChange={(e) => settrolleyQRCode(e.target.value)}
                fullWidth
                placeholder="Enter or scan Trolley barcode/QR code"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && trolleyQRCode.trim()) {
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
                disabled={!trolleyQRCode.trim()}
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
              Trolley {scannedTrolley.trolley_code} (Type:{' '}
              {scannedTrolley.trolly_type}) scanned successfully
            </MuiAlert>

            {mappingData && mappedQuantity > 0 && (
              <MuiAlert severity="info" sx={{ mb: 3 }}>
                Material-Trolley Type mapping found: Max {mappedQuantity} units
                {mappingData.material &&
                  ` for ${mappingData.material.material_name}`}
              </MuiAlert>
            )}

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
                  helperText={`Enter quantity (Max: ${mappedQuantity} units)`}
                  inputProps={{ min: 1, max: mappedQuantity }}
                />
              </Box>
            )}

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
                    Material Code:{' '}
                    <strong>{selectedOperatorWO.sub_tool}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Trolley: <strong>{scannedTrolley.trolley_code}</strong>{' '}
                    (Type: {scannedTrolley.trolly_type})
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
                    New In Stock:{' '}
                    <strong>
                      {selectedOperatorWO.output_plan +
                        (loadingType === 'full'
                          ? mappedQuantity
                          : partialQuantity)}
                    </strong>
                  </Typography>
                </Box>
              </Paper>
            )}

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

      {/* Material Stock Entries Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6">
              Material Stock Entries for Work Order:{' '}
              {viewingWorkOrder?.work_order_number}
            </Typography>
            <IconButton onClick={handleCloseViewDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          {viewingWorkOrder && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Material Code: <strong>{viewingWorkOrder.sub_tool}</strong> |
              Tool: {viewingWorkOrder.tool} | Date: {viewingWorkOrder.date}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {loadingEntries ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Loading entries...</Typography>
            </Box>
          ) : materialStockEntries.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No material stock entries found for this work order
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Trolley Code</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Material Code</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Quantity</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Loading Type</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Location</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Loaded At</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Remarks</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {materialStockEntries.map((entry, index) => (
                    <TableRow key={entry.id || index}>
                      <TableCell>{entry.trolley_code}</TableCell>
                      <TableCell>{entry.material_code}</TableCell>
                      <TableCell>{entry.quantity}</TableCell>
                      <TableCell>{entry.loading_type}</TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor:
                              entry.status === 'IN_STOCK'
                                ? 'success.lighter'
                                : 'grey.300',
                            color:
                              entry.status === 'IN_STOCK'
                                ? 'success.dark'
                                : 'text.secondary',
                          }}
                        >
                          {entry.status}
                        </Typography>
                      </TableCell>
                      <TableCell>{entry.location || '-'}</TableCell>
                      <TableCell>
                        {entry.loaded_at
                          ? new Date(entry.loaded_at).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{
                            maxWidth: 200,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={entry.remarks}
                        >
                          {entry.remarks || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default OperatorLoading
