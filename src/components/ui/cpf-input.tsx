import * as React from 'react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function isValidCpf(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]+/g, '')
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false
  let chk1 = 0,
    chk2 = 0
  for (let i = 0; i < 9; i++) {
    chk1 += parseInt(cpf.charAt(i)) * (10 - i)
    chk2 += parseInt(cpf.charAt(i)) * (11 - i)
  }
  chk1 = (chk1 * 10) % 11
  if (chk1 === 10 || chk1 === 11) chk1 = 0
  chk2 += chk1 * 2
  chk2 = (chk2 * 10) % 11
  if (chk2 === 10 || chk2 === 11) chk2 = 0
  return chk1 === parseInt(cpf.charAt(9)) && chk2 === parseInt(cpf.charAt(10))
}

export function formatCpf(cpf: string): string {
  const v = cpf.replace(/\D/g, '').slice(0, 11)
  if (v.length >= 10) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`
  if (v.length >= 7) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`
  if (v.length >= 4) return `${v.slice(0, 3)}.${v.slice(3)}`
  return v
}

export interface CpfInputProps extends Omit<React.ComponentProps<'input'>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  onNameFound?: (name: string) => void
  buttonClassName?: string
}

export const CpfInput = React.forwardRef<HTMLInputElement, CpfInputProps>(
  ({ className, value, onChange, onNameFound, buttonClassName, ...props }, ref) => {
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const handleSearch = async () => {
      const cleanCpf = value.replace(/\D/g, '')
      if (!cleanCpf) {
        return toast({
          title: 'Atenção',
          description: 'Digite o CPF primeiro.',
          variant: 'destructive',
        })
      }
      if (!isValidCpf(cleanCpf)) {
        return toast({ title: 'Atenção', description: 'CPF inválido.', variant: 'destructive' })
      }

      setLoading(true)
      try {
        const { data, error } = await supabase.functions.invoke('consultar-cpf', {
          body: { cpf: cleanCpf },
        })

        if (error) throw error
        if (!data.success) throw new Error(data.error || 'Falha ao consultar CPF')

        if (data.data?.nome) {
          toast({ title: 'Sucesso!', description: 'Nome importado com sucesso.' })
          if (onNameFound) onNameFound(data.data.nome)
        } else {
          toast({
            title: 'Aviso',
            description: 'CPF não encontrado ou nome não disponível.',
            variant: 'default',
          })
        }
      } catch (err: any) {
        toast({ title: 'Erro ao consultar CPF', description: err.message, variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="flex gap-2 items-center w-full">
        <Input
          ref={ref}
          value={value}
          onChange={(e) => onChange(formatCpf(e.target.value))}
          className={cn('flex-1', className)}
          maxLength={14}
          {...props}
        />
        {onNameFound && (
          <Button
            type="button"
            onClick={handleSearch}
            disabled={loading || value.length < 14}
            size="sm"
            variant="outline"
            className={cn('px-2 shrink-0', buttonClassName)}
            title="Consultar CPF"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
    )
  },
)
CpfInput.displayName = 'CpfInput'
