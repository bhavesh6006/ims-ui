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

const OperatorLoading: React.FC = () => {
  const [operatorWorkOrders, setOperatorWorkOrders] = useState<
    WorkOrderResponse[]
  >([])
  const [selectedOperatorWO, setSelectedOperatorWO] =
    useState<WorkOrderResponse | null>(null)
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
  const [mappingData, setMappingData] = useState<MaterialTrolleyMapping | null>(
    null
  )
  const [loading, setLoading] = useState(false)

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
      const trolleyResponse = await trollyService.scan(trolleyCode)
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
      const newInputPlan = selectedOperatorWO.input_plan - loadedQuantity

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
                    <TableCell>{wo.input_plan - wo.output_plan}</TableCell>
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
            Input Plan: {selectedOperatorWO.input_plan} | Current Output:{' '}
            {selectedOperatorWO.output_plan} | Balance:{' '}
            {selectedOperatorWO.input_plan - selectedOperatorWO.output_plan}
          </Typography>
        </Paper>

        {/* ...rest of loading screen remains the same... */}
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

            {mappedQuantity === 0 && (
              <MuiAlert severity="warning" sx={{ mb: 3 }}>
                No mapping found for material {selectedOperatorWO.sub_tool} with
                trolley type {scannedTrolley.trolly_type}
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
                    New Output Plan:{' '}
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
    </Box>
  )
}

export default OperatorLoading
