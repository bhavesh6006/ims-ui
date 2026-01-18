import React from 'react'
import { Box } from '@mui/material'
import { Input } from '../atoms'

interface FormField {
  name: string
  label: string
  type?: string
  required?: boolean
  disabled?: boolean
  multiline?: boolean
  rows?: number
  select?: boolean
  options?: { value: string | number; label: string }[]
}

interface FormGroupProps {
  fields: FormField[]
  values: Record<string, string | number>
  onChange: (name: string, value: string | number) => void
  errors?: Record<string, string>
}

const FormGroup: React.FC<FormGroupProps> = ({
  fields,
  values,
  onChange,
  errors = {},
}) => {
  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        {fields.map((field) => (
          <Box key={field.name}>
            <Input
              name={field.name}
              label={field.label}
              type={field.type || 'text'}
              required={field.required}
              disabled={field.disabled}
              multiline={field.multiline}
              rows={field.rows}
              select={field.select}
              value={values[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              error={!!errors[field.name]}
              helperText={errors[field.name]}
            >
              {field.select &&
                field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </Input>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default FormGroup
