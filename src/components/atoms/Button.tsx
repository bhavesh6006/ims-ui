import React from 'react'
import {
  Button as MuiButton,
  type ButtonProps as MuiButtonProps,
} from '@mui/material'

export interface CustomButtonProps extends MuiButtonProps {
  children: React.ReactNode
}

const Button: React.FC<CustomButtonProps> = ({ children, ...props }) => {
  return <MuiButton {...props}>{children}</MuiButton>
}

export default Button
