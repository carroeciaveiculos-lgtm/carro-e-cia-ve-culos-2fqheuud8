import { useEffect, useMemo, useState } from 'react'
import { Check, Loader2, Sparkles, Trash2, Video } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useToast } from '@/hooks/use-toast'
import { AdCarrossel } from '@/components/admin/ads/AdCarrossel'
import { AdVariacoes, useCopiar, variacaoParaTexto } from '@/components/admin/ads/AdVariacoes'
import { CriativoAnuncioPanel } from '@/components/admin/estoque/CriativoAnuncioPanel'
import {
  CANAIS,
  MIN_FOTOS_CARROSSEL,
  TIPOS_ANUNCIO,
  TONS_DE_VOZ,
  tipoSeAplica,
  type CanalAnuncio,
  type TipoAnuncio,
} from '@/lib/ad-limites'
import { dadosPadraoDoVeiculo } from '@/lib/criativo-carrossel'
import { mensagemErroAmigavel } from '@/lib/friendly-error'
import { getVehicleVideos } from '@/lib/image-utils'
import {
  atualizarStatusAdCopy,
  gerarAnuncio,
  listarAdCopies,
  listarVeiculosParaAnuncio,
  salvarAdCopy,
  type AdCopy,
  type StatusAdCopy,
  type VariacaoAnuncio,
} from '@/services/ad-copies'
import { getVeiculoById } from '@/services/veiculos'

const PUBLICO_PADRAO = 'Pessoas buscando carro seminovo em Uberaba e região'
const PRODUTOS_GENERICOS = [
  'Consignação de Veículos',
  'Financiamento Auto',
  'Avaliação de Troca',
  'Venda de Veículos',
]
const ehVideo = (url: string) => /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url)
const nomeCanal = (c: CanalAnuncio) => CANAIS.find((x) => x.valor === c)?.nome ?? c
const nomeTipo = (t: TipoAnuncio | null) => TIPOS_ANUNCIO.find((x) => x.valor === t)?.nome ?? ''

const COR_STATUS: Record<StatusAdCopy, string> = {
  rascunho: 'bg-slate-100 text-slate-700',
  aprovado: 'bg-green-100 text-green-700',
  descartado: 'bg-red-100 text-red-700',
}

interface Resultado {
  variacoes: VariacaoAnuncio[]
  avisos: string[]
  canal: CanalAnuncio
  tipo: TipoAnuncio | null
  comVeiculo: boolean
}

