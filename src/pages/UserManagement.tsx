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
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { DataTable, type Column } from '../components/organisms'
import { SearchBar, Alert } from '../components/molecules'
import { userService } from '../services'
import type { User } from '../types/user'

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
  })
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<User | null>(null)
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    role: 'Operator' as 'Admin' | 'StoreManager' | 'Operator',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  })

  const userColumns: Column[] = [
    { id: 'username', label: 'Username' },
    { id: 'email', label: 'Email' },
    { id: 'role', label: 'Role' },
    {
      id: 'status',
      label: 'Status',
      format: (value: unknown) => {
        return value === 'ACTIVE' ? 'Active' : 'Inactive'
      },
    },
  ]

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity })
  }

  const loadUsers = useCallback(async () => {
    try {
      const response = await userService.getAll(
        pagination.page + 1,
        pagination.pageSize,
        search
      )
      const data = response.data || []

      // Sort alphabetically by username
      const sortedUsers = (Array.isArray(data) ? data : []).sort((a, b) => {
        const nameA = a.username || ''
        const nameB = b.username || ''
        return nameA.localeCompare(nameB)
      })

      setUsers(sortedUsers)
      setTotal(response.count || sortedUsers.length)
    } catch {
      showAlert('Failed to load users', 'error')
    }
  }, [pagination.page, pagination.pageSize, search])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleAdd = () => {
    setEditingItem(null)
    setUserForm({
      username: '',
      email: '',
      role: 'Operator',
      status: 'ACTIVE',
    })
    setModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingItem(user)
    setUserForm({
      username: user.username,
      email: user.email || '',
      role: user.role as 'Admin' | 'StoreManager' | 'Operator',
      status: user.status as 'ACTIVE' | 'INACTIVE',
    })
    setModalOpen(true)
  }

  const handleDelete = async (user: User) => {
    if (window.confirm(`Delete user ${user.username}?`)) {
      try {
        await userService.delete(user.user_id)
        showAlert('User deleted', 'success')
        loadUsers()
      } catch {
        showAlert('Failed to delete user', 'error')
      }
    }
  }

  const handleSubmit = async () => {
    try {
      if (!userForm.username) {
        showAlert('Username is required', 'error')
        return
      }
      if (!userForm.role) {
        showAlert('Role is required', 'error')
        return
      }

      if (editingItem) {
        await userService.update(editingItem.user_id, userForm)
        showAlert('User updated', 'success')
      } else {
        await userService.create(userForm)
        showAlert('User created', 'success')
      }
      setModalOpen(false)
      loadUsers()
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined
      showAlert(message || 'Operation failed', 'error')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add User
        </Button>
      </Box>

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
        page={pagination.page}
        rowsPerPage={pagination.pageSize}
        totalRows={total}
        onPageChange={(page) => setPagination({ ...pagination, page })}
        onRowsPerPageChange={(pageSize) => setPagination({ page: 0, pageSize })}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* User Dialog */}
      <Dialog
        open={modalOpen}
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
              label="Username"
              value={userForm.username}
              onChange={(e) =>
                setUserForm({ ...userForm, username: e.target.value })
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
            />
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                value={userForm.role}
                onChange={(e) =>
                  setUserForm({
                    ...userForm,
                    role: e.target.value as
                      | 'Admin'
                      | 'StoreManager'
                      | 'Operator',
                  })
                }
                label="Role"
              >
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="StoreManager">Store Manager</MenuItem>
                <MenuItem value="Operator">Operator</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={userForm.status}
                onChange={(e) =>
                  setUserForm({
                    ...userForm,
                    status: e.target.value as 'ACTIVE' | 'INACTIVE',
                  })
                }
                label="Status"
              >
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
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
