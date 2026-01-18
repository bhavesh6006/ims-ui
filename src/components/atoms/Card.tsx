import React from 'react'
import { Card as MuiCard, type CardProps as MuiCardProps } from '@mui/material'

export interface CardProps extends MuiCardProps {
  children: React.ReactNode
}

const Card: React.FC<CardProps> = ({ children, ...props }) => {
  return <MuiCard {...props}>{children}</MuiCard>
}

export default Card
