import React from 'react'
import {
  Typography as MuiTypography,
  type TypographyProps as MuiTypographyProps,
} from '@mui/material'

export interface TypographyProps extends MuiTypographyProps {
  children: React.ReactNode
}

const Typography: React.FC<TypographyProps> = ({ children, ...props }) => {
  return <MuiTypography {...props}>{children}</MuiTypography>
}

export default Typography
