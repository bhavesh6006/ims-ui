import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  TablePagination,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CancelIcon from '@mui/icons-material/Cancel'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import {
  trollyService,
  mappingService,
  materialStockService,
  workOrderService,
  materialService,
} from '../services'
import { Alert } from '../components/molecules'
import { ActionButton } from '../components/atoms'
import type { Trolly } from '../types'
import type {
  WorkOrderResponse,
  WorkOrderListResponse,
} from '../services/workOrderService'
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
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [selectedOperatorWO, setSelectedOperatorWO] =
    useState<WorkOrderResponse | null>(null)
  const [trolleyQRCode, settrolleyQRCode] = useState('')
  const [scannedTrolley, setScannedTrolley] = useState<Trolly | null>(null)
  const [loadingType, setLoadingType] = useState('full')
  const [partialQuantity, setPartialQuantity] = useState(0)
  const [mappedQuantity, setMappedQuantity] = useState(0)
  const [showLoadingDialog, setShowLoadingDialog] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
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
  const [scanning, setScanning] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingWorkOrder, setViewingWorkOrder] =
    useState<WorkOrderResponse | null>(null)
  const [materialStockEntries, setMaterialStockEntries] = useState<
    MaterialStockEntry[]
  >([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const trolleyInputRef = useRef<HTMLInputElement>(null)
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const fetchWorkOrders = async () => {
    try {
      setLoading(true)

      // Fetch all records for client-side filtering
      const filters: Record<string, unknown> = {
        page: 1,
        limit: 10000, // Fetch all records
      }

      const response = await workOrderService.getAll(filters)
      if (response.success && response.data) {
        const workOrderData = response.data as WorkOrderListResponse
        setOperatorWorkOrders(workOrderData.workOrders)
      }
    } catch (error) {
      showAlert('Failed to load work orders', 'error')
      console.error('Work order fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset to first page when tab or search changes
  useEffect(() => {
    setPage(0)
  }, [activeTab, searchQuery])

  const getFilteredWorkOrders = () => {
    let filtered = operatorWorkOrders

    // Apply tab-based filtering
    if (activeTab === 0) {
      filtered = filtered.filter(
        (wo) =>
          (wo.status === 'PENDING' || wo.status === 'IN_PROGRESS') &&
          wo.output_plan < wo.input_plan
      )
    } else {
      filtered = filtered.filter(
        (wo) =>
          wo.status === 'COMPLETED' ||
          wo.status === 'CLOSED' ||
          wo.output_plan >= wo.input_plan
      )
    }

    // Apply client-side search across multiple fields
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      filtered = filtered.filter((wo) => {
        // Search by work order number
        const matchesWorkOrder = wo.work_order_number
          .toLowerCase()
          .includes(query)

        // Search by material code (sub_tool)
        const matchesMaterialCode = wo.sub_tool.toLowerCase().includes(query)

        // Search by date (format: YYYY-MM-DD)
        const matchesDate = wo.date.includes(query)

        return matchesWorkOrder || matchesMaterialCode || matchesDate
      })
    }

    return filtered
  }

  // Calculate pagination for filtered results
  useEffect(() => {
    const filtered = getFilteredWorkOrders()
    setTotal(filtered.length)
  }, [operatorWorkOrders, activeTab])

  const handleSelectWorkOrder = (workOrder: WorkOrderResponse) => {
    setSelectedOperatorWO(workOrder)
    setShowLoadingDialog(true)
    settrolleyQRCode('')
    setScannedTrolley(null)
    setLoadingType('full')
    setPartialQuantity(0)
    setMappedQuantity(0)
    setMappingData(null)
    showAlert(`Work Order ${workOrder.work_order_number} selected`, 'success')
    // Auto-focus the trolley input after dialog opens
    setTimeout(() => {
      trolleyInputRef.current?.focus()
    }, 300)
  }

  const handleCancelLoading = () => {
    setShowLoadingDialog(false)
    setSelectedOperatorWO(null)
    settrolleyQRCode('')
    setScannedTrolley(null)
    setLoadingType('full')
    setPartialQuantity(0)
    setMappedQuantity(0)
    setMappingData(null)
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

  const processTrolleyScan = useCallback(
    async (code: string) => {
      if (!code.trim() || !selectedOperatorWO) return

      setScanning(true)
      try {
        const trolleyResponse = await trollyService.scan(code)
        const trolleyData = (trolleyResponse.data.data ||
          trolleyResponse.data) as Trolly

        if (!trolleyData) {
          showAlert('Trolley not found', 'error')
          setTimeout(() => trolleyInputRef.current?.focus(), 100)
          setScanning(false)
          return
        }

        if (trolleyData.is_occupied) {
          showAlert('Trolley Already Occupied', 'error')
          setTimeout(() => trolleyInputRef.current?.focus(), 100)
          setScanning(false)
          return
        }

        setScannedTrolley(trolleyData)
        showAlert('Trolley scanned successfully', 'success')

        const trolleyTypeId = trolleyData.trolly_type_id

        if (selectedOperatorWO?.sub_tool && trolleyTypeId) {
          try {
            const materialResponse = await materialService.getByCode(
              selectedOperatorWO.sub_tool
            )
            if (materialResponse.success && materialResponse.data) {
              const fetchedMaterialId = materialResponse.data.material_id
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
          showAlert(
            'Missing material code or trolley type information',
            'error'
          )
        }
      } catch (error) {
        showAlert('Failed to scan trolley', 'error')
        console.error('Trolley scan error:', error)
        setTimeout(() => trolleyInputRef.current?.focus(), 100)
      } finally {
        setScanning(false)
      }
    },
    [selectedOperatorWO]
  )

  const handleTrolleyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    settrolleyQRCode(value)

    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
    }

    // Auto-trigger after a short delay (handles both scanner and paste)
    if (value.trim()) {
      scanTimeoutRef.current = setTimeout(() => {
        processTrolleyScan(value)
      }, 500)
    }
  }

  const handleTrolleyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && trolleyQRCode.trim()) {
      // Clear any pending timeout and process immediately
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current)
      }
      processTrolleyScan(trolleyQRCode)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current)
      }
    }
  }, [])

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

      let newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' =
        selectedOperatorWO.status
      if (newInputPlan === 0) {
        newStatus = 'CLOSED'
      } else if (newOutputPlan > 0) {
        newStatus = 'IN_PROGRESS'
      }

      const materialStockPayload = {
        material_code: selectedOperatorWO.sub_tool,
        trolley_code: scannedTrolley.trolley_code,
        quantity: loadedQuantity,
        location: '',
        work_order_id: selectedOperatorWO.id,
        work_order_number: selectedOperatorWO.work_order_number,
        loading_type: loadingType === 'full' ? 'FULL' : 'PARTIAL',
        loaded_by: 'current-user-id',
        loaded_at: new Date().toISOString(),
        status: 'IN_STOCK',
        remarks: `Loaded from trolley ${scannedTrolley.trolley_code} (${scannedTrolley.trolly_type})`,
      }

      await materialStockService.createStock(materialStockPayload)
      await trollyService.update(scannedTrolley.trolley_id, {
        is_occupied: true,
        trolley_code: scannedTrolley.trolley_code,
        qr_code: scannedTrolley.qr_code,
      })

      const updatePayload = {
        input_plan: newInputPlan,
        output_plan: newOutputPlan,
        consumed_quantity: newConsumedQuantity,
        balance_quantity: newRemainingQuantity,
        status: newStatus,
        updated_by: 'current-user-id',
      }

      await workOrderService.update(selectedOperatorWO.id, updatePayload)

      showAlert('Loading operation completed successfully', 'success')

      await fetchWorkOrders()

      setTimeout(() => {
        handleCancelLoading()
      }, 2000)
    } catch (error) {
      showAlert('Failed to complete loading operation', 'error')
      console.error('Submit error:', error)
    }
  }

  const handleSyncWorkOrders = async () => {
    setSyncing(true)
    try {
      // TODO: Replace with external API call to sync work order data into DB
      await fetchWorkOrders()
      showAlert('Work orders refreshed successfully', 'success')
    } catch (error) {
      showAlert('Failed to sync work orders', 'error')
      console.error('Sync error:', error)
    } finally {
      setSyncing(false)
    }
  }

  const renderMainScreen = () => {
    const filteredOrders = getFilteredWorkOrders()

    // Apply client-side pagination to filtered results
    const startIndex = page * pageSize
    const endIndex = startIndex + pageSize
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

    return (
      <Box>
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
                  <TableCell colSpan={14} align="center">
                    <Typography variant="body2" color="text.secondary" py={3}>
                      Loading...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} align="center">
                    <Typography variant="body2" color="text.secondary" py={3}>
                      No work orders found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((wo) => (
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
                          <ActionButton
                            label="Load"
                            icon={undefined}
                            onClick={() => handleSelectWorkOrder(wo)}
                            variant="contained"
                            color="primary"
                            size="small"
                          />
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
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_event, newPage) => setPage(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(event) => {
            setPageSize(parseInt(event.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Box>
    )
  }

  const renderLoadingDialogContent = () => {
    if (!selectedOperatorWO) return null

    return (
      <Box>
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'primary.lighter' }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            Work Order: {selectedOperatorWO.work_order_number}
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
            <Typography variant="h6" sx={{ mb: 1 }}>
              Scan Trolley Barcode/QR Code
            </Typography>

            <TextField
              inputRef={trolleyInputRef}
              name="trolleyQRCode"
              label="Trolley Barcode/QR Code"
              value={trolleyQRCode}
              onChange={handleTrolleyInputChange}
              onKeyDown={handleTrolleyKeyDown}
              fullWidth
              autoFocus
              placeholder="Scan or type trolley barcode/QR code"
              disabled={scanning}
              helperText={
                scanning
                  ? 'Processing...'
                  : 'Place cursor here and scan with your barcode/QR scanner device, or type the code manually'
              }
              sx={{ mt: 2 }}
            />
            {scanning && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Scanning trolley...
                </Typography>
              </Box>
            )}
            <Box sx={{ p: 2, mt: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="caption" color="info.main">
                💡 Tip: The input is ready for scanning. Use your barcode/QR
                scanner device or type the code manually — it will be processed
                automatically.
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
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Operator Loading
        </Typography>
        <ActionButton
          label="Refresh"
          loadingLabel="Refresh"
          loading={syncing}
          icon={<RefreshIcon />}
          onClick={handleSyncWorkOrders}
          variant="contained"
          color="primary"
          size="small"
          sx={{ minWidth: 110 }}
        />
      </Box>

      <Paper sx={{ p: 3, mt: 3 }}>{renderMainScreen()}</Paper>

      <Alert
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />

      {/* Loading Dialog */}
      <Dialog
        open={showLoadingDialog}
        onClose={handleCancelLoading}
        maxWidth="md"
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
            <Typography variant="h6">Load Material onto Trolley</Typography>
            <IconButton onClick={handleCancelLoading} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>{renderLoadingDialogContent()}</DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={handleCancelLoading}
          >
            Cancel
          </Button>
          {scannedTrolley && (
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
          )}
        </DialogActions>
      </Dialog>

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
