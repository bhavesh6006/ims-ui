import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { DataTable, type Column } from '../components/organisms'
import { SearchBar, Alert } from '../components/molecules'
import {
  userService,
  userRoleService,
  userRoleMappingService,
} from '../services'
import type { User, UserRole, UserRoleMapping } from '../types/user'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
)

const UserManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<UserRole[]>([])
  const [mappings, setMappings] = useState<UserRoleMapping[]>([])

  // Separate pagination state for each tab
  const [userPagination, setUserPagination] = useState({
    page: 0,
    pageSize: 10,
  })
  const [rolePagination, setRolePagination] = useState({
    page: 0,
    pageSize: 10,
  })
  const [mappingPagination, setMappingPagination] = useState({
    page: 0,
    pageSize: 10,
  })

  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const [userForm, setUserForm] = useState({
    ldap_username: '',
    display_name: '',
    email: '',
    is_active: true,
  })

  const [roleForm, setRoleForm] = useState({
    role_name: '',
  })

  const [mappingForm, setMappingForm] = useState({
    user_id: '',
    role_id: '',
  })

  const userColumns: Column[] = [
    { id: 'ldap_username', label: 'Username' },
    { id: 'display_name', label: 'Display Name' },
    { id: 'email', label: 'Email' },
    {
      id: 'is_active',
      label: 'Status',
      format: (value: unknown) => {
        return value ? 'Active' : 'Inactive'
      },
    },
  ]

  const roleColumns: Column[] = [{ id: 'role_name', label: 'Role Name' }]

  const mappingColumns: Column[] = [
    {
      id: 'user_id',
      label: 'User',
      format: (value: unknown) => {
        const user = users.find((u) => u.user_id === value)
        return user?.display_name || String(value)
      },
    },
    {
      id: 'role_id',
      label: 'Role',
      format: (value: unknown) => {
        const role = roles.find((r) => r.role_id === value)
        return role?.role_name || String(value)
      },
    },
  ]

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadUsers = useCallback(async () => {
    try {
      const response = await userService.getAll(
        userPagination.page + 1,
        userPagination.pageSize,
        search
      )
      setUsers(response.data)
      setTotal(response.count)
    } catch {
      showAlert('Failed to load users', 'error')
    }
  }, [userPagination.page, userPagination.pageSize, search])

  const loadRoles = useCallback(async () => {
    try {
      const response = await userRoleService.getAll()
      setRoles(response.data)
    } catch {
      showAlert('Failed to load roles', 'error')
    }
  }, [])

  const loadMappings = useCallback(async () => {
    try {
      const response = await userRoleMappingService.getAll()
      setMappings(response.data)
    } catch {
      showAlert('Failed to load mappings', 'error')
    }
  }, [])

  useEffect(() => {
    loadUsers()
    loadRoles()
    loadMappings()
  }, [loadUsers, loadRoles, loadMappings])

  const handleAddUser = () => {
    setEditingItem(null)
    setUserForm({
      ldap_username: '',
      display_name: '',
      email: '',
      is_active: true,
    })
    setModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingItem(user)
    setUserForm({
      ldap_username: user.ldap_username,
      display_name: user.display_name,
      email: user.email,
      is_active: user.is_active,
    })
    setModalOpen(true)
  }

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Delete user ${user.display_name}?`)) {
      try {
        await userService.delete(user.user_id)
        showAlert('User deleted', 'success')
        loadUsers()
      } catch {
        showAlert('Failed to delete user', 'error')
      }
    }
  }

  const handleSubmitUser = async () => {
    try {
      if (editingItem) {
        await userService.update(editingItem.user_id, userForm)
        showAlert('User updated', 'success')
      } else {
        await userService.create(userForm)
        showAlert('User created', 'success')
      }
      setModalOpen(false)
      loadUsers()
    } catch {
      showAlert('Operation failed', 'error')
    }
  }

  const handleAddRole = () => {
    setEditingItem(null)
    setRoleForm({ role_name: '' })
    setModalOpen(true)
  }

  const handleEditRole = (role: UserRole) => {
    setEditingItem(role)
    setRoleForm({ role_name: role.role_name })
    setModalOpen(true)
  }

  const handleDeleteRole = async (role: UserRole) => {
    if (window.confirm(`Delete role ${role.role_name}?`)) {
      try {
        await userRoleService.delete(role.role_id)
        showAlert('Role deleted', 'success')
        loadRoles()
      } catch {
        showAlert('Failed to delete role', 'error')
      }
    }
  }

  const handleSubmitRole = async () => {
    try {
      if (editingItem) {
        await userRoleService.update(editingItem.role_id, roleForm)
        showAlert('Role updated', 'success')
      } else {
        await userRoleService.create(roleForm)
        showAlert('Role created', 'success')
      }
      setModalOpen(false)
      loadRoles()
    } catch {
      showAlert('Operation failed', 'error')
    }
  }

  const handleAddMapping = () => {
    setEditingItem(null)
    setMappingForm({ user_id: '', role_id: '' })
    setModalOpen(true)
  }

  const handleEditMapping = (mapping: UserRoleMapping) => {
    setEditingItem(mapping)
    setMappingForm({
      user_id: mapping.user_id,
      role_id: mapping.role_id,
    })
    setModalOpen(true)
  }

  const handleDeleteMapping = async (mapping: UserRoleMapping) => {
    if (window.confirm('Delete this user-role mapping?')) {
      try {
        await userRoleMappingService.delete(mapping.user_id)
        showAlert('Mapping deleted', 'success')
        loadMappings()
      } catch {
        showAlert('Failed to delete mapping', 'error')
      }
    }
  }

  const handleSubmitMapping = async () => {
    try {
      if (editingItem) {
        await userRoleMappingService.update(mappingForm.user_id, {
          role_id: mappingForm.role_id,
        })
        showAlert('Mapping updated', 'success')
      } else {
        await userRoleMappingService.create(mappingForm)
        showAlert('Mapping created', 'success')
      }
      setModalOpen(false)
      loadMappings()
    } catch {
      showAlert('Operation failed', 'error')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            if (tabValue === 0) handleAddUser()
            else if (tabValue === 1) handleAddRole()
            else handleAddMapping()
          }}
        >
          Add {tabValue === 0 ? 'User' : tabValue === 1 ? 'Role' : 'Mapping'}
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
        <Tab label="Users" />
        <Tab label="Roles" />
        <Tab label="User-Role Mappings" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3 }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search users..."
          />
        </Box>
        <DataTable<User>
          columns={userColumns}
          data={users}
          page={userPagination.page}
          rowsPerPage={userPagination.pageSize}
          totalRows={total}
          onPageChange={(page) =>
            setUserPagination({ ...userPagination, page })
          }
          onRowsPerPageChange={(pageSize) =>
            setUserPagination({ page: 0, pageSize })
          }
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <DataTable<UserRole>
          columns={roleColumns}
          data={roles.slice(
            rolePagination.page * rolePagination.pageSize,
            rolePagination.page * rolePagination.pageSize +
              rolePagination.pageSize
          )}
          page={rolePagination.page}
          rowsPerPage={rolePagination.pageSize}
          totalRows={roles.length}
          onPageChange={(page) =>
            setRolePagination({ ...rolePagination, page })
          }
          onRowsPerPageChange={(pageSize) =>
            setRolePagination({ page: 0, pageSize })
          }
          onEdit={handleEditRole}
          onDelete={handleDeleteRole}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <DataTable<UserRoleMapping>
          columns={mappingColumns}
          data={mappings.slice(
            mappingPagination.page * mappingPagination.pageSize,
            mappingPagination.page * mappingPagination.pageSize +
              mappingPagination.pageSize
          )}
          page={mappingPagination.page}
          rowsPerPage={mappingPagination.pageSize}
          totalRows={mappings.length}
          onPageChange={(page) =>
            setMappingPagination({ ...mappingPagination, page })
          }
          onRowsPerPageChange={(pageSize) =>
            setMappingPagination({ page: 0, pageSize })
          }
          onEdit={handleEditMapping}
          onDelete={handleDeleteMapping}
        />
      </TabPanel>

      {/* User Dialog */}
      <Dialog
        open={modalOpen && tabValue === 0}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? 'Edit User' : 'Add User'}
          <IconButton
            onClick={() => setModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="LDAP Username"
              value={userForm.ldap_username}
              onChange={(e) =>
                setUserForm({ ...userForm, ldap_username: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="Display Name"
              value={userForm.display_name}
              onChange={(e) =>
                setUserForm({ ...userForm, display_name: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm({ ...userForm, email: e.target.value })
              }
              fullWidth
              required
            />
            <FormControlLabel
              control={
                <Switch
                  checked={userForm.is_active}
                  onChange={(e) =>
                    setUserForm({ ...userForm, is_active: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitUser} variant="contained">
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Dialog */}
      <Dialog
        open={modalOpen && tabValue === 1}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? 'Edit Role' : 'Add Role'}
          <IconButton
            onClick={() => setModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Role Name"
            value={roleForm.role_name}
            onChange={(e) =>
              setRoleForm({ ...roleForm, role_name: e.target.value })
            }
            fullWidth
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitRole} variant="contained">
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mapping Dialog */}
      <Dialog
        open={modalOpen && tabValue === 2}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? 'Edit Mapping' : 'Add Mapping'}
          <IconButton
            onClick={() => setModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>User</InputLabel>
              <Select
                value={mappingForm.user_id}
                onChange={(e) =>
                  setMappingForm({ ...mappingForm, user_id: e.target.value })
                }
                disabled={!!editingItem}
              >
                {users.map((user) => (
                  <MenuItem key={user.user_id} value={user.user_id}>
                    {user.display_name} ({user.ldap_username})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={mappingForm.role_id}
                onChange={(e) =>
                  setMappingForm({ ...mappingForm, role_id: e.target.value })
                }
              >
                {roles.map((role) => (
                  <MenuItem key={role.role_id} value={role.role_id}>
                    {role.role_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitMapping} variant="contained">
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Alert
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />
    </Box>
  )
}

export default UserManagement
