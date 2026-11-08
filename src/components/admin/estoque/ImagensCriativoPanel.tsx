import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { mensagemErroAmigavel } from '@/lib/friendly-error'
import {
  FOTOS_DO_CRIATIVO,
  ORIGEM_CADASTRO,
  criativoDesatualizado,
  gerarCriativosDoVeiculo,
  type ResultadoGeracao,
} from '@/lib/criativo-cadastro'
import { enviarCriativosParaAprovacao } from '@/services/social-posts'
import { Wand2, Loader2, ExternalLink, AlertTriangle, Send, Image as ImageIcon } from 'lucide-react'

// Seção "Imagens para criativo de anúncios" do cadastro do veículo (07/11/2026).
// O operador escolhe 4 fotos (qualquer uma: a regra de foto sem marca de IA não vale aqui) e
// clica em "Gerar criativos". Os dados (marca, modelo, preço, ano, km...) vêm do cadastro.
// `onAtualizar` devolve ao formulário as colunas gravadas, para um "Salvar" posterior não
// sobrescrever com valores velhos.

interface Props {
  veiculo: any
  onAtualizar: (parcial: ResultadoGeracao) => void
}

interface CriativoSalvo {
  id: string
  formato: string | null
  imagem_url: string
}

const ROTULO_FORMATO: Record<string, string> = {
  '4:5': 'Feed 4:5 (Instagram e Facebook)',
  '9:16': 'Stories 9:16 (Instagram)',
  '1:1': 'Quadrado 1:1 (tráfego pago)',
}

const ehVideo = (url: string) => /\.(mp4|mov|webm)(\?|$)/i.test(url)

