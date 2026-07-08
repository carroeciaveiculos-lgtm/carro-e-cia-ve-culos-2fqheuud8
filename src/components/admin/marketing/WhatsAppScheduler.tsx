import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Clock, Send, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function WhatsAppScheduler() {
  const [templates, setTemplates] = useState<any[]>([])
  const [scheduled, setScheduled] = useState<any[]>([])
  const [product, setProduct] = useState('seguro')
  const [templateId, setTemplateId] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchData = async () => {
    const { data: tmpls } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('status', 'APPROVED')
      .order('nome')
    if (tmpls) setTemplates(tmpls)

    const { data: sched } = await supabase
      .from('social_posts')
      .select('*')
      .eq('status', 'Agendado')
      .order('data_agendamento', { ascending: false })
    if (sched) {
      setScheduled(sched.filter((s: any) => s.redes?.whatsapp))
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSchedule = async () => {
    if (!phone || !message || !scheduleDate) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from('social_posts').insert({
        texto: message,
        data_agendamento: new Date(scheduleDate).toISOString(),
        redes: { whatsapp: true, product, phone },
        status: 'Agendado',
        content_type: 'whatsapp',
      })
      if (error) throw error
      toast({ title: 'Mensagem agendada!' })
      setPhone('')
      setMessage('')
      setScheduleDate('')
      fetchData()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('social_posts').delete().eq('id', id)
    fetchData()
    toast({ title: 'Agendamento removido' })
  }

  const handleTemplateSelect = (id: string) => {
    setTemplateId(id)
    const tmpl = templates.find((t) => t.id === id)
    if (tmpl?.corpo) setMessage(tmpl.corpo)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" /> Agendador de WhatsApp
          </CardTitle>
          <CardDescription>Agende mensagens usando templates aprovados pela Meta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seguro">Seguro Auto</SelectItem>
                  <SelectItem value="consorcio">Consórcio Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Template Meta</Label>
              <Select value={templateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Telefone (com DDI)</Label>
            <Input
              placeholder="5534999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data e Hora</Label>
            <Input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSchedule}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4 mr-2" /> Agendar Mensagem
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Mensagens Agendadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduled.length === 0 ? (
              <p className="text-center text-slate-500 py-4">Nenhuma mensagem agendada.</p>
            ) : (
              scheduled.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start justify-between p-3 border rounded-lg bg-slate-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {s.redes?.product || 'geral'}
                      </Badge>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(s.data_agendamento).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">{s.texto}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-500"
                    onClick={() => handleDelete(s.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
