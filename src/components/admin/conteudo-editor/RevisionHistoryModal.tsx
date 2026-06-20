import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BlockPreview } from './BlockPreview'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeftRight, Clock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RevisionHistoryModal({
  id,
  isArticle,
  currentBlocks,
  currentDesignVars,
  currentHtml,
  onClose,
  onRestore,
}: {
  id: string
  isArticle: boolean
  currentBlocks: any[]
  currentDesignVars: any
  currentHtml?: string
  onClose: () => void
  onRestore: (data: any) => void
}) {
  const [versions, setVersions] = useState<any[]>([])
  const [selectedVersion, setSelectedVersion] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVersions()
  }, [id, isArticle])

  const fetchVersions = async () => {
    const table = isArticle ? 'article_versions' : 'pages_versions'
    const col = isArticle ? 'article_id' : 'page_id'
    const { data } = await supabase
      .from(table)
      .select('*')
      .eq(col, id)
      .order('criado_em', { ascending: false })

    if (data) {
      setVersions(data)
      if (data.length > 0) setSelectedVersion(data[0])
    }
    setLoading(false)
  }

  const parseContent = (version: any) => {
    const content = version.conteudo
    if (isArticle) {
      return { blocks: [], designVars: {}, html: content, fullData: version }
    }
    try {
      const b = JSON.parse(content || '[]')
      return {
        blocks: Array.isArray(b.blocks) ? b.blocks : Array.isArray(b) ? b : [],
        designVars: b.designVars || {
          primaryColor: '#2563eb',
          fontFamily: 'Inter',
          borderRadius: '0.5rem',
        },
        html: '',
      }
    } catch {
      return { blocks: [], designVars: {}, html: '' }
    }
  }

  const selectedData = selectedVersion
    ? parseContent(selectedVersion)
    : { blocks: [], designVars: {}, html: '' }

  const renderContent = (data: any, htmlFallback?: string) => {
    if (isArticle) {
      return (
        <div
          className="w-full max-w-[800px] mx-auto bg-white border p-8 shadow-sm prose"
          dangerouslySetInnerHTML={{ __html: data.html || htmlFallback || '<p>Sem conteúdo.</p>' }}
        />
      )
    }

    return (
      <div
        className="bg-white border shadow-sm mx-auto w-full max-w-[500px]"
        style={
          {
            '--primary': data.designVars.primaryColor,
            '--font-base': data.designVars.fontFamily,
            '--radius': data.designVars.borderRadius,
          } as React.CSSProperties
        }
      >
        {data.blocks.map((b: any) => (
          <div key={b.id} className="relative">
            <BlockPreview block={b} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-[1200px] h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="p-4 border-b shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" />
            Histórico de Revisões
          </DialogTitle>
          <div className="flex gap-2 mr-6">
            <Button
              variant="outline"
              disabled={!selectedVersion}
              onClick={() => onRestore(selectedData)}
            >
              Restaurar Esta Versão
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r bg-slate-50 flex flex-col">
            <div className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">
              Versões Salvas
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 flex flex-col gap-1">
                {loading ? (
                  <div className="p-4 text-center text-sm text-slate-400">Carregando...</div>
                ) : versions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">Nenhuma versão.</div>
                ) : (
                  versions.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVersion(v)}
                      className={cn(
                        'text-left p-3 rounded-lg text-sm border transition-colors',
                        selectedVersion?.id === v.id
                          ? 'bg-blue-50 border-blue-200 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300',
                      )}
                    >
                      <div className="font-semibold text-slate-700">
                        {new Date(v.criado_em).toLocaleString('pt-BR')}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {v.status_publicacao || 'Rascunho'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 flex overflow-hidden bg-slate-200/50">
            <div className="flex-1 flex flex-col border-r border-slate-300">
              <div className="p-2 text-center text-sm font-bold bg-white border-b flex items-center justify-center gap-2">
                Versão Selecionada
              </div>
              <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                {renderContent(selectedData)}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="p-2 text-center text-sm font-bold bg-blue-50 border-b border-blue-100 flex items-center justify-center gap-2 text-blue-800">
                <ArrowLeftRight className="w-4 h-4" /> Versão Atual (Editor)
              </div>
              <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                {renderContent(
                  { blocks: currentBlocks, designVars: currentDesignVars, html: currentHtml },
                  currentHtml,
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
