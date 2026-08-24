import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bold, Italic, List, ListOrdered } from 'lucide-react'
import { parseMarkdown } from '@/lib/markdown'

interface RichTextEditorProps {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
}

// Editor básico (pedido da Adriana, 23/08/2026): negrito, itálico,
// marcadores, numeração e "tamanho" (título grande/médio/normal).
//
// Achado 24/08/2026, testado ao vivo: a primeira versão usava
// contentEditable + document.execCommand — em testes reais, selecionar
// texto e clicar num botão da barra às vezes APAGAVA o conteúdo inteiro
// (bug conhecido da combinação contentEditable + seleção de texto, mesmo
// motivo pelo qual ferramentas como TipTap/Slate existem). Reescrito pra
// guardar o texto como markdown simples (**negrito**, *itálico*, `- item`,
// `1. item`, `# título`) numa caixa de texto comum — a mesma sintaxe que o
// blog do site já usa (`src/lib/markdown.ts`, função `parseMarkdown`, já
// testada em produção) — com prévia ao vivo abaixo. Os botões inserem a
// sintaxe ao redor do texto selecionado usando `textarea.selectionStart/
// selectionEnd`, API nativa do navegador, sem os problemas de seleção do
// contentEditable.
export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const aplicarNasLinhas = (transformar: (linha: string) => string) => {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart, selectionEnd } = el
    const inicioLinha = value.lastIndexOf('\n', selectionStart - 1) + 1
    let fimLinha = value.indexOf('\n', selectionEnd)
    if (fimLinha === -1) fimLinha = value.length

    const trecho = value.slice(inicioLinha, fimLinha)
    const linhas = trecho.split('\n').map(transformar)
    const novoTrecho = linhas.join('\n')
    const novoValor = value.slice(0, inicioLinha) + novoTrecho + value.slice(fimLinha)
    onChange(novoValor)

    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = inicioLinha
      el.selectionEnd = inicioLinha + novoTrecho.length
    })
  }

  const envolverSelecao = (marcador: string) => {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart, selectionEnd } = el
    const selecionado = value.slice(selectionStart, selectionEnd)
    const novoValor =
      value.slice(0, selectionStart) +
      marcador +
      selecionado +
      marcador +
      value.slice(selectionEnd)
    onChange(novoValor)

    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = selectionStart + marcador.length
      el.selectionEnd = selectionStart + marcador.length + selecionado.length
    })
  }

  const aplicarLista = (prefixo: (i: number) => string) => {
    let contador = 0
    aplicarNasLinhas((linha) => {
      const semMarcador = linha.replace(/^\s*([-*+]|\d+\.)\s+/, '')
      contador += 1
      return `${prefixo(contador)}${semMarcador}`
    })
  }

  const aplicarTitulo = (nivel: 0 | 1 | 2 | 3) => {
    aplicarNasLinhas((linha) => {
      const semTitulo = linha.replace(/^#{1,3}\s+/, '')
      if (nivel === 0) return semTitulo
      return `${'#'.repeat(nivel)} ${semTitulo}`
    })
  }

  return (
    <div className="space-y-2">
      <div className="border rounded-md">
        <div className="flex items-center gap-1 border-b p-1.5 flex-wrap bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => envolverSelecao('**')}
            title="Negrito"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => envolverSelecao('*')}
            title="Itálico"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => aplicarLista(() => '- ')}
            title="Marcadores"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => aplicarLista((i) => `${i}. `)}
            title="Numeração"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <div className="h-5 w-px bg-border mx-1" />
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => aplicarTitulo(1)}>
            Título grande
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => aplicarTitulo(2)}>
            Título médio
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => aplicarTitulo(0)}>
            Normal
          </Button>
        </div>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={8}
          className="border-0 rounded-t-none focus-visible:ring-0"
        />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Prévia:</p>
        <div
          className="prose prose-sm max-w-none border rounded-md p-3 bg-muted/20 min-h-[60px]"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(value) || '<span class="text-muted-foreground">Nada digitado ainda</span>' }}
        />
      </div>
    </div>
  )
}
