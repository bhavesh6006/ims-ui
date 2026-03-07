import React, { useMemo } from 'react'
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
import { getAccessibleRoutes, normalizeRole } from '../../utils/permissions'
import { UserRole } from '../../types/auth.types'

const drawerWidth = 240

interface MenuItem {
  text: string
  icon: React.ReactElement
  path: string
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  {
    text: 'Cart Master',
    icon: <LocalShippingIcon />,
    path: '/trolly-master',
  },
  {
    text: 'Material Master',
    icon: <InventoryIcon />,
    path: '/material-master',
  },
  {
    text: 'Cart-Material Mapping',
    icon: <CategoryIcon />,
    path: '/trolly-material-mapping',
  },
  {
    text: 'Store Location',
    icon: <LocationOnIcon />,
    path: '/store-location-master',
  },
  {
    text: 'Device Master',
    icon: <LocalShippingIcon />,
    path: '/device-master',
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
    text: 'PRODUCTION - Cart Loading',
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

const getUserRole = (): UserRole | null => {
  try {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      return user?.role ? normalizeRole(user.role) : null
    }
    return null
  } catch {
    return null
  }
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const role = getUserRole()

  const accessibleRoutes = useMemo(() => {
    if (!role) return []
    return getAccessibleRoutes(role)
  }, [role])

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => accessibleRoutes.includes(item.path))
  }, [accessibleRoutes])

  const filteredSettingsItems = useMemo(() => {
    return settingsItems.filter((item) => accessibleRoutes.includes(item.path))
  }, [accessibleRoutes])

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
        {filteredMenuItems.map((item) => (
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
      {filteredSettingsItems.length > 0 && (
        <>
          <Divider />
          <List>
            {filteredSettingsItems.map((item) => (
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
        </>
      )}
    </Drawer>
  )
}

export default Sidebar
