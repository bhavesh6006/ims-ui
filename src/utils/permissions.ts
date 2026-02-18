import { UserRole } from '../types/auth.types'

// Pages where Store Manager can perform edit (create/update/delete) operations
export const EDITABLE_PAGES_STORE_MANAGER = [
  '/',
  '/dashboard',
  '/trolly-master',
  '/material-master',
  '/trolly-material-mapping',
]

// All pages accessible in the system
export const ALL_PAGES = [
  '/',
  '/dashboard',
  '/profile',
  '/device-master',
  '/material-master',
  '/rfid-antenna-master',
  '/store-location-master',
  '/trolly-master',
  '/trolly-material-mapping',
  '/movement-tracking',
  '/operator-loading',
  '/user-management',
  '/reports',
]

// Pages Store Manager can access (view or edit)
export const STORE_MANAGER_PAGES = [
  '/',
  '/dashboard',
  '/profile',
  '/trolly-master',
  '/material-master',
  '/trolly-material-mapping',
]

// Operator can only access these pages
export const OPERATOR_PAGES = [
  '/',
  '/dashboard',
  '/profile',
  '/operator-loading',
]

// --- Page-level permissions ---

/**
 * Normalize a role string from localStorage/API to a UserRole enum value.
 * Handles case differences like "Operator" vs "OPERATOR" vs "operator".
 */
export const normalizeRole = (role: string): UserRole | null => {
  const lower = role.toLowerCase().trim()
  if (lower === 'admin') return UserRole.ADMIN
  if (
    lower === 'store_manager' ||
    lower === 'store manager' ||
    lower === 'storemanager'
  )
    return UserRole.STORE_MANAGER
  if (lower === 'operator') return UserRole.OPERATOR
  return null
}

const pathMatches = (currentPath: string, page: string): boolean => {
  // For root path '/', use exact match to avoid matching everything
  if (page === '/') {
    return currentPath === '/'
  }
  return currentPath.startsWith(page)
}

export const canEdit = (role: UserRole, currentPath: string): boolean => {
  if (role === UserRole.ADMIN) {
    return true
  }

  if (role === UserRole.STORE_MANAGER) {
    return EDITABLE_PAGES_STORE_MANAGER.some((page) =>
      pathMatches(currentPath, page)
    )
  }

  if (role === UserRole.OPERATOR) {
    return OPERATOR_PAGES.some((page) => pathMatches(currentPath, page))
  }

  return false
}

export const canView = (role: UserRole, currentPath: string): boolean => {
  if (role === UserRole.ADMIN) {
    return true
  }

  if (role === UserRole.STORE_MANAGER) {
    return STORE_MANAGER_PAGES.some((page) => pathMatches(currentPath, page))
  }

  if (role === UserRole.OPERATOR) {
    return OPERATOR_PAGES.some((page) => pathMatches(currentPath, page))
  }

  return false
}

export const getAccessibleRoutes = (role: UserRole): string[] => {
  switch (role) {
    case UserRole.ADMIN:
      return ALL_PAGES // All routes
    case UserRole.STORE_MANAGER:
      return STORE_MANAGER_PAGES
    case UserRole.OPERATOR:
      return OPERATOR_PAGES
    default:
      return []
  }
}

// --- API-level permissions ---

// Mapping: API endpoint patterns to the page they belong to
// Note: URLs are relative to baseURL, so they don't include /api/ prefix
// Order matters: more specific patterns must come before generic ones
const API_TO_PAGE_MAP: { pattern: RegExp; page: string }[] = [
  // Operator Loading / Work Orders
  { pattern: /^\/work-orders/i, page: '/operator-loading' },
  { pattern: /^\/loading/i, page: '/operator-loading' },

  // Material stock accessed from operator loading (must come before generic /material-stock)
  { pattern: /^\/material-stock\/work-order/i, page: '/operator-loading' },
  { pattern: /^\/trolly-types/i, page: '/operator-loading' },
  { pattern: /^\/trollies/i, page: '/operator-loading' },
  { pattern: /^\/trolley-material-mapping/i, page: '/operator-loading' },

  // Trolley-Material Mapping (must come before /trolly and /material)
  { pattern: /^\/trolley-material-mapping/i, page: '/trolly-material-mapping' },
  { pattern: /^\/mappings/i, page: '/trolly-material-mapping' },

  // Material Stock (must come before /material)
  { pattern: /^\/material-stock/i, page: '/material-master' },

  // Material Types (must come before /material)
  { pattern: /^\/material-types/i, page: '/material-master' },

  // Materials
  { pattern: /^\/materials/i, page: '/material-master' },

  // Trolley Conditions (must come before /trolly)
  { pattern: /^\/trolly-conditions/i, page: '/trolly-master' },

  // Trolley Types (must come before /trolly)
  { pattern: /^\/trolly-types/i, page: '/trolly-master' },

  // Subtools
  { pattern: /^\/subtools/i, page: '/trolly-master' },

  // Trollies
  { pattern: /^\/trollies/i, page: '/trolly-master' },

  // Devices
  { pattern: /^\/devices/i, page: '/device-master' },

  // RFID Antennas
  { pattern: /^\/antennas/i, page: '/rfid-antenna-master' },
  { pattern: /^\/rfid-antenna/i, page: '/rfid-antenna-master' },

  // Store Locations
  { pattern: /^\/store-locations/i, page: '/store-location-master' },

  // Movements
  { pattern: /^\/movements/i, page: '/movement-tracking' },

  // User Management
  { pattern: /^\/users/i, page: '/user-management' },
  { pattern: /^\/user-roles/i, page: '/user-management' },
  { pattern: /^\/user-role-mappings/i, page: '/user-management' },

  // Dashboard
  { pattern: /^\/dashboard/i, page: '/dashboard' },
]

// HTTP methods that are considered "write" (edit) operations
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

/**
 * Check if a given role is allowed to call a specific API endpoint with a given HTTP method.
 * Returns true if allowed, false if blocked.
 */
export const canAccessApi = (
  role: UserRole,
  url: string,
  method: string
): boolean => {
  // Admin can do everything
  if (role === UserRole.ADMIN) {
    return true
  }

  const matchedMapping = API_TO_PAGE_MAP.find((entry) =>
    entry.pattern.test(url)
  )

  // If no mapping found, block by default (deny unknown endpoints)
  if (!matchedMapping) {
    return false
  }

  const page = matchedMapping.page
  const isWriteOperation = WRITE_METHODS.includes(method.toUpperCase())

  if (isWriteOperation) {
    return canEdit(role, page)
  } else {
    return canView(role, page)
  }
}
