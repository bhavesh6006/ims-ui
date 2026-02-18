import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Chip,
  Stack,
} from '@mui/material'
import { useAuth } from '../context/useAuth'

const Profile: React.FC = () => {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  const infoRows = [
    { label: 'Username', value: user.username },
    { label: 'Email', value: user.email },
    {
      label: 'Role',
      render: (
        <Chip
          label={user.role}
          color="primary"
          size="small"
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      label: 'Status',
      render: (
        <Chip
          label={user.status ? 'Active' : 'Inactive'}
          color={user.status ? 'success' : 'error'}
          size="small"
        />
      ),
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>
      <Card sx={{ maxWidth: 600, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Information
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Stack spacing={2}>
            {infoRows.map((row) => (
              <Box
                key={row.label}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ width: 150, flexShrink: 0 }}
                >
                  {row.label}
                </Typography>
                {row.render ? (
                  row.render
                ) : (
                  <Typography variant="body1">{row.value}</Typography>
                )}
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Profile
