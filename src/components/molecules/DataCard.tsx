import React from 'react'
import { Card } from '../atoms'
import { CardContent, CardActions } from '@mui/material'

interface DataCardProps {
  children: React.ReactNode
  actions?: React.ReactNode
  elevation?: number
}

const DataCard: React.FC<DataCardProps> = ({
  children,
  actions,
  elevation = 2,
}) => {
  return (
    <Card elevation={elevation}>
      <CardContent>{children}</CardContent>
      {actions && <CardActions>{actions}</CardActions>}
    </Card>
  )
}

export default DataCard