export function AdCopyGenerator() {
  const { toast } = useToast()
  const copiar = useCopiar()

  const [modo, setModo] = useState<'veiculo' | 'produto'>('veiculo')
  const [lista, setLista] = useState<any[]>([])
  const [veiculoId, setVeiculoId] = useState('')
  const [veiculo, setVeiculo] = useState<any>(null)
  const [canal, setCanal] = useState<CanalAnuncio>('meta')
  const [tipo, setTipo] = useState<TipoAnuncio>('estatico')
  const [produto, setProduto] = useState(PRODUTOS_GENERICOS[0])
  const [publico, setPublico] = useState(PUBLICO_PADRAO)
  const [tom, setTom] = useState<string>(TONS_DE_VOZ[0])
  const [fotosCarrossel, setFotosCarrossel] = useState<string[]>([])
  const [videoSel, setVideoSel] = useState('')
  const [gerando, setGerando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [salvandoIdx, setSalvandoIdx] = useState<number | null>(null)
  const [salvos, setSalvos] = useState<AdCopy[]>([])

  const porVeiculo = modo === 'veiculo'
  const tipoEfetivo: TipoAnuncio | null = porVeiculo && tipoSeAplica(canal) ? tipo : null

  useEffect(() => {
    listarVeiculosParaAnuncio().then(({ data, error }) => {
      if (error) {
        toast({
          title: 'Erro ao carregar o estoque',
          description: mensagemErroAmigavel(error),
          variant: 'destructive',
        })
      } else setLista(data ?? [])
    })
    // carrega uma vez ao abrir a aba
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const recarregarSalvos = async (id: string) => {
    const { data, error } = await listarAdCopies(id)
    if (!error) setSalvos(data)
  }

  // Trocou o veículo: limpa o que era do anterior e carrega o cadastro completo.
  useEffect(() => {
    setVeiculo(null)
    setFotosCarrossel([])
    setVideoSel('')
    setResultado(null)
    setSalvos([])
    if (!veiculoId) return
    let cancelado = false
    ;(async () => {
      const [v, s] = await Promise.all([getVeiculoById(veiculoId), listarAdCopies(veiculoId)])
      if (cancelado) return
      if (v.error) {
        toast({
          title: 'Erro ao carregar o veículo',
          description: mensagemErroAmigavel(v.error),
          variant: 'destructive',
        })
      } else setVeiculo(v.data)
      if (!s.error) setSalvos(s.data)
    })()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [veiculoId])

  const fotos: string[] = useMemo(
    () =>
      Array.isArray(veiculo?.fotos)
        ? veiculo.fotos.filter((f: unknown) => typeof f === 'string' && !ehVideo(f))
        : [],
    [veiculo],
  )
  const videos: string[] = useMemo(
    () =>
      Array.from(
        new Set(
          [veiculo?.video_url, ...getVehicleVideos(veiculo?.videos, veiculo?.fotos)].filter(
            (u): u is string => typeof u === 'string' && u !== '',
          ),
        ),
      ),
    [veiculo],
  )
  useEffect(() => {
    if (videos.length === 1) setVideoSel(videos[0])
  }, [videos])

  const nomeBase = String(veiculo?.placa || veiculo?.id || 'veiculo')
  const dadosPadrao = useMemo(() => (veiculo ? dadosPadraoDoVeiculo(veiculo) : null), [veiculo])

  const faltaAlgo =
    porVeiculo &&
    (!veiculo ||
      (tipoEfetivo === 'carrossel' && fotosCarrossel.length < MIN_FOTOS_CARROSSEL) ||
      (tipoEfetivo === 'video' && !videoSel))

  const gerar = async () => {
    setGerando(true)
    setResultado(null)
    const { data, error } = await gerarAnuncio({
      veiculo_id: porVeiculo ? veiculoId : undefined,
      canal,
      tipo_anuncio: tipoEfetivo ?? undefined,
      num_cartoes: tipoEfetivo === 'carrossel' ? fotosCarrossel.length : undefined,
      product: porVeiculo ? 'Venda de Veículos' : produto,
      audience: publico,
      tone: tom,
    })
    setGerando(false)
    if (error || !data) {
      toast({
        title: 'Erro ao gerar o anúncio',
        description: mensagemErroAmigavel(error),
        variant: 'destructive',
      })
      return
    }
    setResultado({
      variacoes: data.variations ?? [],
      avisos: data.avisos ?? [],
      canal,
      tipo: tipoEfetivo,
      comVeiculo: porVeiculo,
    })
  }

  const salvar = async (v: VariacaoAnuncio, indice: number) => {
    if (!veiculo || !resultado) return
    setSalvandoIdx(indice)
    const { error } = await salvarAdCopy({
      veiculo_id: veiculo.id,
      produto: 'veiculo',
      canal: resultado.canal,
      tipo_anuncio: resultado.tipo,
      tom,
      publico,
      conteudo: v,
      fotos_selecionadas: resultado.tipo === 'carrossel' ? fotosCarrossel : [],
      video_url: resultado.tipo === 'video' ? videoSel || null : null,
    })
    setSalvandoIdx(null)
    if (error) {
      toast({
        title: 'Erro ao salvar o rascunho',
        description: mensagemErroAmigavel(error),
        variant: 'destructive',
      })
      return
    }
    toast({ title: 'Rascunho salvo' })
    recarregarSalvos(veiculo.id)
  }

  const mudarStatus = async (item: AdCopy, status: StatusAdCopy) => {
    const { error } = await atualizarStatusAdCopy(item.id, status)
    if (error) {
      toast({
        title: 'Erro ao atualizar o status',
        description: mensagemErroAmigavel(error),
        variant: 'destructive',
      })
      return
    }
    if (veiculo) recarregarSalvos(veiculo.id)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" /> Criador de Anúncios IA
          </CardTitle>
          <CardDescription>
            Gera os textos de anúncio para Meta, Google e orgânico. Nada é publicado: você copia,
            baixa e sobe no gerenciador. Preço e quilometragem nunca vêm da IA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 max-w-3xl">
          <div className="space-y-2">
            <Label>O que você quer anunciar?</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={modo}
              onValueChange={(v) => v && setModo(v as 'veiculo' | 'produto')}
              className="justify-start"
            >
              <ToggleGroupItem value="veiculo">Veículo do estoque</ToggleGroupItem>
              <ToggleGroupItem value="produto">Consignação, financiamento ou troca</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {porVeiculo ? (
            <div className="space-y-2">
              <Label>Veículo</Label>
              <Select value={veiculoId} onValueChange={setVeiculoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um veículo disponível" />
                </SelectTrigger>
                <SelectContent>
                  {lista.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {[v.marca, v.modelo, v.versao].filter(Boolean).join(' ')}
                      {v.ano_modelo ? ` • ${v.ano_modelo}` : ''}
                      {v.placa ? ` • ${v.placa}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Produto / Serviço</Label>
              <Select value={produto} onValueChange={setProduto}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUTOS_GENERICOS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Neste modo o texto é genérico (sem condições reais) e não fica salvo. O catálogo de
                ofertas de consórcio, seguro e financiamento vem na próxima fase.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Onde vai aparecer</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={canal}
              onValueChange={(v) => v && setCanal(v as CanalAnuncio)}
              className="justify-start flex-wrap"
            >
              {CANAIS.map((c) => (
                <ToggleGroupItem key={c.valor} value={c.valor} title={c.descricao}>
                  {c.nome}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-xs text-slate-500">
              {CANAIS.find((c) => c.valor === canal)?.descricao}
            </p>
          </div>

          {porVeiculo && tipoSeAplica(canal) && (
            <div className="space-y-2">
              <Label>Tipo de anúncio</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                value={tipo}
                onValueChange={(v) => v && setTipo(v as TipoAnuncio)}
                className="justify-start flex-wrap"
              >
                {TIPOS_ANUNCIO.map((t) => (
                  <ToggleGroupItem key={t.valor} value={t.valor} title={t.descricao}>
                    {t.nome}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="text-xs text-slate-500">
                {TIPOS_ANUNCIO.find((t) => t.valor === tipo)?.descricao}
              </p>
            </div>
          )}
          {porVeiculo && !tipoSeAplica(canal) && (
            <p className="text-xs text-slate-500">
              O anúncio de pesquisa do Google é só texto: não usa imagem nem vídeo do veículo.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tom de voz</Label>
              <Select value={tom} onValueChange={setTom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONS_DE_VOZ.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Público-alvo</Label>
              <Input
                value={publico}
                onChange={(e) => setPublico(e.target.value)}
                placeholder={PUBLICO_PADRAO}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {porVeiculo && veiculo && tipoEfetivo === 'carrossel' && dadosPadrao && (
        <AdCarrossel
          fotos={fotos}
          selecionadas={fotosCarrossel}
          onChange={setFotosCarrossel}
          dados={dadosPadrao}
          nomeBase={nomeBase}
        />
      )}

      {porVeiculo && veiculo && tipoEfetivo === 'video' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Video className="w-5 h-5 text-purple-500" /> Vídeo do anúncio
            </CardTitle>
            <CardDescription>
              Usa um vídeo que já está no cadastro do veículo; nenhum vídeo novo é criado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-w-xl">
            {videos.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Este veículo não tem vídeo cadastrado. Envie um no cadastro do Estoque ou escolha
                  outro tipo de anúncio.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Select value={videoSel} onValueChange={setVideoSel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha o vídeo" />
                  </SelectTrigger>
                  <SelectContent>
                    {videos.map((u, i) => (
                      <SelectItem key={u} value={u}>
                        Vídeo {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {videoSel && (
                  <video
                    src={videoSel}
                    controls
                    preload="metadata"
                    className="w-full max-h-72 rounded-md bg-black"
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {porVeiculo && veiculo && tipoEfetivo === 'estatico' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Imagem do anúncio (Padrão Carro e Cia)</CardTitle>
            <CardDescription>
              O mesmo gerador de criativo do cadastro do veículo: preço, km e selo desenhados a
              partir do cadastro. Baixe a imagem e use junto com o texto abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CriativoAnuncioPanel veiculo={veiculo} />
          </CardContent>
        </Card>
      )}

      <div>
        <Button
          onClick={gerar}
          disabled={gerando || (porVeiculo && !veiculoId) || !!faltaAlgo}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {gerando ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" /> Gerar textos
            </>
          )}
        </Button>
        {porVeiculo && !veiculoId && (
          <p className="text-xs text-slate-500 mt-2">Escolha um veículo para começar.</p>
        )}
        {porVeiculo && !!veiculoId && !!faltaAlgo && veiculo && (
          <p className="text-xs text-slate-500 mt-2">
            {tipoEfetivo === 'carrossel'
              ? `Escolha ao menos ${MIN_FOTOS_CARROSSEL} fotos para o carrossel.`
              : 'Escolha o vídeo do anúncio.'}
          </p>
        )}
      </div>

      {resultado && (
        <div className="space-y-3">
          {resultado.avisos.map((a) => (
            <Alert key={a}>
              <AlertDescription>{a}</AlertDescription>
            </Alert>
          ))}
          <AdVariacoes
            variacoes={resultado.variacoes}
            canal={resultado.canal}
            tipo={resultado.tipo}
            onSalvar={resultado.comVeiculo ? salvar : undefined}
            salvandoIndice={salvandoIdx}
          />
        </div>
      )}

      {porVeiculo && veiculo && salvos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anúncios salvos deste veículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {salvos.map((s) => (
              <div key={s.id} className="border rounded-md p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={COR_STATUS[s.status]}>{s.status}</Badge>
                  <Badge variant="outline">{nomeCanal(s.canal)}</Badge>
                  {s.tipo_anuncio && <Badge variant="outline">{nomeTipo(s.tipo_anuncio)}</Badge>}
                  <span className="text-xs text-slate-400">
                    {new Date(s.criado_em).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-slate-700 line-clamp-3 whitespace-pre-wrap">
                  {variacaoParaTexto(s.conteudo, s.canal)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copiar(variacaoParaTexto(s.conteudo, s.canal), 'Texto copiado')}
                  >
                    Copiar
                  </Button>
                  {s.status !== 'aprovado' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => mudarStatus(s, 'aprovado')}
                    >
                      <Check className="w-4 h-4 mr-1" /> Aprovar
                    </Button>
                  )}
                  {s.status !== 'descartado' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => mudarStatus(s, 'descartado')}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Descartar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
