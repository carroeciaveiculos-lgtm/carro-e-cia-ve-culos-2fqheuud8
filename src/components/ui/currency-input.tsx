import * as React from 'react'
import { Input } from './input'

export interface CurrencyInputProps extends Omit<
  React.ComponentProps<'input'>,
  'onChange' | 'value'
> {
  value?: number | string | null
  onChange?: (value: number | null) => void
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, onBlur, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')

    React.useEffect(() => {
      if (value !== undefined && value !== null && value !== '') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value
        if (!isNaN(numValue)) {
          setDisplayValue(formatCurrency(numValue))
        } else {
          setDisplayValue('')
        }
      } else {
        setDisplayValue('')
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value
      val = val.replace(/\D/g, '')
      if (val === '') {
        setDisplayValue('')
        onChange?.(null)
        return
      }
      const numValue = parseInt(val, 10) / 100
      setDisplayValue(formatCurrency(numValue))
      onChange?.(numValue)
    }

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        className={className}
        value={displayValue}
        onChange={handleChange}
        onBlur={onBlur}
      />
    )
  },
)
CurrencyInput.displayName = 'CurrencyInput'
