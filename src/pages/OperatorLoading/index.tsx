import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Typography, Paper } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import moment from 'moment-timezone'
import {
  trollyService,
  mappingService,
  materialStockService,
  workOrderService,
  materialService,
} from '../../services'
import { Alert } from '../../components/molecules'
import { ActionButton } from '../../components/atoms'
import type { Trolly } from '../../types'
import type {
  WorkOrderResponse,
  WorkOrderListResponse,
} from '../../services/workOrderService'
import type { MaterialStockEntry } from './types'
import WorkOrderTable from './WorkOrderTable'
import LoadingDialog from './LoadingDialog'
import EditRecordDialog from './EditRecordDialog'

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
  const [mappedQuantity, setMappedQuantity] = useState(0)
  const [showLoadingDialog, setShowLoadingDialog] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [materialStockEntries, setMaterialStockEntries] = useState<
    MaterialStockEntry[]
  >([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [dialogMessage, setDialogMessage] = useState<{
    text: string
    severity: 'success' | 'error' | 'info' | 'warning'
  } | null>(null)
  const [lastRefreshDate, setLastRefreshDate] = useState<string>('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MaterialStockEntry | null>(
    null
  )
  const [originalEditQuantity, setOriginalEditQuantity] = useState<
    number | null
  >(null)

  const trolleyInputRef = useRef<HTMLInputElement>(null)
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const convertToLocalTime = (utcTimestamp: string): string => {
    return moment(utcTimestamp)
      .tz('Asia/Calcutta')
      .format('YYYY-MM-DD hh:mm:ss A')
  }

  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true)
      await fetchLastRefreshDate()
      const response = await workOrderService.getAll({ page: 1, limit: 10000 })
      if (response.success && response.data) {
        const workOrderData = response.data as WorkOrderListResponse
        setOperatorWorkOrders(workOrderData.workOrders)
      }
    } catch {
      showAlert('Failed to load work orders', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLastRefreshDate = async () => {
    try {
      const response = await workOrderService.getLastRefreshDate()
      const refreshTimestamp = response?.last_refresh
        ? convertToLocalTime(response.last_refresh)
        : ''
      setLastRefreshDate(refreshTimestamp)
    } catch (error) {
      console.error('Failed to fetch last refresh date:', error)
    }
  }

  useEffect(() => {
    fetchWorkOrders()
    fetchLastRefreshDate()
  }, [fetchWorkOrders])
  useEffect(() => {
    setPage(0)
  }, [activeTab])

  const getFilteredWorkOrders = useCallback(() => {
    let filtered = operatorWorkOrders
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
    return filtered
  }, [operatorWorkOrders, activeTab])

  useEffect(() => {
    setTotal(getFilteredWorkOrders().length)
  }, [getFilteredWorkOrders])

  const handleSelectWorkOrder = async (
    workOrder: WorkOrderResponse,
    isClosed: boolean
  ) => {
    setSelectedOperatorWO(workOrder)
    setShowLoadingDialog(true)
    settrolleyQRCode('')
    setMappedQuantity(0)
    setMaterialStockEntries([])
    setLoadingEntries(true)
    try {
      const response = await materialStockService.getByWorkOrder(workOrder.id)
      if (response.success && response.data) {
        setMaterialStockEntries(
          response.data.sort(
            (a, b) =>
              new Date(b.loaded_at || '').getTime() -
              new Date(a.loaded_at || '').getTime()
          )
        )
      }
    } catch (error) {
      console.error('Failed to load material stock entries:', error)
    } finally {
      setLoadingEntries(false)
    }
    if (!isClosed) setTimeout(() => trolleyInputRef.current?.focus(), 300)
  }

  const handleCancelLoading = () => {
    setShowLoadingDialog(false)
    setSelectedOperatorWO(null)
    settrolleyQRCode('')
    setMappedQuantity(0)
    setDialogMessage(null)
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
        setMappedQuantity(response.data.max_quantity)
        setDialogMessage({
          text: `Mapping found: Max ${response.data.max_quantity} units for ${response.data.trolleyType?.trolly_type}`,
          severity: 'success',
        })
        return { success: true, maxQuantity: response.data.max_quantity }
      } else {
        setDialogMessage({
          text: 'No mapping found for this material-cart type combination',
          severity: 'error',
        })
        setMappedQuantity(0)
        setTimeout(() => trolleyInputRef.current?.focus(), 100)
        return { success: false, maxQuantity: 0 }
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error.response as { data?: { message?: string } })?.data
              ?.message ||
            'No mapping found for this material-cart type combination'
          : 'No mapping found for this material-cart type combination'
      setDialogMessage({ text: errorMessage, severity: 'error' })
      setMappedQuantity(0)
      setTimeout(() => trolleyInputRef.current?.focus(), 100)
      return { success: false, maxQuantity: 0, errorMessage }
    }
  }

  const updateWorkOrderQuantitiesAndStatus = useCallback(async () => {
    if (!selectedOperatorWO) return
    const balanced =
      selectedOperatorWO.input_plan - selectedOperatorWO.output_plan

    let newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' =
      selectedOperatorWO.status

    if (balanced <= 0) {
      newStatus = 'CLOSED'
    } else if (balanced > 0) {
      newStatus = 'IN_PROGRESS'
    } else {
      newStatus = 'PENDING'
    }

    await workOrderService.update(selectedOperatorWO.id, {
      status: newStatus,
      output_plan: selectedOperatorWO.output_plan,
    })
    setSelectedOperatorWO({ ...selectedOperatorWO, status: newStatus })
    showAlert(`Work order updated: Status - ${newStatus}`, 'success')

    if (selectedOperatorWO.status === 'CLOSED' && newStatus === 'IN_PROGRESS') {
      handleCancelLoading()
      await fetchWorkOrders()
    }
  }, [selectedOperatorWO, fetchWorkOrders])

  const processTrolleyScan = useCallback(
    async (code: string): Promise<void> => {
      if (!code.trim() || !selectedOperatorWO) return
      setScanning(true)
      setDialogMessage(null)
      try {
        const trolleyResponse = await trollyService.scan(code)
        const trolleyData = (trolleyResponse.data.data ||
          trolleyResponse.data) as Trolly
        if (!trolleyData) {
          setDialogMessage({
            text: `Cart/Container not found with ID: ${code}`,
            severity: 'error',
          })
          setTimeout(() => trolleyInputRef.current?.focus(), 100)
          setScanning(false)
          return
        }
        if (trolleyData.is_occupied) {
          setDialogMessage({
            text: `Cart/Container already occupied with ID: ${code}`,
            severity: 'error',
          })
          setTimeout(() => trolleyInputRef.current?.focus(), 100)
          setScanning(false)
          return
        }
        const trolleyTypeId = trolleyData.trolly_type_id
        if (selectedOperatorWO?.sub_tool && trolleyTypeId) {
          try {
            const materialResponse = await materialService.getByCode(
              selectedOperatorWO.sub_tool
            )
            const materialData =
              materialResponse.data?.material_id || materialResponse.material_id
            if (materialData) {
              const { success, maxQuantity } =
                await fetchMaterialTrolleyMapping(
                  String(materialData),
                  String(trolleyTypeId)
                )
              if (!success || maxQuantity <= 0) {
                setScanning(false)
                return
              }
              const materialStockPayload: MaterialStockEntry = {
                trolley_code: trolleyData.trolley_code,
                material_code: selectedOperatorWO.sub_tool,
                quantity: maxQuantity,
                loading_type: 'FULL',
                status: 'IN_STOCK',
                loaded_at: new Date().toISOString(),
                remarks: `Loaded in cart ${trolleyData.trolley_code} (${trolleyData.trolly_type})`,
                work_order_id: selectedOperatorWO.id,
                work_order_number: selectedOperatorWO.work_order_number,
                loaded_by: 'current-user-id',
              }
              const saveResponse =
                await materialStockService.createStock(materialStockPayload)
              if (saveResponse.success) {
                setMaterialStockEntries((prevEntries) =>
                  [
                    ...[
                      {
                        ...materialStockPayload,
                        trolley_qr_code: code,
                        id: saveResponse.data.id,
                      },
                      ...prevEntries,
                    ],
                  ].sort(
                    (a, b) =>
                      new Date(b.loaded_at || '').getTime() -
                      new Date(a.loaded_at || '').getTime()
                  )
                )
                await trollyService.update(trolleyData.trolley_id, {
                  is_occupied: true,
                  trolley_code: trolleyData.trolley_code,
                  qr_code: trolleyData.qr_code,
                })
                selectedOperatorWO.output_plan += maxQuantity
                await updateWorkOrderQuantitiesAndStatus()
                showAlert('Cart loaded successfully', 'success')
                settrolleyQRCode('')
                setTimeout(() => trolleyInputRef.current?.focus(), 100)
              } else {
                showAlert('Failed to save cart record', 'error')
              }
            } else {
              setDialogMessage({
                text: `Material not found for code: ${selectedOperatorWO.sub_tool}`,
                severity: 'error',
              })
              setTimeout(() => trolleyInputRef.current?.focus(), 100)
            }
          } catch {
            setDialogMessage({
              text: 'Failed to fetch material details or material not found',
              severity: 'error',
            })
            setTimeout(() => trolleyInputRef.current?.focus(), 100)
          }
        } else {
          setDialogMessage({
            text: 'Missing material code or cart type information',
            severity: 'error',
          })
          setTimeout(() => trolleyInputRef.current?.focus(), 100)
        }
      } catch {
        setDialogMessage({
          text: `Cart/Container not found with ID: ${code}`,
          severity: 'error',
        })
        setTimeout(() => trolleyInputRef.current?.focus(), 100)
      } finally {
        setScanning(false)
      }
    },
    [selectedOperatorWO, updateWorkOrderQuantitiesAndStatus]
  )

  const handleTrolleyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    settrolleyQRCode(value)
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current)
    if (value.trim())
      scanTimeoutRef.current = setTimeout(() => processTrolleyScan(value), 500)
  }

  const handleTrolleyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && trolleyQRCode.trim()) {
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current)
      processTrolleyScan(trolleyQRCode)
    }
  }

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current)
    }
  }, [])

  const handleEditPartialQuantityChange = (value: string) => {
    const numericValue = Number(value)
    if (numericValue >= mappedQuantity) {
      showAlert(`Partial quantity must be less than ${mappedQuantity}`, 'error')
      return
    }
    setEditingRecord((prev) =>
      prev ? { ...prev, quantity: value ? numericValue : null } : prev
    )
  }

  const handleEditLoadingTypeChange = (loadingType: 'FULL' | 'PARTIAL') => {
    setEditingRecord((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        loading_type: loadingType,
        quantity: loadingType === 'FULL' ? mappedQuantity : null,
      }
    })
  }

  const handleEditRecord = async (record: MaterialStockEntry) => {
    setEditingRecord(record)
    setOriginalEditQuantity(record.quantity)
    // Don't open dialog yet — wait for mapping to load first
    try {
      const materialResponse = await materialService.getByCode(
        selectedOperatorWO?.sub_tool || ''
      )
      const materialData =
        materialResponse.data?.material_id || materialResponse.material_id
      const trolleyResponse = await trollyService.scan(record.trolley_code)
      const trolleyData =
        trolleyResponse.data && (trolleyResponse.data.data as Trolly)
      if (materialData && trolleyData?.trolly_type_id) {
        const { success, maxQuantity } = await fetchMaterialTrolleyMapping(
          String(materialData),
          String(trolleyData.trolly_type_id)
        )
        if (success && maxQuantity) setMappedQuantity(maxQuantity)
      }
    } catch (error) {
      console.error('Failed to fetch mapping on edit dialog open:', error)
    } finally {
      // Open dialog only after mappedQuantity is set
      setEditDialogOpen(true)
    }
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setEditingRecord(null)
  }

  const handleSaveEditedRecord = async (updatedRecord: MaterialStockEntry) => {
    try {
      if (updatedRecord.loading_type === 'PARTIAL' && !updatedRecord.quantity) {
        showAlert('Quantity cannot be empty for partial loading', 'error')
        return
      }

      if (!selectedOperatorWO) {
        showAlert('No work order selected', 'error')
        return
      }

      const finalQuantity =
        updatedRecord.loading_type === 'FULL'
          ? mappedQuantity
          : updatedRecord.quantity!

      const quantityDiff = finalQuantity - (originalEditQuantity || 0)

      if (quantityDiff !== 0) {
        selectedOperatorWO.output_plan += quantityDiff
      }

      const updateResponse = await materialStockService.updateStock(
        updatedRecord.id!.toString(),
        {
          quantity: finalQuantity,
          loading_type: updatedRecord.loading_type,
        }
      )

      if (updateResponse.success) {
        const finalRecord = { ...updatedRecord, quantity: finalQuantity }
        setMaterialStockEntries((prevEntries) =>
          prevEntries.map((entry) =>
            entry.id === updatedRecord.id ? finalRecord : entry
          )
        )
        if (quantityDiff !== 0) {
          await updateWorkOrderQuantitiesAndStatus()
        }
        showAlert('Record updated successfully', 'success')
      } else {
        showAlert('Failed to update record', 'error')
      }
    } catch (error) {
      showAlert('Failed to update record', 'error')
      console.error('Edit record error:', error)
    } finally {
      handleCloseEditDialog()
    }
  }

  const handleSyncWorkOrders = async () => {
    setSyncing(true)
    try {
      await workOrderService.getRefreshSummary()
      await fetchWorkOrders()
      showAlert('Work orders refreshed successfully', 'success')
    } catch {
      showAlert('Failed to sync work orders', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const filteredOrders = getFilteredWorkOrders()
  const paginatedOrders = filteredOrders.slice(
    page * pageSize,
    (page + 1) * pageSize
  )

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
          PRODUCTION - Cart Loading
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {lastRefreshDate && (
            <Typography variant="body2" sx={{ ml: 2 }} color="text.secondary">
              Last refreshed: {new Date(lastRefreshDate).toLocaleString()}
            </Typography>
          )}
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
      </Box>

      <Paper sx={{ p: 3, mt: 3 }}>
        <WorkOrderTable
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          loading={loading}
          paginatedOrders={paginatedOrders}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onSelectWorkOrder={handleSelectWorkOrder}
        />
      </Paper>

      <Alert
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />

      <LoadingDialog
        open={showLoadingDialog}
        activeTab={activeTab}
        selectedOperatorWO={selectedOperatorWO}
        trolleyQRCode={trolleyQRCode}
        scanning={scanning}
        loadingEntries={loadingEntries}
        materialStockEntries={materialStockEntries}
        dialogMessage={dialogMessage}
        trolleyInputRef={trolleyInputRef}
        convertToLocalTime={convertToLocalTime}
        onTrolleyInputChange={handleTrolleyInputChange}
        onTrolleyKeyDown={handleTrolleyKeyDown}
        onEditRecord={handleEditRecord}
        onClose={handleCancelLoading}
        onClearDialogMessage={() => setDialogMessage(null)}
      />

      <EditRecordDialog
        open={editDialogOpen}
        editingRecord={editingRecord}
        mappedQuantity={mappedQuantity}
        onLoadingTypeChange={handleEditLoadingTypeChange}
        onPartialQuantityChange={handleEditPartialQuantityChange}
        onSave={handleSaveEditedRecord}
        onClose={handleCloseEditDialog}
      />
    </Box>
  )
}

export default OperatorLoading
