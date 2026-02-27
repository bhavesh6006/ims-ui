import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  Autocomplete,
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

  interface FormErrors {
    username?: string
    role?: string
  }

  const [errors, setErrors] = useState<FormErrors>({})

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    role: 'Operator' as 'Admin' | 'Store Manager' | 'Operator',
    status: true as true | false,
  })

  const userColumns: Column[] = [
    { id: 'username', label: 'Username' },
    { id: 'email', label: 'Email' },
    { id: 'role', label: 'Role' },
    {
      id: 'is_active',
      label: 'Status',
      format: (is_active: unknown) => {
        if (typeof is_active === 'boolean')
          return is_active ? 'Active' : 'Inactive'
        if (typeof is_active === 'string')
          return is_active.toUpperCase() === 'ACTIVE' || is_active === 'true'
            ? 'Active'
            : 'Inactive'
        return is_active == true ? 'Active' : 'Inactive'
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
      status: true,
    })
    setModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingItem(user)
    console.log('Editing user:', user)

    // Normalize status to boolean
    let normalizedStatus = true
    if (typeof user.is_active === 'boolean') {
      normalizedStatus = user.is_active
    } else if (typeof user.is_active === 'string') {
      normalizedStatus =
        (user.is_active as string).toUpperCase() === 'ACTIVE' ||
        user.is_active === 'true'
    }

    setUserForm({
      username: user.username,
      email: user.email || '',
      role: user.role as 'Admin' | 'Store Manager' | 'Operator',
      status: normalizedStatus,
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

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!userForm.username?.trim()) {
      newErrors.username = 'Username is required'
    }

    if (!userForm.role) {
      newErrors.role = 'Role is required'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    try {
      if (!validate()) return

      if (!userForm.username) {
        showAlert('Username is required', 'error')
        return
      }
      if (!userForm.role) {
        showAlert('Role is required', 'error')
        return
      }

      const payload = {
        ...userForm,
        status: userForm.status, // boolean: true/false
      }

      console.log('Submitting payload:', payload)

      if (editingItem) {
        const response = await userService.update(editingItem.user_id, payload)
        console.log('Update response:', response)
        showAlert('User updated', 'success')
      } else {
        await userService.create(payload)
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
              onChange={(e) => {
                setUserForm({ ...userForm, username: e.target.value })
                setErrors({ ...errors, username: undefined })
              }}
              fullWidth
              required
              error={Boolean(errors.username)}
              helperText={errors.username}
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
            <Autocomplete
              fullWidth
              options={[
                { label: 'Admin', value: 'Admin' },
                { label: 'Store Manager', value: 'Store Manager' },
                { label: 'Operator', value: 'Operator' },
              ]}
              value={
                [
                  { label: 'Admin', value: 'Admin' },
                  { label: 'Store Manager', value: 'Store Manager' },
                  { label: 'Operator', value: 'Operator' },
                ].find((opt) => opt.value === userForm.role) || null
              }
              onChange={(_, newValue) => {
                setUserForm({
                  ...userForm,
                  role:
                    (newValue?.value as
                      | 'Admin'
                      | 'Store Manager'
                      | 'Operator') || 'Operator',
                })
                setErrors({ ...errors, role: undefined })
              }}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) =>
                option.value === value.value
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Role"
                  required
                  error={Boolean(errors.role)}
                  helperText={errors.role}
                />
              )}
            />
            <Autocomplete
              fullWidth
              options={[
                { label: 'Active', value: true },
                { label: 'Inactive', value: false },
              ]}
              value={
                [
                  { label: 'Active', value: true },
                  { label: 'Inactive', value: false },
                ].find((opt) => opt.value === userForm.status) || null
              }
              onChange={(_, newValue) =>
                setUserForm({
                  ...userForm,
                  status: newValue?.value ?? true,
                })
              }
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) =>
                option.value === value.value
              }
              renderInput={(params) => <TextField {...params} label="Status" />}
            />
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