export function ImagensCriativoPanel({ veiculo, onAtualizar }: Props) {
  const { toast } = useToast()
  const fotos: string[] = (Array.isArray(veiculo.fotos) ? veiculo.fotos : []).filter(
    (u: string) => !ehVideo(u),
  )
  const [escolhidas, setEscolhidas] = useState<string[]>([])
  const [gerando, setGerando] = useState(false)
  const [progresso, setProgresso] = useState('')
  const [salvos, setSalvos] = useState<CriativoSalvo[]>([])
  const [enviando, setEnviando] = useState(false)

  // Seleção salva antes (se todas as fotos ainda existem no cadastro)
  useEffect(() => {
    const salvas: string[] = Array.isArray(veiculo.fotos_criativo) ? veiculo.fotos_criativo : []
    setEscolhidas(
      salvas.length === FOTOS_DO_CRIATIVO && salvas.every((u) => fotos.includes(u)) ? salvas : [],
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [veiculo.id])

  const carregarSalvos = useCallback(async () => {
    if (!veiculo.id) return setSalvos([])
    const { data } = await supabase
      .from('veiculo_criativos')
      .select('id, formato, imagem_url')
      .eq('veiculo_id', veiculo.id)
      .eq('origem', ORIGEM_CADASTRO)
      .order('criado_em', { ascending: false })
    setSalvos((data as CriativoSalvo[]) || [])
  }, [veiculo.id])

  useEffect(() => {
    carregarSalvos()
  }, [carregarSalvos])

  const alternar = (url: string) => {
    setEscolhidas((atual) => {
      if (atual.includes(url)) return atual.filter((u) => u !== url)
      if (atual.length >= FOTOS_DO_CRIATIVO) {
        toast({ title: `Escolha no máximo ${FOTOS_DO_CRIATIVO} fotos`, variant: 'destructive' })
        return atual
      }
      return [...atual, url]
    })
  }

  const gerar = async () => {
    setGerando(true)
    try {
      const resultado = await gerarCriativosDoVeiculo(veiculo, escolhidas, setProgresso)
      onAtualizar(resultado)
      await carregarSalvos()
      toast({ title: 'Criativos gerados e salvos na pasta do veículo' })
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar os criativos',
        description: mensagemErroAmigavel(err),
        variant: 'destructive',
      })
    } finally {
      setGerando(false)
      setProgresso('')
    }
  }

  const enviar = async () => {
    setEnviando(true)
    const r = await enviarCriativosParaAprovacao(veiculo.id)
    setEnviando(false)
    if (r.erro) {
      toast({ title: 'Não foi possível enviar', description: r.erro, variant: 'destructive' })
    } else if (r.criados === 0) {
      toast({
        title: 'Nada novo para enviar',
        description: 'Já existem posts deste veículo aguardando aprovação.',
      })
    } else {
      toast({
        title: `${r.criados} post(s) enviados para aprovação`,
        description: 'Aprove na Central Social (Aprovações).',
      })
    }
  }

  const desatualizado = criativoDesatualizado(veiculo)
  const podeGerar = !!veiculo.id && escolhidas.length === FOTOS_DO_CRIATIVO && !gerando

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <h3 className="font-bold flex items-center gap-2 text-slate-800 border-b pb-2 mb-1">
        <ImageIcon className="w-5 h-5 text-blue-600" /> Imagens para criativo de anúncios
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Escolha {FOTOS_DO_CRIATIVO} fotos (a primeira que você clicar é a principal). O sistema
        monta o criativo no Modelo Padrão com os dados deste cadastro (marca, modelo, preço, ano,
        km) e guarda os formatos na pasta do veículo. Foto original, sem IA.
      </p>

      {!veiculo.id ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
          Salve o veículo primeiro para gerar os criativos.
        </p>
      ) : fotos.length < FOTOS_DO_CRIATIVO ? (
        <p className="text-sm text-slate-500 bg-slate-50 border rounded p-3">
          Cadastre pelo menos {FOTOS_DO_CRIATIVO} fotos na galeria acima.
        </p>
      ) : (
        <>
          {desatualizado && (
            <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-3 mb-4">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Preço, km, ano ou situação deste veículo mudaram depois que o criativo foi gerado.
                Salve o veículo e clique em "Gerar criativos" de novo, senão a imagem mostra dados
                velhos.
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-bold text-slate-600">
              {escolhidas.length}/{FOTOS_DO_CRIATIVO} fotos escolhidas
            </Label>
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => setEscolhidas(fotos.slice(0, FOTOS_DO_CRIATIVO))}
              >
                Usar as {FOTOS_DO_CRIATIVO} primeiras
              </button>
              {escolhidas.length > 0 && (
                <button
                  type="button"
                  className="text-slate-500 hover:underline"
                  onClick={() => setEscolhidas([])}
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-4">
            {fotos.map((url) => {
              const ordem = escolhidas.indexOf(url)
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => alternar(url)}
                  disabled={gerando}
                  className={cn(
                    'relative aspect-square rounded overflow-hidden border-2',
                    ordem >= 0
                      ? 'border-blue-600 ring-2 ring-blue-300'
                      : 'border-transparent hover:border-slate-300',
                  )}
                >
                  {/* crossOrigin: a mesma foto é desenhada no canvas logo depois; sem isso o
                      navegador reaproveita a cópia sem CORS e recusa. */}
                  <img
                    src={url}
                    alt=""
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                  {ordem >= 0 && (
                    <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {ordem + 1}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button size="sm" onClick={gerar} disabled={!podeGerar}>
              {gerando ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-1" />
              )}
              {salvos.length ? 'Gerar criativos de novo' : 'Gerar criativos'}
            </Button>
            {gerando && <span className="text-xs text-slate-500">{progresso}</span>}
            {!gerando && escolhidas.length !== FOTOS_DO_CRIATIVO && (
              <span className="text-xs text-slate-500">
                Escolha exatamente {FOTOS_DO_CRIATIVO} fotos para liberar o botão.
              </span>
            )}
          </div>
          {salvos.length > 0 && (
            <p className="text-[11px] text-slate-500 mt-2">
              Gerar de novo substitui o conjunto anterior desta seção. Os arquivos antigos continuam
              no armazenamento até serem removidos manualmente.
            </p>
          )}

          {salvos.length > 0 && (
            <div className="mt-5 pt-4 border-t">
              <Label className="text-xs font-bold text-slate-600 mb-2 block">
                Criativos prontos deste veículo
              </Label>
              <div className="grid grid-cols-3 gap-3 max-w-xl">
                {salvos.map((c) => (
                  <a
                    key={c.id}
                    href={c.imagem_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="space-y-1 group"
                  >
                    <img
                      src={c.imagem_url}
                      alt={c.formato || ''}
                      className="w-full h-40 object-contain rounded border bg-slate-100"
                    />
                    <p className="text-[11px] text-slate-600 flex items-center gap-1 group-hover:underline">
                      <ExternalLink className="w-3 h-3" />
                      {ROTULO_FORMATO[c.formato || ''] || c.formato}
                    </p>
                  </a>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={enviar}
                  disabled={enviando || desatualizado || gerando}
                >
                  {enviando ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-1" />
                  )}
                  Enviar para aprovação
                </Button>
                <span className="text-[11px] text-slate-500">
                  Cria 3 posts para você aprovar: feed Facebook, feed Instagram e Stories Instagram.
                  Nada é publicado antes da aprovação.
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
