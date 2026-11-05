import { Copy, Loader2, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { LIMITES, type CanalAnuncio, type TipoAnuncio } from '@/lib/ad-limites'
import type { VariacaoAnuncio } from '@/services/ad-copies'

// Texto pronto para colar no gerenciador de anúncios (ou no post), com o rótulo de cada campo.
export function variacaoParaTexto(v: VariacaoAnuncio, canal: CanalAnuncio): string {
  if (canal === 'google') {
    return [
      'TÍTULOS',
      ...(v.titulos ?? []).map((t, i) => `${i + 1}. ${t}`),
      '',
      'DESCRIÇÕES',
      ...(v.descricoes ?? []).map((t, i) => `${i + 1}. ${t}`),
    ].join('\n')
  }
  if (canal === 'organico') {
    const tags = (v.hashtags ?? []).map((h) => `#${h.replace(/^#/, '')}`).join(' ')
    return [v.legenda ?? '', tags].filter(Boolean).join('\n\n')
  }
  const partes = [`Texto principal:\n${v.texto_principal ?? ''}`]
  if (v.cartoes?.length) {
    partes.push(`Cartões:\n${v.cartoes.map((c, i) => `${i + 1}. ${c.titulo}`).join('\n')}`)
  } else {
    if (v.titulo) partes.push(`Título: ${v.titulo}`)
    if (v.descricao) partes.push(`Descrição: ${v.descricao}`)
  }
  if (v.cta) partes.push(`Botão/CTA: ${v.cta}`)
  return partes.join('\n\n')
}

export function useCopiar() {
  const { toast } = useToast()
  return async (texto: string, aviso = 'Texto copiado') => {
    try {
      await navigator.clipboard.writeText(texto)
      toast({ title: aviso })
    } catch {
      toast({
        title: 'Não foi possível copiar',
        description: 'Selecione o texto e copie com Ctrl+C.',
        variant: 'destructive',
      })
    }
  }
}

// Um campo com o contador "usados/limite" (fica vermelho se passar).
function Campo({ rotulo, texto, limite }: { rotulo: string; texto?: string; limite?: number }) {
  const copiar = useCopiar()
  if (!texto) return null
  const passou = limite !== undefined && texto.length > limite
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{rotulo}</span>
        <div className="flex items-center gap-1">
          {limite !== undefined && (
            <span className={`text-xs ${passou ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
              {texto.length}/{limite}
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => copiar(texto, `${rotulo} copiado`)}
            aria-label={`Copiar ${rotulo}`}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <p className="text-sm text-slate-800 whitespace-pre-wrap">{texto}</p>
    </div>
  )
}

interface Props {
  variacoes: VariacaoAnuncio[]
  canal: CanalAnuncio
  tipo: TipoAnuncio | null
  // undefined = sem botão Salvar (modo produto genérico, que ainda não persiste)
  onSalvar?: (v: VariacaoAnuncio, indice: number) => void
  salvandoIndice?: number | null
}

export function AdVariacoes({ variacoes, canal, tipo, onSalvar, salvandoIndice }: Props) {
  const copiar = useCopiar()
  return (
    <div className="grid gap-4">
      {variacoes.map((v, i) => (
        <Card key={i} className="border-purple-200">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">Variação {i + 1}</Badge>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copiar(variacaoParaTexto(v, canal), 'Variação copiada')}
                >
                  <Copy className="w-4 h-4 mr-1" /> Copiar tudo
                </Button>
                {onSalvar && (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={salvandoIndice === i}
                    onClick={() => onSalvar(v, i)}
                  >
                    {salvandoIndice === i ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Salvar rascunho
                  </Button>
                )}
              </div>
            </div>

            {canal === 'meta' && (
              <>
                <Campo
                  rotulo="Texto principal"
                  texto={v.texto_principal}
                  limite={LIMITES.meta.textoPrincipal}
                />
                {tipo === 'carrossel' ? (
                  (v.cartoes ?? []).map((c, k) => (
                    <Campo
                      key={k}
                      rotulo={`Cartão ${k + 1}`}
                      texto={c.titulo}
                      limite={LIMITES.meta.tituloCartao}
                    />
                  ))
                ) : (
                  <>
                    <Campo rotulo="Título" texto={v.titulo} limite={LIMITES.meta.titulo} />
                    <Campo rotulo="Descrição" texto={v.descricao} limite={LIMITES.meta.descricao} />
                  </>
                )}
                <Campo rotulo="Botão / CTA" texto={v.cta} />
              </>
            )}

            {canal === 'google' && (
              <>
                {(v.titulos ?? []).map((t, k) => (
                  <Campo
                    key={`t${k}`}
                    rotulo={`Título ${k + 1}`}
                    texto={t}
                    limite={LIMITES.google.titulo}
                  />
                ))}
                {(v.descricoes ?? []).map((t, k) => (
                  <Campo
                    key={`d${k}`}
                    rotulo={`Descrição ${k + 1}`}
                    texto={t}
                    limite={LIMITES.google.descricao}
                  />
                ))}
              </>
            )}

            {canal === 'organico' && (
              <>
                <Campo rotulo="Legenda" texto={v.legenda} limite={LIMITES.organico.legenda} />
                <Campo
                  rotulo="Hashtags"
                  texto={(v.hashtags ?? []).map((h) => `#${h.replace(/^#/, '')}`).join(' ')}
                />
              </>
            )}

            {v.observacoes && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-700">{v.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
