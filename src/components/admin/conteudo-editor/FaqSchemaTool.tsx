import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Copy, CheckCircle2 } from 'lucide-react'
import { extractFAQSchema } from '@/lib/blog-utils'
import { useToast } from '@/hooks/use-toast'

interface FaqSchemaToolProps {
  content: string
  onSchemaChange: (schema: string) => void
  existingSchema?: string
}

export function FaqSchemaTool({ content, onSchemaChange, existingSchema }: FaqSchemaToolProps) {
  const [schema, setSchema] = useState(existingSchema || '')
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generateSchema = () => {
    const faqs = extractFAQSchema(content)
    if (!faqs || faqs.length === 0) {
      toast({
        title: 'Nenhuma FAQ encontrada',
        description:
          'Adicione uma seção com H2 "FAQ" ou "Perguntas Frequentes" seguida de H3 com perguntas e respostas.',
        variant: 'destructive',
      })
      return
    }

    const jsonLd = JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer,
          },
        })),
      },
      null,
      2,
    )

    setSchema(jsonLd)
    onSchemaChange(jsonLd)
    toast({ title: 'FAQ Schema gerado!', description: `${faqs.length} perguntas encontradas.` })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(schema)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">FAQ Schema (JSON-LD)</h4>
        {schema && <Badge className="bg-green-100 text-green-700">Gerado</Badge>}
      </div>
      <Button size="sm" variant="outline" className="w-full" onClick={generateSchema}>
        <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
        Gerar FAQ Schema
      </Button>
      {schema && (
        <>
          <Textarea
            value={schema}
            onChange={(e) => {
              setSchema(e.target.value)
              onSchemaChange(e.target.value)
            }}
            className="text-xs font-mono h-32 resize-none"
            placeholder="JSON-LD aparecerá aqui..."
          />
          <Button size="sm" variant="ghost" className="w-full" onClick={handleCopy}>
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" /> Copiar JSON-LD
              </>
            )}
          </Button>
        </>
      )}
    </div>
  )
}
