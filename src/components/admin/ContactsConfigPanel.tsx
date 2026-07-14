import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Save, Plus, Trash2, User } from 'lucide-react'
import { DEFAULT_BRAND, type BrandConfig, type TeamMember } from '@/lib/brand'
import { loadBrandConfig, saveBrandConfig } from '@/lib/brand-config'

export function ContactsConfigPanel() {
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
      toast({ title: 'Contatos salvos com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    const team = [...config.team]
    team[index] = { ...team[index], [field]: value }
    setConfig({ ...config, team })
  }

  const addTeamMember = () => {
    setConfig({
      ...config,
      team: [...config.team, { name: '', role: '', whatsapp: '', whatsappDisplay: '' }],
    })
  }

  const removeTeamMember = (index: number) => {
    setConfig({ ...config, team: config.team.filter((_, i) => i !== index) })
  }

  if (loading) return <div className="py-8 text-center text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contatos Principais</CardTitle>
          <CardDescription>
            WhatsApp principal da loja, telefone fixo e redes sociais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>WhatsApp Principal (Meta)</Label>
              <Input
                value={config.whatsapp}
                onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                placeholder="5534997384177"
              />
            </div>
            <div>
              <Label>WhatsApp (Exibição)</Label>
              <Input
                value={config.whatsappDisplay}
                onChange={(e) => setConfig({ ...config, whatsappDisplay: e.target.value })}
                placeholder="(34) 99738-4177"
              />
            </div>
            <div>
              <Label>Telefone Fixo</Label>
              <Input
                value={config.phone}
                onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                placeholder="553433159400"
              />
            </div>
            <div>
              <Label>Telefone (Exibição)</Label>
              <Input
                value={config.phoneDisplay}
                onChange={(e) => setConfig({ ...config, phoneDisplay: e.target.value })}
                placeholder="(34) 3315-9400"
              />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input
                value={config.instagram}
                onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
                placeholder="@carroecia_uberaba"
              />
            </div>
            <div>
              <Label>URL Instagram</Label>
              <Input
                value={config.instagramUrl}
                onChange={(e) => setConfig({ ...config, instagramUrl: e.target.value })}
              />
            </div>
            <div>
              <Label>URL Facebook</Label>
              <Input
                value={config.facebookUrl}
                onChange={(e) => setConfig({ ...config, facebookUrl: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Equipe e Contatos Diretos</CardTitle>
              <CardDescription>
                Cada membro tem seu próprio link direto de WhatsApp.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addTeamMember}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.team.map((member, i) => (
            <div key={i} className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                <Input
                  value={member.name}
                  onChange={(e) => updateTeamMember(i, 'name', e.target.value)}
                  placeholder="Nome"
                />
                <Input
                  value={member.role}
                  onChange={(e) => updateTeamMember(i, 'role', e.target.value)}
                  placeholder="Cargo"
                />
                <Input
                  value={member.whatsapp}
                  onChange={(e) => updateTeamMember(i, 'whatsapp', e.target.value)}
                  placeholder="5534999999999"
                />
                <Input
                  value={member.whatsappDisplay || ''}
                  onChange={(e) => updateTeamMember(i, 'whatsappDisplay', e.target.value)}
                  placeholder="(34) 99999-9999"
                />
                <Input
                  value={member.email || ''}
                  onChange={(e) => updateTeamMember(i, 'email', e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 shrink-0"
                onClick={() => removeTeamMember(i)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        <Save className="w-4 h-4 mr-2" />
        {saving ? 'Salvando...' : 'Salvar Contatos'}
      </Button>
    </div>
  )
}
