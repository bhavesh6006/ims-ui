import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import {
  Inventory as InventoryIcon,
  LocalShipping as TrollyIcon,
  Assignment as WorkOrderIcon,
  TrendingUp as MovementIcon,
} from '@mui/icons-material'

const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Active Trollies',
      value: '45',
      icon: <TrollyIcon fontSize="large" />,
      color: '#1976d2',
    },
    {
      title: 'Materials',
      value: '128',
      icon: <InventoryIcon fontSize="large" />,
      color: '#2e7d32',
    },
    {
      title: 'Open Work Orders',
      value: '12',
      icon: <WorkOrderIcon fontSize="large" />,
      color: '#ed6c02',
    },
    {
      title: "Today's Movements",
      value: '87',
      icon: <MovementIcon fontSize="large" />,
      color: '#9c27b0',
    },
  ]

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
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: '1fr 1fr 1fr 1fr',
          },
          gap: 3,
          mt: 2,
        }}
      >
        {stats.map((stat) => (
          <Paper
            key={stat.title}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: stat.color,
              color: 'white',
            }}
          >
            <Box sx={{ mb: 1 }}>{stat.icon}</Box>
            <Typography variant="h4" component="div">
              {stat.value}
            </Typography>
            <Typography variant="body2">{stat.title}</Typography>
          </Paper>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mt: 2,
        }}
      >
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Movements
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time RFID/BLE tracking coming soon...
          </Typography>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            System Status
          </Typography>
          <Typography variant="body2" color="text.secondary">
            RFID antennas and gates status...
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}

export default Dashboard
