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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ShieldAlert, Bot, Globe, Activity } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function Auditoria() {
  const [accessLogs, setAccessLogs] = useState<any[]>([])
  const [iaLogs, setIaLogs] = useState<any[]>([])
  const [integracaoLogs, setIntegracaoLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)

    // Fetch Access Logs
    const { data: accData } = await supabase
      .from('access_log')
      .select('*, usuarios(nome)')
      .order('timestamp', { ascending: false })
      .limit(100)

    setAccessLogs(accData || [])

    // Fetch IA Logs
    const { data: iaData } = await supabase
      .from('logs_ia')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    setIaLogs(iaData || [])

    // Fetch Integracao Logs
    const { data: intData } = await supabase
      .from('logs_integracao')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    setIntegracaoLogs(intData || [])

    setLoading(false)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <ShieldAlert className="w-6 h-6 text-blue-600" />
            Painel de Auditoria
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitore atividades do sistema, integrações e uso de IA.
          </p>
        </div>
      </div>

      <Tabs defaultValue="access" className="w-full">
        <TabsList className="mb-4 bg-white border">
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Activity className="w-4 h-4" /> Logs de Acesso
          </TabsTrigger>
          <TabsTrigger value="ia" className="flex items-center gap-2">
            <Bot className="w-4 h-4" /> Logs de IA
          </TabsTrigger>
          <TabsTrigger value="integracao" className="flex items-center gap-2">
            <Globe className="w-4 h-4" /> Integrações
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="access"
          className="bg-white p-0 border rounded-lg shadow-sm overflow-hidden"
        >
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    {loading ? 'Carregando...' : 'Nenhum log encontrado.'}
                  </TableCell>
                </TableRow>
              ) : (
                accessLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap font-medium text-slate-600">
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{log.usuarios?.nome || log.usuario_id || 'Sistema'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.modulo}</Badge>
                    </TableCell>
                    <TableCell>{log.acao}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent
          value="ia"
          className="bg-white p-0 border rounded-lg shadow-sm overflow-hidden"
        >
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Tokens Input</TableHead>
                <TableHead>Tokens Output</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {iaLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    {loading ? 'Carregando...' : 'Nenhum uso de IA registrado.'}
                  </TableCell>
                </TableRow>
              ) : (
                iaLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap font-medium text-slate-600">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{log.acao}</TableCell>
                    <TableCell>{log.tokens_input || 0}</TableCell>
                    <TableCell>{log.tokens_output || 0}</TableCell>
                    <TableCell>
                      <Badge
                        variant={log.status === 'success' ? 'default' : 'destructive'}
                        className={log.status === 'success' ? 'bg-green-500' : ''}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent
          value="integracao"
          className="bg-white p-0 border rounded-lg shadow-sm overflow-hidden"
        >
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Portal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mensagem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integracaoLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    {loading ? 'Carregando...' : 'Nenhuma integração registrada.'}
                  </TableCell>
                </TableRow>
              ) : (
                integracaoLogs.map((log) => (
                  <TableRow key={log.id} className={log.status !== 'success' ? 'bg-red-50/30' : ''}>
                    <TableCell className="whitespace-nowrap font-medium text-slate-600">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800">{log.portal}</TableCell>
                    <TableCell>
                      <Badge
                        variant={log.status === 'success' ? 'default' : 'destructive'}
                        className={log.status === 'success' ? 'bg-green-500' : ''}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-sm text-slate-600 max-w-md truncate"
                      title={log.mensagem}
                    >
                      {log.mensagem}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  )
}
