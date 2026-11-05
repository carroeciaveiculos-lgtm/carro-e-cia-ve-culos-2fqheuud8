import { useEffect, useRef, useState } from 'react'
import { saveAs } from 'file-saver'
import { Download, ImageIcon, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { MAX_FOTOS_CARROSSEL, MIN_FOTOS_CARROSSEL } from '@/lib/ad-limites'
import { mensagemErroAmigavel } from '@/lib/friendly-error'
import {
  liberarCartoes,
  montarCartoesCarrossel,
  type CartaoCarrossel,
} from '@/lib/criativo-carrossel'
import type { DadosCriativoPadrao } from '@/lib/criativo-padrao'

interface Props {
  fotos: string[] // todas as fotos do veículo
  selecionadas: string[] // escolhidas, na ordem dos cartões
  onChange: (fotos: string[]) => void
  dados: DadosCriativoPadrao
  nomeBase: string
}

export function AdCarrossel({ fotos, selecionadas, onChange, dados, nomeBase }: Props) {
  const { toast } = useToast()
  const [cartoes, setCartoes] = useState<CartaoCarrossel[]>([])
  const [montando, setMontando] = useState(false)
  const cartoesRef = useRef<CartaoCarrossel[]>([])
  cartoesRef.current = cartoes

  // Trocou a seleção: os cartões montados ficam velhos, então saem. Também libera as URLs
  // temporárias ao sair da tela.
  useEffect(() => {
    liberarCartoes(cartoesRef.current)
    setCartoes([])
  }, [selecionadas])
  useEffect(() => () => liberarCartoes(cartoesRef.current), [])

  const alternar = (url: string) => {
    if (selecionadas.includes(url)) return onChange(selecionadas.filter((u) => u !== url))
    if (selecionadas.length >= MAX_FOTOS_CARROSSEL) {
      toast({
        title: `Escolha no máximo ${MAX_FOTOS_CARROSSEL} fotos`,
        variant: 'destructive',
      })
      return
    }
    onChange([...selecionadas, url])
  }

  const montar = async () => {
    setMontando(true)
    try {
      setCartoes(await montarCartoesCarrossel(selecionadas, dados, nomeBase))
      toast({ title: 'Cartões montados!' })
    } catch (err: any) {
      toast({
        title: 'Erro ao montar os cartões',
        description: mensagemErroAmigavel(err),
        variant: 'destructive',
      })
    } finally {
      setMontando(false)
    }
  }

  // Vários downloads seguidos: o navegador pode pedir permissão na 1ª vez.
  const baixarTodos = async () => {
    for (const c of cartoes) {
      saveAs(c.blob, c.nome)
      await new Promise((r) => setTimeout(r, 400))
    }
  }

  const pronto = selecionadas.length >= MIN_FOTOS_CARROSSEL

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="w-5 h-5 text-purple-500" /> Fotos do carrossel
        </CardTitle>
        <CardDescription>
          Clique nas fotos na ordem dos cartões (de {MIN_FOTOS_CARROSSEL} a {MAX_FOTOS_CARROSSEL}).
          O 1º cartão leva o preço, o km e o selo; os demais são as fotos inteiras, sem corte.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fotos.length === 0 ? (
          <p className="text-sm text-slate-500">Este veículo não tem fotos cadastradas.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {fotos.map((url) => {
              const posicao = selecionadas.indexOf(url)
              return (
                <button
                  type="button"
                  key={url}
                  onClick={() => alternar(url)}
                  className={`relative aspect-square rounded-md overflow-hidden border-2 ${
                    posicao >= 0 ? 'border-purple-600' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
                  {posicao >= 0 && (
                    <Badge className="absolute top-1 left-1 bg-purple-600">{posicao + 1}</Badge>
                  )}
                </button>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-600">
            {selecionadas.length}/{MAX_FOTOS_CARROSSEL} fotos escolhidas
          </span>
          <Button type="button" variant="outline" disabled={!pronto || montando} onClick={montar}>
            {montando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Montando...
              </>
            ) : (
              'Montar cartões'
            )}
          </Button>
          {cartoes.length > 0 && (
            <Button type="button" onClick={baixarTodos}>
              <Download className="w-4 h-4 mr-2" /> Baixar todos ({cartoes.length})
            </Button>
          )}
        </div>

        {cartoes.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {cartoes.map((c) => (
              <div key={c.indice} className="space-y-1">
                <img
                  src={c.previaUrl}
                  alt={`Cartão ${c.indice}`}
                  className="w-full rounded-md border"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => saveAs(c.blob, c.nome)}
                >
                  <Download className="w-3 h-3 mr-1" /> Cartão {c.indice}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
