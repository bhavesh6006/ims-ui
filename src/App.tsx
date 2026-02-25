import { Suspense, lazy, useEffect } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  CircularProgress,
  Box,
} from '@mui/material'
import MainLayout from './components/templates/MainLayout'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/templates/ProtectedRoute'
import { setupAxiosInterceptors } from './utils/axiosInterceptor'
import Login from './pages/Login'
import { UserRole } from './types/auth.types'

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const TrollyMaster = lazy(() => import('./pages/TrollyMaster'))
const MaterialMaster = lazy(() => import('./pages/MaterialMaster'))
const TrollyMaterialMapping = lazy(
  () => import('./pages/TrollyMaterialMapping')
)
const StoreLocationMaster = lazy(() => import('./pages/StoreLocationMaster'))
const RFIDAntennaMaster = lazy(() => import('./pages/RFIDAntennaMaster'))
const OperatorLoading = lazy(() => import('./pages/OperatorLoading'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const DeviceMaster = lazy(() => import('./pages/DeviceMaster'))
const Profile = lazy(() => import('./pages/Profile'))

// Loading component
const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
)

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#A50034',
      light: '#c9144f',
      dark: '#8a002b',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#A50034',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: '#A50034',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#8a002b',
          },
        },
        outlined: {
          borderColor: '#A50034',
          color: '#A50034',
          '&:hover': {
            borderColor: '#8a002b',
            backgroundColor: 'rgba(165, 0, 52, 0.04)',
          },
        },
        text: {
          color: '#A50034',
          '&:hover': {
            backgroundColor: 'rgba(165, 0, 52, 0.04)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#A50034',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#A50034',
          color: '#ffffff',
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        colorPrimary: {
          color: '#A50034',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(165, 0, 52, 0.08)',
            borderRight: '3px solid #A50034',
            '& .MuiListItemIcon-root': {
              color: '#A50034',
            },
            '& .MuiListItemText-primary': {
              color: '#A50034',
              fontWeight: 600,
            },
            '&:hover': {
              backgroundColor: 'rgba(165, 0, 52, 0.12)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(165, 0, 52, 0.04)',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        primary: {
          backgroundColor: '#A50034',
          '&:hover': {
            backgroundColor: '#8a002b',
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '&.Mui-checked': {
            color: '#A50034',
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          '&.Mui-checked': {
            color: '#A50034',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: '#A50034',
            '& + .MuiSwitch-track': {
              backgroundColor: '#A50034',
            },
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
            {
              borderColor: '#A50034',
            },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#A50034',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#A50034',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: '#A50034',
          },
        },
      },
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
})

function App() {
  useEffect(() => {
    setupAxiosInterceptors()
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route
                            path="/"
                            element={<Navigate to="/dashboard" replace />}
                          />
                          <Route
                            path="/dashboard"
                            element={
                              <ProtectedRoute
                                allowedRoles={[
                                  UserRole.ADMIN,
                                  UserRole.STORE_MANAGER,
                                  UserRole.OPERATOR,
                                ]}
                              >
                                <Dashboard />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/profile"
                            element={
                              <ProtectedRoute
                                allowedRoles={[
                                  UserRole.ADMIN,
                                  UserRole.STORE_MANAGER,
                                  UserRole.OPERATOR,
                                ]}
                              >
                                <Profile />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/device-master"
                            element={
                              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                                <DeviceMaster />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/material-master"
                            element={
                              <ProtectedRoute
                                allowedRoles={[
                                  UserRole.ADMIN,
                                  UserRole.STORE_MANAGER,
                                ]}
                              >
                                <MaterialMaster />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/rfid-antenna-master"
                            element={
                              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                                <RFIDAntennaMaster />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/store-location-master"
                            element={
                              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                                <StoreLocationMaster />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/trolly-master"
                            element={
                              <ProtectedRoute
                                allowedRoles={[
                                  UserRole.ADMIN,
                                  UserRole.STORE_MANAGER,
                                ]}
                              >
                                <TrollyMaster />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/trolly-material-mapping"
                            element={
                              <ProtectedRoute
                                allowedRoles={[
                                  UserRole.ADMIN,
                                  UserRole.STORE_MANAGER,
                                ]}
                              >
                                <TrollyMaterialMapping />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/operator-loading"
                            element={
                              <ProtectedRoute
                                allowedRoles={[
                                  UserRole.OPERATOR,
                                  UserRole.ADMIN,
                                ]}
                              >
                                <OperatorLoading />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/user-management"
                            element={
                              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                                <UserManagement />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="*"
                            element={<Navigate to="/dashboard" replace />}
                          />
                        </Routes>
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
