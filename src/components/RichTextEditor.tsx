import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bold, Italic, List, ListOrdered } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

// Editor básico (pedido da Adriana, 23/08/2026): negrito, itálico, marcadores,
// numeração e tamanho da fonte. Usa contentEditable + document.execCommand
// em vez de uma lib como TipTap — evita adicionar uma dependência nova pra
// uma necessidade que a própria Adriana descreveu como "básica".
export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null)

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus()
    document.execCommand(cmd, false, arg)
    onChange(ref.current?.innerHTML || '')
  }

  return (
    <div className="border rounded-md">
      <div className="flex items-center gap-1 border-b p-1.5 flex-wrap bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('bold')}
          title="Negrito"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('italic')}
          title="Itálico"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('insertUnorderedList')}
          title="Marcadores"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('insertOrderedList')}
          title="Numeração"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Select onValueChange={(v) => exec('fontSize', v)}>
          <SelectTrigger className="h-8 w-32" onMouseDown={(e) => e.preventDefault()}>
            <SelectValue placeholder="Tamanho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">Pequeno</SelectItem>
            <SelectItem value="3">Normal</SelectItem>
            <SelectItem value="5">Grande</SelectItem>
            <SelectItem value="7">Enorme</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className="min-h-[180px] p-3 text-sm focus:outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
        style={{ whiteSpace: 'pre-wrap' }}
        onInput={() => onChange(ref.current?.innerHTML || '')}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  )
}
