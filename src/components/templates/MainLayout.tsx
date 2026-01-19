import React, { useState } from 'react'
import { Box } from '@mui/material'
import { Navbar, Sidebar } from '../organisms'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar
        onMenuClick={handleSidebarToggle}
        title="Inventory Management System"
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          mt: 8,
          width: '100%',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default MainLayout
