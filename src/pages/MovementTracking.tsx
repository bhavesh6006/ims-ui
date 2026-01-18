import React, { useState, useEffect, useCallback } from 'react'
import { MainLayout } from '../components/templates'
import {
  Box,
  Typography,
  Paper,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { DataTable, type Column } from '../components/organisms'
import { movementService } from '../services'
import type { InventoryMovement } from '../types'

const MovementTracking: React.FC = () => {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)

  const columns: Column[] = [
    {
      id: 'timestamp',
      label: 'Time',
      format: (value: string) => new Date(value).toLocaleString(),
    },
    { id: 'trollyId', label: 'Trolly ID' },
    {
      id: 'movementType',
      label: 'Movement',
    },
    { id: 'fromLocation', label: 'From' },
    { id: 'toLocation', label: 'To' },
    { id: 'quantity', label: 'Quantity' },
    {
      id: 'detectionMethod',
      label: 'Detected By',
    },
    { id: 'gateId', label: 'Gate/Antenna' },
  ]

  const loadMovements = useCallback(async () => {
    try {
      const response =
        filter === 'all'
          ? await movementService.getAll(1, 50)
          : await movementService.getByType(
              filter as 'Entry' | 'Exit' | 'Internal Transfer'
            )
      setMovements(response.data || [])
    } catch (error) {
      console.error('Failed to load movements:', error)
      setMovements([])
    }
  }, [filter])

  useEffect(() => {
    loadMovements()
  }, [loadMovements])

  useEffect(() => {
    let intervalId: number
    if (autoRefresh) {
      intervalId = window.setInterval(() => {
        loadMovements()
      }, 5000)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoRefresh, loadMovements])

  const stats = {
    entries: movements.filter((m) => m.movementType === 'Entry').length,
    exits: movements.filter((m) => m.movementType === 'Exit').length,
    transfers: movements.filter((m) => m.movementType === 'Internal Transfer')
      .length,
    activeTrollies: new Set(movements.map((m) => m.trollyId)).size,
  }

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4">Movement Tracking</Typography>
          <Chip
            icon={<RefreshIcon />}
            label={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            color={autoRefresh ? 'success' : 'default'}
            clickable
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 2,
            mb: 3,
          }}
        >
          <Paper sx={{ p: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Entries
            </Typography>
            <Typography variant="h4">{stats.entries}</Typography>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Exits
            </Typography>
            <Typography variant="h4">{stats.exits}</Typography>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Transfers
            </Typography>
            <Typography variant="h4">{stats.transfers}</Typography>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Active Trollies
            </Typography>
            <Typography variant="h4">{stats.activeTrollies}</Typography>
          </Paper>
        </Box>

        <Box sx={{ mb: 3 }}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, newFilter) => newFilter && setFilter(newFilter)}
            size="small"
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="Entry">Entry</ToggleButton>
            <ToggleButton value="Exit">Exit</ToggleButton>
            <ToggleButton value="Internal Transfer">Internal</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <DataTable
          columns={columns}
          data={movements}
          page={0}
          rowsPerPage={50}
          totalRows={movements.length}
          onPageChange={() => {}}
          onRowsPerPageChange={() => {}}
          showActions={false}
        />
      </Box>
    </MainLayout>
  )
}

export default MovementTracking
