import React from 'react'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import InventoryIcon from '@mui/icons-material/Inventory'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import PeopleIcon from '@mui/icons-material/People'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import CategoryIcon from '@mui/icons-material/Category'
import AssessmentIcon from '@mui/icons-material/Assessment'
import SettingsIcon from '@mui/icons-material/Settings'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { useNavigate, useLocation } from 'react-router-dom'

const drawerWidth = 240

interface MenuItem {
  text: string
  icon: React.ReactElement
  path: string
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  {
    text: 'Trolly Master',
    icon: <LocalShippingIcon />,
    path: '/trolly-master',
  },
  {
    text: 'Material Master',
    icon: <InventoryIcon />,
    path: '/material-master',
  },
  {
    text: 'Trolly-Material Mapping',
    icon: <CategoryIcon />,
    path: '/trolly-material-mapping',
  },
  {
    text: 'Store Location',
    icon: <LocationOnIcon />,
    path: '/store-location-master',
  },
  {
    text: 'RFID Antenna',
    icon: <SettingsIcon />,
    path: '/rfid-antenna-master',
  },
  {
    text: 'User Management',
    icon: <PeopleIcon />,
    path: '/user-management',
  },
  {
    text: 'Operator Loading',
    icon: <ShoppingCartIcon />,
    path: '/operator-loading',
  },
  {
    text: 'Movement Tracking',
    icon: <AssessmentIcon />,
    path: '/movement-tracking',
  },
]

const settingsItems: MenuItem[] = [
  { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigation = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        {settingsItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}

export default Sidebar
