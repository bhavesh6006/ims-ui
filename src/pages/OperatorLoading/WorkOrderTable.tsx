import React from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TablePagination,
} from '@mui/material'
import type { WorkOrderResponse } from '../../services/workOrderService'

interface WorkOrderTableProps {
  activeTab: number
  setActiveTab: (tab: number) => void
  loading: boolean
  paginatedOrders: WorkOrderResponse[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSelectWorkOrder: (wo: WorkOrderResponse, isClosed: boolean) => void
}

const WorkOrderTable: React.FC<WorkOrderTableProps> = ({
  activeTab,
  setActiveTab,
  loading,
  paginatedOrders,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSelectWorkOrder,
}) => {
  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Pending / Balance Work Orders" />
        <Tab label="Closed Work Orders" />
      </Tabs>

      <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {[
                'Work Order',
                'Date',
                'Tool',
                'SUB Tool',
                'Door Colour',
                'Handle',
                'Micom',
                'Lock Type',
                'Disp Type',
                'Planned',
                'Produced',
                'Consumed',
                'Remaining',
                'Action',
              ].map((header) => (
                <TableCell key={header} sx={{ fontSize: '16px' }}>
                  <strong>{header}</strong>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={14} align="center">
                  <Typography>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={14}
                  align="center"
                  sx={{ fontSize: '16px' }}
                >
                  <Typography variant="body2" color="text.secondary" py={3}>
                    No work orders found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((wo) => (
                <TableRow key={wo.id}>
                  <TableCell sx={{ fontSize: '16px' }}>
                    {wo.work_order_number}
                  </TableCell>
                  <TableCell sx={{ fontSize: '16px' }}>{wo.date}</TableCell>
                  <TableCell sx={{ fontSize: '16px' }}>{wo.tool}</TableCell>
                  <TableCell sx={{ fontSize: '16px' }}>
                    <strong>{wo.sub_tool}</strong>
                  </TableCell>
                  <TableCell sx={{ fontSize: '16px' }}>
                    {wo.door_colour}
                  </TableCell>
                  <TableCell sx={{ fontSize: '16px' }}>{wo.handle}</TableCell>
                  <TableCell sx={{ fontSize: '16px' }}>{wo.micom}</TableCell>
                  <TableCell sx={{ fontSize: '16px' }}>{wo.lock1}</TableCell>
                  <TableCell sx={{ fontSize: '16px' }}>
                    {wo.disp_type}
                  </TableCell>
                  <TableCell sx={{ fontSize: '16px' }}>
                    {wo.input_plan}
                  </TableCell>
                  <TableCell sx={{ fontSize: '16px' }}>
                    {wo.output_plan}
                  </TableCell>
                  <TableCell sx={{ fontSize: '16px' }}>
                    {wo.consumed_quantity}
                  </TableCell>
                  <TableCell sx={{ fontSize: '16px' }}>
                    {wo.input_plan - wo.output_plan}
                  </TableCell>
                  <TableCell sx={{ fontSize: '16px' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => onSelectWorkOrder(wo, activeTab === 1)}
                    >
                      {activeTab === 0 ? 'Load' : 'Edit'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_event, newPage) => onPageChange(newPage)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(event) => {
          onPageSizeChange(parseInt(event.target.value, 10))
          onPageChange(0)
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Box>
  )
}

export default WorkOrderTable
