import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Collapse,
  TextField,
  MenuItem,
} from '@mui/material'
import {
  Inventory as InventoryIcon,
  LocalShipping as TrollyIcon,
  Assignment as WorkOrderIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material'
import api from '../services/api'
import workOrderService from '../services/workOrderService'

type ActiveCard = 'trollies' | 'materials' | 'workOrders' | null

interface DashboardStats {
  activeTrollies: number
  totalMaterials: number
  pendingWorkOrders: number
}

interface CardPaging {
  page: number
  pageSize: number
  total: number
}

const statusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'success'
    case 'INACTIVE':
      return 'default'
    case 'PENDING':
      return 'warning'
    case 'IN_PROGRESS':
      return 'info'
    case 'COMPLETED':
      return 'success'
    case 'CLOSED':
      return 'default'
    default:
      return 'default'
  }
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [activeCard, setActiveCard] = useState<ActiveCard>(null)
  const [listData, setListData] = useState<Record<string, unknown>[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [paging, setPaging] = useState<
    Record<NonNullable<ActiveCard>, CardPaging>
  >({
    trollies: { page: 0, pageSize: 10, total: 0 },
    materials: { page: 0, pageSize: 10, total: 0 },
    workOrders: { page: 0, pageSize: 10, total: 0 },
  })
  const [trollyFilters, setTrollyFilters] = useState({
    occupied: '',
    type: '',
    location: '',
    subtool: '',
  })
  const [materialFilters, setMaterialFilters] = useState({
    type: '',
    location: '',
    subtool: '',
  })
  const trollyDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const materialDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data?.data ?? null))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false))
  }, [])

  const fetchList = useCallback(
    async (
      card: NonNullable<ActiveCard>,
      page: number,
      pageSize: number,
      filters: Record<string, string> = {}
    ) => {
      setListLoading(true)
      try {
        if (card === 'trollies') {
          const params = new URLSearchParams({
            page: String(page + 1),
            limit: String(pageSize),
          })
          Object.entries(filters).forEach(([k, v]) => {
            if (v) params.set(k, v)
          })
          const res = await api.get(`/dashboard/trollies?${params}`)
          const r = res.data as {
            data: Record<string, unknown>[]
            total: number
          }
          setListData(r.data ?? [])
          setPaging((p) => ({
            ...p,
            trollies: { page, pageSize, total: r.total ?? 0 },
          }))
        } else if (card === 'materials') {
          const params = new URLSearchParams({
            page: String(page + 1),
            limit: String(pageSize),
          })
          Object.entries(filters).forEach(([k, v]) => {
            if (v) params.set(k, v)
          })
          const res = await api.get(`/dashboard/materials?${params}`)
          const r = res.data as {
            data: Record<string, unknown>[]
            total: number
          }
          setListData(r.data ?? [])
          setPaging((p) => ({
            ...p,
            materials: { page, pageSize, total: r.total ?? 0 },
          }))
        } else if (card === 'workOrders') {
          const res = await workOrderService.getAll({
            status: 'PENDING',
            page: page + 1,
            limit: pageSize,
          })
          const r = (
            res as {
              data?: { workOrders?: Record<string, unknown>[]; total?: number }
            }
          ).data
          setListData(r?.workOrders ?? [])
          setPaging((p) => ({
            ...p,
            workOrders: { page, pageSize, total: r?.total ?? 0 },
          }))
        }
      } catch {
        setListData([])
      } finally {
        setListLoading(false)
      }
    },
    []
  )

  const handleCardClick = (card: ActiveCard) => {
    if (!card) return
    if (activeCard === card) {
      setActiveCard(null)
      setListData([])
    } else {
      setActiveCard(card)
      setListData([])
      const filters =
        card === 'trollies'
          ? trollyFilters
          : card === 'materials'
            ? materialFilters
            : {}
      fetchList(card, 0, paging[card].pageSize, filters)
    }
  }

  const handlePageChange = (_: unknown, newPage: number) => {
    if (!activeCard) return
    const filters =
      activeCard === 'trollies'
        ? trollyFilters
        : activeCard === 'materials'
          ? materialFilters
          : {}
    fetchList(activeCard, newPage, paging[activeCard].pageSize, filters)
  }

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeCard) return
    const filters =
      activeCard === 'trollies'
        ? trollyFilters
        : activeCard === 'materials'
          ? materialFilters
          : {}
    fetchList(activeCard, 0, parseInt(e.target.value, 10), filters)
  }

  const handleTrollyFilter = (field: string, value: string) => {
    const newFilters = { ...trollyFilters, [field]: value }
    setTrollyFilters(newFilters)
    if (trollyDebounce.current) clearTimeout(trollyDebounce.current)
    trollyDebounce.current = setTimeout(() => {
      fetchList('trollies', 0, paging.trollies.pageSize, newFilters)
    }, 400)
  }

  const handleMaterialFilter = (field: string, value: string) => {
    const newFilters = { ...materialFilters, [field]: value }
    setMaterialFilters(newFilters)
    if (materialDebounce.current) clearTimeout(materialDebounce.current)
    materialDebounce.current = setTimeout(() => {
      fetchList('materials', 0, paging.materials.pageSize, newFilters)
    }, 400)
  }

  const cards = [
    {
      key: 'trollies' as ActiveCard,
      title: 'Carts',
      value: stats?.activeTrollies ?? '—',
      icon: <TrollyIcon fontSize="large" />,
      color: '#1976d2',
    },
    {
      key: 'materials' as ActiveCard,
      title: 'Materials',
      value: stats?.totalMaterials ?? '—',
      icon: <InventoryIcon fontSize="large" />,
      color: '#2e7d32',
    },
    {
      key: 'workOrders' as ActiveCard,
      title: 'Pending Work Orders',
      value: stats?.pendingWorkOrders ?? '—',
      icon: <WorkOrderIcon fontSize="large" />,
      color: '#ed6c02',
    },
  ]

  const renderTable = () => {
    if (listLoading && listData.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )
    }

    if (activeCard === 'trollies') {
      return (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell>
                <strong>#</strong>
              </TableCell>
              <TableCell>
                <strong>Cart Code</strong>
              </TableCell>
              <TableCell>
                <strong>Type</strong>
                <TextField
                  size="small"
                  placeholder="Filter…"
                  value={trollyFilters.type}
                  onChange={(e) => handleTrollyFilter('type', e.target.value)}
                  variant="outlined"
                  sx={{ mt: 0.5, display: 'block' }}
                  inputProps={{
                    style: { padding: '3px 6px', fontSize: '0.75rem' },
                  }}
                />
              </TableCell>
              <TableCell>
                <strong>Condition</strong>
              </TableCell>
              <TableCell>
                <strong>Occupied</strong>
                <TextField
                  select
                  size="small"
                  value={trollyFilters.occupied}
                  onChange={(e) =>
                    handleTrollyFilter('occupied', e.target.value)
                  }
                  sx={{
                    mt: 0.5,
                    display: 'block',
                    minWidth: 70,
                    '& .MuiInputBase-input': { py: '3px', fontSize: '0.75rem' },
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </TextField>
              </TableCell>
              <TableCell>
                <strong>Location</strong>
                <TextField
                  size="small"
                  placeholder="Filter…"
                  value={trollyFilters.location}
                  onChange={(e) =>
                    handleTrollyFilter('location', e.target.value)
                  }
                  variant="outlined"
                  sx={{ mt: 0.5, display: 'block' }}
                  inputProps={{
                    style: { padding: '3px 6px', fontSize: '0.75rem' },
                  }}
                />
              </TableCell>
              <TableCell>
                <strong>Subtool / Material</strong>
                <TextField
                  size="small"
                  placeholder="Filter…"
                  value={trollyFilters.subtool}
                  onChange={(e) =>
                    handleTrollyFilter('subtool', e.target.value)
                  }
                  variant="outlined"
                  sx={{ mt: 0.5, display: 'block' }}
                  inputProps={{
                    style: { padding: '3px 6px', fontSize: '0.75rem' },
                  }}
                />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ py: 3, color: 'text.secondary' }}
                >
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              listData.map((row, i) => (
                <TableRow key={String(row.trolley_id ?? i)} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{String(row.trolley_code ?? '—')}</TableCell>
                  <TableCell>{String(row.trolly_type ?? '—')}</TableCell>
                  <TableCell>{String(row.trolly_condition ?? '—')}</TableCell>
                  <TableCell>{row.is_occupied ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{String(row.location_name ?? '—')}</TableCell>
                  <TableCell>{String(row.subtool ?? '—')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )
    }

    if (activeCard === 'materials') {
      return (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell>
                <strong>#</strong>
              </TableCell>
              <TableCell>
                <strong>Material Code</strong>
              </TableCell>
              <TableCell>
                <strong>Type</strong>
                <TextField
                  size="small"
                  placeholder="Filter…"
                  value={materialFilters.type}
                  onChange={(e) => handleMaterialFilter('type', e.target.value)}
                  variant="outlined"
                  sx={{ mt: 0.5, display: 'block' }}
                  inputProps={{
                    style: { padding: '3px 6px', fontSize: '0.75rem' },
                  }}
                />
              </TableCell>
              <TableCell>
                <strong>Subtool</strong>
                <TextField
                  size="small"
                  placeholder="Filter…"
                  value={materialFilters.subtool}
                  onChange={(e) =>
                    handleMaterialFilter('subtool', e.target.value)
                  }
                  variant="outlined"
                  sx={{ mt: 0.5, display: 'block' }}
                  inputProps={{
                    style: { padding: '3px 6px', fontSize: '0.75rem' },
                  }}
                />
              </TableCell>
              <TableCell>
                <strong>Location</strong>
                <TextField
                  size="small"
                  placeholder="Filter…"
                  value={materialFilters.location}
                  onChange={(e) =>
                    handleMaterialFilter('location', e.target.value)
                  }
                  variant="outlined"
                  sx={{ mt: 0.5, display: 'block' }}
                  inputProps={{
                    style: { padding: '3px 6px', fontSize: '0.75rem' },
                  }}
                />
              </TableCell>
              <TableCell>
                <strong>Door Color</strong>
              </TableCell>
              <TableCell>
                <strong>Handle</strong>
              </TableCell>
              <TableCell>
                <strong>Micom</strong>
              </TableCell>
              <TableCell>
                <strong>Lock Type</strong>
              </TableCell>
              <TableCell>
                <strong>Disp Type</strong>
              </TableCell>
              <TableCell>
                <strong>In Stock</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  align="center"
                  sx={{ py: 3, color: 'text.secondary' }}
                >
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              listData.map((row, i) => (
                <TableRow key={`${String(row.material_code)}_${i}`} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{String(row.material_code ?? '—')}</TableCell>
                  <TableCell>{String(row.material_type ?? '—')}</TableCell>
                  <TableCell>{String(row.subtool_name ?? '—')}</TableCell>
                  <TableCell>{String(row.location_name ?? '—')}</TableCell>
                  <TableCell>{String(row.door_colour ?? '—')}</TableCell>
                  <TableCell>{String(row.handle ?? '—')}</TableCell>
                  <TableCell>{String(row.micom ?? '—')}</TableCell>
                  <TableCell>{String(row.lock_type ?? '—')}</TableCell>
                  <TableCell>{String(row.disp_type ?? '—')}</TableCell>
                  <TableCell>
                    <strong>{String(row.in_stock_quantity ?? 0)}</strong>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )
    }

    if (activeCard === 'workOrders') {
      return (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell>
                <strong>#</strong>
              </TableCell>
              <TableCell>
                <strong>Work Order No.</strong>
              </TableCell>
              <TableCell>
                <strong>Tool</strong>
              </TableCell>
              <TableCell>
                <strong>Sub Tool</strong>
              </TableCell>
              <TableCell>
                <strong>Date</strong>
              </TableCell>
              <TableCell>
                <strong>Planned</strong>
              </TableCell>
              <TableCell>
                <strong>Remaining</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{ py: 3, color: 'text.secondary' }}
                >
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              listData.map((row, i) => (
                <TableRow key={String(row.id ?? i)} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{String(row.work_order_number ?? '—')}</TableCell>
                  <TableCell>{String(row.tool ?? '—')}</TableCell>
                  <TableCell>{String(row.sub_tool ?? '—')}</TableCell>
                  <TableCell>{String(row.date ?? '—')}</TableCell>
                  <TableCell>{String(row.input_plan ?? '—')}</TableCell>
                  <TableCell>{String(row.balance_quantity ?? '—')}</TableCell>
                  <TableCell>
                    <Chip
                      label={String(row.status ?? '—')}
                      color={statusColor(String(row.status))}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )
    }

    return null
  }

  const activeCardMeta = cards.find((c) => c.key === activeCard)

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        IMS Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        RFID/BLE-based Inventory Management System
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 3,
          mt: 2,
        }}
      >
        {cards.map((card) => (
          <Paper
            key={card.key}
            onClick={() => handleCardClick(card.key)}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: card.color,
              color: 'white',
              cursor: 'pointer',
              outline:
                activeCard === card.key
                  ? '3px solid rgba(255,255,255,0.8)'
                  : 'none',
              transition: 'transform 0.1s, box-shadow 0.1s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
            }}
          >
            <Box sx={{ mb: 1 }}>
              {statsLoading ? (
                <CircularProgress size={32} sx={{ color: 'white' }} />
              ) : (
                card.icon
              )}
            </Box>
            <Typography variant="h4" component="div">
              {statsLoading ? '…' : card.value}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {card.title}
            </Typography>
            <IconButton size="small" sx={{ color: 'white', mt: 1, p: 0 }}>
              {activeCard === card.key ? (
                <ExpandLessIcon />
              ) : (
                <ExpandMoreIcon />
              )}
            </IconButton>
          </Paper>
        ))}
      </Box>

      <Collapse in={activeCard !== null} unmountOnExit>
        <Paper sx={{ mt: 3, p: 0, overflow: 'hidden' }}>
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: activeCardMeta?.color ?? '#1976d2',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="h6">{activeCardMeta?.title} List</Typography>
          </Box>
          <TableContainer sx={{ maxHeight: 440 }}>
            {renderTable()}
          </TableContainer>
          {activeCard && (
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={paging[activeCard].total}
              rowsPerPage={paging[activeCard].pageSize}
              page={paging[activeCard].page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          )}
        </Paper>
      </Collapse>
    </Box>
  )
}

export default Dashboard
