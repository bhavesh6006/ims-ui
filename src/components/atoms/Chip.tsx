import React from 'react'
import { Chip as MuiChip, type ChipProps as MuiChipProps } from '@mui/material'

export type ChipProps = MuiChipProps

const Chip: React.FC<ChipProps> = (props) => {
  return <MuiChip {...props} />
}

export default Chip
