import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RefreshCw, AlertTriangle, Check, X } from 'lucide-react'
import { listCampaigns, updateBudget, toggleStatus, type Campaign } from '@/services/ads-manager'
import { useToast } from '@/hooks/use-toast'

export function CampaignPanel({ platform }: { platform: 'google' | 'meta' }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBudget, setEditingBudget] = useState<string | null>(null)
  const [budgetValue, setBudgetValue] = useState('')
  const [confirmingAction, setConfirmingAction] = useState<{
    type: string
    campaign: Campaign
  } | null>(null)
  const { toast } = useToast()

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const data = await listCampaigns(platform)
      setCampaigns(data)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [platform])

  const handleBudgetSave = (campaignId: string) => {
    const campaign = campaigns.find((c) => c.id === campaignId)
    if (campaign) {
      setConfirmingAction({
        type: 'budget',
        campaign: { ...campaign, daily_budget: Number(budgetValue) },
      })
    }
  }

  const handleToggleStatus = (campaign: Campaign) => {
    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setConfirmingAction({ type: 'status', campaign: { ...campaign, status: newStatus } })
  }

  const executeConfirmed = async () => {
    if (!confirmingAction) return
    try {
      if (confirmingAction.type === 'budget') {
        await updateBudget(
          platform,
          confirmingAction.campaign.id,
          confirmingAction.campaign.daily_budget,
        )
        toast({ title: 'Orçamento atualizado com sucesso' })
      } else {
        await toggleStatus(platform, confirmingAction.campaign.id, confirmingAction.campaign.status)
        toast({ title: 'Status atualizado com sucesso' })
      }
      fetchCampaigns()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setConfirmingAction(null)
      setEditingBudget(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="capitalize">
            {platform === 'google' ? 'Google Ads' : 'Meta Ads'} - Campanhas
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchCampaigns} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {confirmingAction && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-800">Confirmação Necessária</span>
            </div>
            <p className="text-sm text-amber-700 mb-3">
              {confirmingAction.type === 'budget'
                ? `Alterar orçamento de "${confirmingAction.campaign.name}" para R$ ${confirmingAction.campaign.daily_budget}/dia?`
                : `${confirmingAction.campaign.status === 'ACTIVE' ? 'Ativar' : 'Pausar'} campanha "${confirmingAction.campaign.name}"?`}
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={executeConfirmed}>
                <Check className="w-3 h-3 mr-1" /> Confirmar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmingAction(null)}>
                <X className="w-3 h-3 mr-1" /> Cancelar
              </Button>
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campanha</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Orçamento/Dia</TableHead>
              <TableHead>Imp.</TableHead>
              <TableHead>Cliques</TableHead>
              <TableHead>CTR</TableHead>
              <TableHead>Custo</TableHead>
              <TableHead>Conv.</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  <Badge variant={c.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {c.status === 'ACTIVE' ? 'Ativa' : 'Pausada'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {editingBudget === c.id ? (
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        value={budgetValue}
                        onChange={(e) => setBudgetValue(e.target.value)}
                        className="w-20 h-8"
                      />
                      <Button size="sm" variant="outline" onClick={() => handleBudgetSave(c.id)}>
                        OK
                      </Button>
                    </div>
                  ) : (
                    <span>R$ {c.daily_budget}</span>
                  )}
                </TableCell>
                <TableCell>{c.metrics?.impressions?.toLocaleString() || '-'}</TableCell>
                <TableCell>{c.metrics?.clicks || '-'}</TableCell>
                <TableCell>{c.metrics?.ctr?.toFixed(2) || '-'}%</TableCell>
                <TableCell>R$ {c.metrics?.cost?.toFixed(2) || '-'}</TableCell>
                <TableCell>{c.metrics?.conversions || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingBudget(c.id)
                        setBudgetValue(String(c.daily_budget))
                      }}
                    >
                      Orçamento
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleToggleStatus(c)}>
                      {c.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
