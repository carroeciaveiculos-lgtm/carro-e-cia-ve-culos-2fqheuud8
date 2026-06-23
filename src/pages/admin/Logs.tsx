import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, Code, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function Logs() {
  const [metaLogs, setMetaLogs] = useState<any[]>([])
  const [portalLogs, setPortalLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayload, setSelectedPayload] = useState<any>(null)

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const [metaRes, portalRes] = await Promise.all([
        supabase
          .from('meta_webhook_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('logs_integracao')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
      ])

      if (metaRes.data) setMetaLogs(metaRes.data)
      if (portalRes.data) setPortalLogs(portalRes.data)
    } catch (error) {
      console.error('Error loading logs', error)
    } finally {
      setLoading(false)
    }
  }

  const renderPayloadModal = () => (
    <Dialog open={!!selectedPayload} onOpenChange={(open) => !open && setSelectedPayload(null)}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Detalhes do Payload</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 mt-4 bg-slate-950 rounded-md p-4">
          <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap break-words">
            {JSON.stringify(selectedPayload, null, 2)}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="flex flex-col h-full bg-white border rounded-xl shadow-sm mx-4 my-4">
      <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm shrink-0">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" /> Logs de Integração
        </h2>
        <Button onClick={loadLogs} variant="outline" size="sm" disabled={loading}>
          Atualizar Logs
        </Button>
      </div>

      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        <Tabs defaultValue="meta" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mb-4 shrink-0 justify-start">
            <TabsTrigger value="meta">Meta Webhooks</TabsTrigger>
            <TabsTrigger value="portais">Integração Portais</TabsTrigger>
          </TabsList>

          <TabsContent value="meta" className="flex-1 overflow-hidden m-0 border rounded-lg">
            <ScrollArea className="h-full">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && metaLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : metaLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        Nenhum log encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    metaLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase">
                            {log.platform}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{log.event_type}</TableCell>
                        <TableCell>
                          {log.error ? (
                            <Badge variant="destructive" className="flex w-fit items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Erro
                            </Badge>
                          ) : log.processed ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 flex w-fit items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Processado
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Pendente</Badge>
                          )}
                          {log.error && (
                            <p
                              className="text-xs text-red-600 mt-1 max-w-[300px] truncate"
                              title={log.error}
                            >
                              {log.error}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPayload(log.payload)}
                          >
                            <Code className="w-4 h-4 text-slate-500 hover:text-slate-800" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="portais" className="flex-1 overflow-hidden m-0 border rounded-lg">
            <ScrollArea className="h-full">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                    <TableHead>Portal</TableHead>
                    <TableHead>Veículo ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && portalLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : portalLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        Nenhum log encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    portalLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase">
                            {log.portal}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-500">
                          {log.veiculo_id || '-'}
                        </TableCell>
                        <TableCell>
                          {log.status === 'sucesso' ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 flex w-fit items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Sucesso
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="flex w-fit items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Erro
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!log.payload_erro}
                            onClick={() => setSelectedPayload(log.payload_erro)}
                          >
                            <Code className="w-4 h-4 text-slate-500 hover:text-slate-800" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {renderPayloadModal()}
    </div>
  )
}
