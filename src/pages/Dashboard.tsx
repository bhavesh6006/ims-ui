import React, { useEffect, useState, useCallback } from 'react'
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
  Chip,
  IconButton,
  Collapse,
} from '@mui/material'
import {
  Inventory as InventoryIcon,
  LocalShipping as TrollyIcon,
  Assignment as WorkOrderIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material'
import api from '../services/api'
import { trollyService } from '../services/trollyService'
import workOrderService from '../services/workOrderService'

type ActiveCard = 'trollies' | 'materials' | 'workOrders' | null

interface DashboardStats {
  activeTrollies: number
  totalMaterials: number
  pendingWorkOrders: number
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

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data?.data ?? null))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false))
  }, [])

  const fetchList = useCallback(async (card: ActiveCard) => {
    if (!card) return
    setListLoading(true)
    setListData([])
    try {
      if (card === 'trollies') {
        const res = await trollyService.getAll(1, 1000, '')
        const items = (res as { data?: unknown[] }).data ?? (res as unknown[])
        setListData(
          Array.isArray(items) ? (items as Record<string, unknown>[]) : []
        )
      } else if (card === 'materials') {
        const res = await api.get('/dashboard/materials')
        const items = (res.data as { data?: unknown[] }).data ?? []
        setListData(
          Array.isArray(items) ? (items as Record<string, unknown>[]) : []
        )
      } else if (card === 'workOrders') {
        const res = await workOrderService.getAll({
          status: 'PENDING',
          limit: 1000,
        })
        const items =
          (res as { data?: { workOrders?: unknown[] } }).data?.workOrders ?? []
        setListData(items as Record<string, unknown>[])
      }
    } catch {
      setListData([])
    } finally {
      setListLoading(false)
    }
  }, [])

  const handleCardClick = (card: ActiveCard) => {
    if (activeCard === card) {
      setActiveCard(null)
      setListData([])
    } else {
      setActiveCard(card)
      fetchList(card)
    }
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
    if (listLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )
    }
    if (!listData.length) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No records found.
        </Typography>
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
              </TableCell>
              <TableCell>
                <strong>Condition</strong>
              </TableCell>
              <TableCell>
                <strong>Occupied</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listData.map((row, i) => (
              <TableRow key={String(row.trolley_id ?? i)} hover>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{String(row.trolley_code ?? '—')}</TableCell>
                <TableCell>{String(row.trolly_type ?? '—')}</TableCell>
                <TableCell>{String(row.trolly_condition ?? '—')}</TableCell>
                <TableCell>{row.is_occupied ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <Chip
                    label={String(row.status ?? '—')}
                    color={statusColor(String(row.status))}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
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
                <strong>Material Name</strong>
              </TableCell>
              <TableCell>
                <strong>Type</strong>
              </TableCell>
              <TableCell>
                <strong>Subtool</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Total Produced</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Consumed</strong>
              </TableCell>
              <TableCell align="right">
                <strong>In Stock</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listData.map((row, i) => (
              <TableRow key={String(row.material_id ?? i)} hover>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{String(row.material_code ?? '—')}</TableCell>
                <TableCell>{String(row.material_name ?? '—')}</TableCell>
                <TableCell>{String(row.material_type ?? '—')}</TableCell>
                <TableCell>{String(row.subtool_name ?? '—')}</TableCell>
                <TableCell align="right">
                  {String(row.total_quantity ?? 0)}
                </TableCell>
                <TableCell align="right">
                  {String(row.consumed_quantity ?? 0)}
                </TableCell>
                <TableCell align="right">
                  <strong>{String(row.in_stock_quantity ?? 0)}</strong>
                </TableCell>
                <TableCell>
                  <Chip
                    label={String(row.status ?? '—')}
                    color={statusColor(String(row.status))}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
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
            {listData.map((row, i) => (
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
            ))}
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
          <TableContainer sx={{ maxHeight: 480 }}>
            {renderTable()}
          </TableContainer>
        </Paper>
      </Collapse>
    </Box>
  )
}

export default Dashboard
