import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function VisibilityToggle({
  veiculoId,
  initialValue = true,
}: {
  veiculoId: string
  initialValue?: boolean
}) {
  const [visible, setVisible] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleToggle = async (checked: boolean) => {
    setLoading(true)
    setVisible(checked)
    const { error } = await supabase
      .from('veiculos')
      .update({ exibir_no_site: checked })
      .eq('id', veiculoId)

    if (error) {
      setVisible(!checked)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a visibilidade.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: checked ? 'Veículo visível no site.' : 'Veículo ocultado do site.',
      })
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={visible}
        onCheckedChange={handleToggle}
        disabled={loading}
        id={`visibility-${veiculoId}`}
      />
      <Label htmlFor={`visibility-${veiculoId}`} className="text-xs cursor-pointer">
        {visible ? 'Visível no Site' : 'Oculto'}
      </Label>
    </div>
  )
}
