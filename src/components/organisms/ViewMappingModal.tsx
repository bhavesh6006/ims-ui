import React, { useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import GroupWorkIcon from '@mui/icons-material/GroupWork'
import type { TrolleyTypeMapping, MappingItem } from '../../types/mapping'

interface ViewMappingModalProps {
  open: boolean
  onClose: () => void
  mapping: TrolleyTypeMapping | null
}

interface GroupInfo {
  group_id: string
  members: MappingItem[]
  group_total_quantity: number
}

const ViewMappingModal: React.FC<ViewMappingModalProps> = ({
  open,
  onClose,
  mapping,
}) => {
  const { individualMappings, groups } = useMemo(() => {
    if (!mapping) return { individualMappings: [], groups: [] }

    const individual = mapping.mappings.filter((m) => !m.is_group_mapping)
    const groupMap: Record<string, MappingItem[]> = {}

    mapping.mappings
      .filter((m) => m.is_group_mapping && m.mapping_group_id)
      .forEach((m) => {
        const gid = m.mapping_group_id!
        if (!groupMap[gid]) groupMap[gid] = []
        groupMap[gid].push(m)
      })

    const groupList: GroupInfo[] = Object.entries(groupMap).map(
      ([groupId, members]) => ({
        group_id: groupId,
        members,
        group_total_quantity: members[0]?.group_total_quantity || 0,
      })
    )

    return { individualMappings: individual, groups: groupList }
  }, [mapping])

  if (!mapping) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        View Cart Material Mapping
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Cart Type
          </Typography>
          <Typography variant="h6">{mapping.trolley_type}</Typography>
        </Box>

        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Total Materials Mapped: {mapping.total_materials}
          </Typography>
          {groups.length > 0 && (
            <Chip
              icon={<GroupWorkIcon />}
              label={`${groups.length} Group(s)`}
              color="primary"
              size="small"
              variant="outlined"
            />
          )}
          {individualMappings.length > 0 && (
            <Chip
              label={`${individualMappings.length} Individual`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        {/* Individual Mappings */}
        {individualMappings.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Individual Materials
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Material Code
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Material Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Material Type
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Max Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {individualMappings.map((item: MappingItem) => (
                    <TableRow key={item.mapping_id}>
                      <TableCell>{item.material?.material_code}</TableCell>
                      <TableCell>{item.material?.material_name}</TableCell>
                      <TableCell>
                        {item.material?.materialType?.material_type}
                      </TableCell>
                      <TableCell>{item.max_quantity}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          color={
                            item.status === 'ACTIVE' ? 'success' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Group Mappings */}
        {groups.map((group, gIndex) => {
          const perMaterial =
            group.members.length > 0
              ? Math.floor(group.group_total_quantity / group.members.length)
              : 0
          return (
            <Box key={group.group_id} sx={{ mb: 3 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
              >
                <GroupWorkIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Group {gIndex + 1}
                </Typography>
                <Chip
                  label={`Total: ${group.group_total_quantity}`}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`${perMaterial} per material`}
                  variant="outlined"
                  size="small"
                  color="info"
                />
                <Chip
                  label={`${group.members.length} materials`}
                  variant="outlined"
                  size="small"
                />
              </Box>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderColor: 'primary.light', borderWidth: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        Material Code
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        Material Name
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        Material Type
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        Quantity (Share)
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.members.map((item: MappingItem) => (
                      <TableRow key={item.mapping_id}>
                        <TableCell>{item.material?.material_code}</TableCell>
                        <TableCell>{item.material?.material_name}</TableCell>
                        <TableCell>
                          {item.material?.materialType?.material_type}
                        </TableCell>
                        <TableCell>{item.max_quantity}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.status}
                            color={
                              item.status === 'ACTIVE' ? 'success' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )
        })}

        {individualMappings.length === 0 && groups.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No materials mapped
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ViewMappingModal
