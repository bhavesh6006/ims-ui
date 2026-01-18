import React, { Suspense, lazy } from 'react'
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
const MovementTracking = lazy(() => import('./pages/MovementTracking'))

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
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {/* Master Data Routes */}
            <Route path="/trolly-master" element={<TrollyMaster />} />
            <Route path="/material-master" element={<MaterialMaster />} />
            <Route
              path="/trolly-material-mapping"
              element={<TrollyMaterialMapping />}
            />
            <Route
              path="/store-location-master"
              element={<StoreLocationMaster />}
            />
            <Route
              path="/rfid-antenna-master"
              element={<RFIDAntennaMaster />}
            />
            {/* Operations Routes */}
            <Route path="/operator-loading" element={<OperatorLoading />} />
            <Route path="/movement-tracking" element={<MovementTracking />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  )
}

export default App
