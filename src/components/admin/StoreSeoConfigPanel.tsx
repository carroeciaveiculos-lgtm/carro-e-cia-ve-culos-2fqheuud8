import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Save, MapPin, Image as ImageIcon } from 'lucide-react'
import { DEFAULT_BRAND, type BrandConfig } from '@/lib/brand'
import { loadBrandConfig, saveBrandConfig } from '@/lib/brand-config'

// Aba "Loja & SEO" (17/08/2026) — antes era só fachada, não salvava nada.
// Reconstruída pra preencher uma lacuna real: endereço e logo não tinham
// NENHUMA tela de edição (a aba Contatos só cobre WhatsApp/telefone/redes).
// Endereço/telefone/logo saíram do hardcode em src/components/SEO.tsx e
// passam a vir daqui — mesmo brand_config que o rodapé do site já usa.
export function StoreSeoConfigPanel() {
  const [config, setConfig] = useState<BrandConfig>(DEFAULT_BRAND)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadBrandConfig().then((c) => {
      setConfig(c)
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveBrandConfig(config)
      toast({ title: 'Dados da loja salvos com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-8 text-center text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Endereço da Loja
          </CardTitle>
          <CardDescription>
            Usado no rodapé do site e no SEO (schema.org) de todas as páginas — mudar aqui atualiza
            os dois de uma vez, sem precisar editar código.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Nome da loja (marca)</Label>
              <Input
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Endereço (rua e número)</Label>
              <Input
                value={config.address}
                onChange={(e) => setConfig({ ...config, address: e.target.value })}
                placeholder="Av. Guilherme Ferreira, 1119"
              />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input
                value={config.addressDistrict}
                onChange={(e) => setConfig({ ...config, addressDistrict: e.target.value })}
                placeholder="São Benedito"
              />
            </div>
            <div>
              <Label>CEP</Label>
              <Input
                value={config.addressCep}
                onChange={(e) => setConfig({ ...config, addressCep: e.target.value })}
                placeholder="38022-200"
              />
            </div>
            <div>
              <Label>Cidade - UF</Label>
              <Input
                value={config.city}
                onChange={(e) => setConfig({ ...config, city: e.target.value })}
                placeholder="Uberaba - MG"
              />
            </div>
            <div>
              <Label>Horário — semana</Label>
              <Input
                value={config.hoursWeek}
                onChange={(e) => setConfig({ ...config, hoursWeek: e.target.value })}
                placeholder="Seg-Sex: 9h - 18h"
              />
            </div>
            <div>
              <Label>Horário — sábado</Label>
              <Input
                value={config.hoursSat}
                onChange={(e) => setConfig({ ...config, hoursSat: e.target.value })}
                placeholder="Sáb: 9h - 14h"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Logo
          </CardTitle>
          <CardDescription>URL da logo usada no SEO (schema.org) de todas as páginas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={config.logoUrl}
            onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
            placeholder="https://imagens.carroeciamotors.com.br/..."
          />
          {config.logoUrl && (
            <img src={config.logoUrl} alt="Logo atual" className="h-12 object-contain" />
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        <Save className="w-4 h-4 mr-2" />
        {saving ? 'Salvando...' : 'Salvar Loja & SEO'}
      </Button>
    </div>
  )
}
