import { ContentBlock } from '@/types/conteudo'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Trash2, ArrowUp, ArrowDown, Sparkles } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAiAssistant } from '@/hooks/use-ai-assistant'

function AiBtn({
  context,
  onApply,
  type,
}: {
  context: string
  onApply: (v: string) => void
  type: 'text' | 'title' | 'image'
}) {
  const { generate, isLoading } = useAiAssistant()

  const handle = async (prompt: string) => {
    const res = await generate(prompt, context)
    if (res) onApply(res)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="text-purple-500 h-9 w-9 shrink-0"
          disabled={isLoading}
        >
          <Sparkles className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {type === 'title' && (
          <DropdownMenuItem
            onClick={() => handle('Crie um título chamativo e persuasivo (máx 6 palavras).')}
          >
            Gerar Título Chamativo
          </DropdownMenuItem>
        )}
        {type === 'image' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500">URL da Imagem</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={data.url || ''}
                  onChange={(e) => onChange({ ...data, url: e.target.value })}
                />
                <Button
                  variant="outline"
                  className="px-2"
                  onClick={() => {
                    const event = new CustomEvent('open-media-selector', {
                      detail: { onSelect: (url: string) => onChange({ ...data, url }) },
                    })
                    window.dispatchEvent(event)
                  }}
                >
                  Mídia
                </Button>
                <AiBtn
                  type="image"
                  context="cars"
                  onApply={(v) =>
                    onChange({
                      ...data,
                      url: `https://img.usecurling.com/p/600/400?q=${encodeURIComponent(v)}`,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Filtro Visual</label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                value={data.filter || ''}
                onChange={(e) => onChange({ ...data, filter: e.target.value })}
              >
                <option value="">Sem filtro</option>
                <option value="brightness-110 contrast-125">Professional Brightness</option>
                <option value="contrast-150 saturate-150">High Contrast</option>
                <option value="grayscale">Soft Grayscale</option>
                <option value="sepia contrast-125 saturate-150">Warm/Vivid</option>
              </select>
            </div>
          </div>
        )}

        {type === 'text' && (
          <>
            <DropdownMenuItem
              onClick={() =>
                handle('Melhore este texto focando em SEO e persuasão, mantenha conciso.')
              }
            >
              Otimizar Texto (SEO)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handle('Corrija a gramática e torne o tom mais profissional.')}
            >
              Corrigir Gramática
            </DropdownMenuItem>
          </>
        )}
        {type === 'image' && (
          <DropdownMenuItem
            onClick={() =>
              handle(
                'Sugira uma query curta em inglês (max 3 palavras) para buscar uma imagem relacionada a este contexto. Apenas a query.',
              )
            }
          >
            Sugerir Imagem
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function BlockEditForm({
  block,
  onChange,
  onStyleChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: any) {
  const { data, type, style } = block

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h3 className="font-bold uppercase tracking-wider text-sm text-slate-700">Editar {type}</h3>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={onMoveUp}>
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={onMoveDown}>
            <ArrowDown className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="destructive" className="h-8 w-8" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {(type === 'flex' || type === 'grid') && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500">Gap (Espaçamento)</label>
            <Input
              value={style?.gap || ''}
              onChange={(e) => onStyleChange({ ...style, gap: e.target.value })}
              placeholder="ex: 1rem, 20px"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Padding Interno</label>
            <Input
              value={style?.padding || ''}
              onChange={(e) => onStyleChange({ ...style, padding: e.target.value })}
              placeholder="ex: 2rem"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Cor de Fundo (opcional)</label>
            <Input
              value={style?.backgroundColor || ''}
              onChange={(e) => onStyleChange({ ...style, backgroundColor: e.target.value })}
              placeholder="ex: #f8fafc"
              className="mt-1"
            />
          </div>
          {type === 'flex' && (
            <div>
              <label className="text-xs font-bold text-slate-500">Direção (flex-direction)</label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1"
                value={style?.flexDirection || 'row'}
                onChange={(e) => onStyleChange({ ...style, flexDirection: e.target.value })}
              >
                <option value="row">Linha (Row)</option>
                <option value="column">Coluna (Column)</option>
              </select>
            </div>
          )}
          {type === 'grid' && (
            <div>
              <label className="text-xs font-bold text-slate-500">
                Colunas (grid-template-columns)
              </label>
              <Input
                value={style?.gridTemplateColumns || ''}
                onChange={(e) => onStyleChange({ ...style, gridTemplateColumns: e.target.value })}
                placeholder="ex: repeat(2, 1fr)"
                className="mt-1"
              />
            </div>
          )}
        </div>
      )}

      {type === 'hero' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500">Título</label>
            <div className="flex gap-2 mt-1">
              <Input
                value={data.title || ''}
                onChange={(e) => onChange({ ...data, title: e.target.value })}
              />
              <AiBtn
                type="title"
                context={data.title}
                onApply={(v) => onChange({ ...data, title: v })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Subtítulo</label>
            <div className="flex gap-2 mt-1">
              <Textarea
                value={data.subtitle || ''}
                onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
              />
              <AiBtn
                type="text"
                context={data.subtitle}
                onApply={(v) => onChange({ ...data, subtitle: v })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Texto do Botão (CTA)</label>
            <Input
              value={data.cta_text || ''}
              onChange={(e) => onChange({ ...data, cta_text: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">URL da Imagem de Fundo</label>
            <div className="flex gap-2 mt-1">
              <Input
                value={data.image_url || ''}
                onChange={(e) => onChange({ ...data, image_url: e.target.value })}
              />
              <Button
                variant="outline"
                className="px-2"
                onClick={() => {
                  const event = new CustomEvent('open-media-selector', {
                    detail: { onSelect: (url: string) => onChange({ ...data, image_url: url }) },
                  })
                  window.dispatchEvent(event)
                }}
              >
                Mídia
              </Button>
              <AiBtn
                type="image"
                context={data.title}
                onApply={(v) =>
                  onChange({
                    ...data,
                    image_url: `https://img.usecurling.com/p/1200/600?q=${encodeURIComponent(v)}`,
                  })
                }
              />
            </div>
          </div>
        </div>
      )}

      {type === 'text' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 flex justify-between items-center">
              Conteúdo (Suporta HTML)
              <AiBtn
                type="text"
                context={data.html}
                onApply={(v) => onChange({ ...data, html: v })}
              />
            </label>
            <Textarea
              className="h-64 font-mono text-sm mt-1 bg-slate-50"
              value={data.html || ''}
              onChange={(e) => onChange({ ...data, html: e.target.value })}
            />
          </div>
        </div>
      )}

      {type === 'gallery' && (
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-500 flex justify-between items-center">
            URLs das Imagens (uma por linha)
            <AiBtn
              type="image"
              context="cars"
              onApply={(v) => {
                const urls = [1, 2, 3].map(
                  (i) =>
                    `https://img.usecurling.com/p/600/400?q=${encodeURIComponent(v)}&seed=${i}`,
                )
                onChange({ ...data, images: urls })
              }}
            />
          </label>
          <Textarea
            className="h-48 font-mono text-xs bg-slate-50"
            value={(data.images || []).join('\n')}
            onChange={(e) => onChange({ ...data, images: e.target.value.split('\n') })}
          />
        </div>
      )}

      {type === 'vehicle-card' && (
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-500">ID do Veículo</label>
          <Input
            placeholder="Ex: uuid-do-veiculo"
            value={data.veiculo_id || ''}
            onChange={(e) => onChange({ ...data, veiculo_id: e.target.value })}
          />
          <p className="text-[10px] text-slate-400">Insira o ID do veículo para exibir seu card.</p>
        </div>
      )}

      {type === 'stock-slider' && (
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-500">Limite de Veículos</label>
          <Input
            type="number"
            value={data.limit || 5}
            onChange={(e) => onChange({ ...data, limit: parseInt(e.target.value) })}
          />
        </div>
      )}

      {type === 'inventory-grid' && (
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-500">Categoria (opcional)</label>
          <Input
            placeholder="Ex: SUV, Sedan"
            value={data.categoria || ''}
            onChange={(e) => onChange({ ...data, categoria: e.target.value })}
          />
          <label className="text-xs font-bold text-slate-500 mt-2 block">Limite</label>
          <Input
            type="number"
            value={data.limit || 6}
            onChange={(e) => onChange({ ...data, limit: parseInt(e.target.value) })}
          />
        </div>
      )}

      {type === 'faq' && (
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-500">Itens FAQ</label>
          {(data.items || []).map((item: any, i: number) => (
            <div
              key={i}
              className="border border-slate-200 p-3 rounded-lg space-y-3 relative bg-slate-50"
            >
              <Input
                placeholder="Pergunta"
                value={item.q}
                onChange={(e) => {
                  const newItems = [...data.items]
                  newItems[i].q = e.target.value
                  onChange({ ...data, items: newItems })
                }}
              />
              <Textarea
                placeholder="Resposta"
                value={item.a}
                onChange={(e) => {
                  const newItems = [...data.items]
                  newItems[i].a = e.target.value
                  onChange({ ...data, items: newItems })
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 text-red-500 h-8 w-8 bg-white"
                onClick={() => {
                  const newItems = data.items.filter((_: any, idx: number) => idx !== i)
                  onChange({ ...data, items: newItems })
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full border-dashed border-2"
            onClick={() => onChange({ ...data, items: [...(data.items || []), { q: '', a: '' }] })}
          >
            + Adicionar Nova Pergunta
          </Button>
        </div>
      )}
    </div>
  )
}
