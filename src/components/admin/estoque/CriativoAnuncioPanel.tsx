import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { uploadToR2 } from '@/lib/r2-upload'
import { downloadBlob } from '@/utils/downloadFile'
import { mensagemErroAmigavel } from '@/lib/friendly-error'
import {
  FORMATOS,
  LOGO_FUNDO_CLARO_URL,
  LOGO_FUNDO_ESCURO_URL,
  MAX_FOTOS_CRIATIVO,
  MODELOS_CRIATIVO,
  carregarImagem,
  desenharCriativo,
  prepararLogo,
  type DadosCriativo,
  type FormatoCriativo,
  type LogosCriativo,
} from '@/lib/criativo-anuncio'
import {
  Image as ImageIcon,
  Wand2,
  Download,
  UploadCloud,
  Trash,
  Loader2,
  Share2,
} from 'lucide-react'

// Gerador de criativos de anúncio (Meta/Google Ads + post orgânico). Reescrito
// em 30/09/2026: 1 a 4 fotos, formato Feed/Stories, 2 modelos (fundo escuro e
// claro), logo original sem alteração, salvar no sistema e criar post orgânico.
// Preço, km, logo e textos são desenhados por código; a IA trata só a foto
// principal (function gerar-criativo-anuncio).

interface Resultado {
  slug: string
  formato: FormatoCriativo
  blob: Blob
}

const htmlParaTexto = (html: string): string => {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || div.innerText || '').replace(/\n{3,}/g, '\n\n').trim()
}

const canvasParaBlob = (canvas: HTMLCanvasElement, tipo: string, qualidade?: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Não foi possível gerar a imagem'))),
      tipo,
      qualidade,
    ),
  )

export function CriativoAnuncioPanel({ veiculo }: { veiculo: any }) {
  const { toast } = useToast()
  const fotos: string[] = Array.isArray(veiculo.fotos) ? veiculo.fotos : []

  const [fotosSel, setFotosSel] = useState<string[]>([])
  const [formato, setFormato] = useState<FormatoCriativo>('feed')
  const [gerandoSlug, setGerandoSlug] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [salvos, setSalvos] = useState<any[]>([])

  const [postAberto, setPostAberto] = useState(false)
  const [textoPost, setTextoPost] = useState('')
  const [redesPost, setRedesPost] = useState({ facebook: true, instagram: true })
  const [gerandoTexto, setGerandoTexto] = useState(false)
  const [criandoPost, setCriandoPost] = useState(false)

  const previewRefs = useRef<Record<string, HTMLCanvasElement | null>>({})
  const finalRef = useRef<HTMLCanvasElement | null>(null)
  const cacheImagens = useRef<Record<string, HTMLImageElement>>({})

  const dados: DadosCriativo = {
    marca: veiculo.marca || '',
    modelo: veiculo.modelo || '',
    versao: veiculo.versao || '',
    anoModelo: veiculo.ano_modelo ? String(veiculo.ano_modelo) : '',
    km: veiculo.quilometragem ? Number(veiculo.quilometragem).toLocaleString('pt-BR') : '',
    cambio: veiculo.cambio || '',
    combustivel: veiculo.combustivel || '',
    precoVenda: Number(veiculo.preco_venda) || 0,
  }
  const chaveDados = JSON.stringify(dados)

  const imagem = async (url: string) => {
    if (!cacheImagens.current[url]) cacheImagens.current[url] = await carregarImagem(url)
    return cacheImagens.current[url]
  }

  // As duas logos originais, já recortadas (e com o quadriculado da logo de fundo
  // escuro removido). Se alguma falhar, o criativo sai sem ela em vez de quebrar.
  const carregarLogos = async (): Promise<LogosCriativo> => {
    const [paraFundoClaro, paraFundoEscuro] = await Promise.all([
      imagem(LOGO_FUNDO_CLARO_URL)
        .then((i) => prepararLogo(i, false))
        .catch(() => null),
      imagem(LOGO_FUNDO_ESCURO_URL)
        .then((i) => prepararLogo(i, true))
        .catch(() => null),
    ])
    return { paraFundoClaro, paraFundoEscuro }
  }

  // Prévias dos 2 modelos: só desenho, não gasta IA.
  useEffect(() => {
    if (fotosSel.length === 0) return
    let cancelado = false
    ;(async () => {
      try {
        const [imgs, logos] = await Promise.all([
          Promise.all(fotosSel.map(imagem)),
          carregarLogos(),
        ])
        if (cancelado) return
        for (const m of MODELOS_CRIATIVO) {
          const canvas = previewRefs.current[m.slug]
          if (canvas) desenharCriativo(canvas, formato, m, imgs, logos, dados)
        }
      } catch (err: any) {
        if (!cancelado) {
          toast({
            title: 'Erro ao montar a prévia dos modelos',
            description: mensagemErroAmigavel(err),
            variant: 'destructive',
          })
        }
      }
    })()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fotosSel, formato, chaveDados])

  const carregarSalvos = async () => {
    if (!veiculo.id) return
    const { data } = await supabase
      .from('veiculo_criativos')
      .select('*')
      .eq('veiculo_id', veiculo.id)
      .order('criado_em', { ascending: false })
    setSalvos(data || [])
  }

  useEffect(() => {
    carregarSalvos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [veiculo.id])

  const alternarFoto = (url: string) => {
    setResultado(null)
    setFotosSel((atual) => {
      if (atual.includes(url)) return atual.filter((u) => u !== url)
      if (atual.length >= MAX_FOTOS_CRIATIVO) {
        toast({ title: `Escolha no máximo ${MAX_FOTOS_CRIATIVO} fotos`, variant: 'destructive' })
        return atual
      }
      return [...atual, url]
    })
  }

  const escolherFormato = (f: FormatoCriativo) => {
    setFormato(f)
    setResultado(null)
  }

  const gerar = async (slug: string) => {
    if (!veiculo.id) {
      toast({ title: 'Salve o veículo antes de gerar o criativo', variant: 'destructive' })
      return
    }
    setGerandoSlug(slug)
    setResultado(null)
    try {
      // A IA trata só a foto principal; as demais entram como estão.
      const { data, error } = await supabase.functions.invoke('gerar-criativo-anuncio', {
        body: { veiculo_id: veiculo.id, foto_url: fotosSel[0], template_slug: slug },
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Falha ao tratar a foto')

      const [principalTratada, outras, logos] = await Promise.all([
        carregarImagem(data.imagem_tratada),
        Promise.all(fotosSel.slice(1).map(imagem)),
        carregarLogos(),
      ])
      const canvas = finalRef.current
      const modelo = MODELOS_CRIATIVO.find((m) => m.slug === slug)
      if (!canvas || !modelo) throw new Error('Não foi possível montar o criativo final')
      desenharCriativo(canvas, formato, modelo, [principalTratada, ...outras], logos, dados)
      setResultado({ slug, formato, blob: await canvasParaBlob(canvas, 'image/png') })
      toast({ title: 'Criativo gerado!' })
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar o criativo',
        description: mensagemErroAmigavel(err),
        variant: 'destructive',
      })
    } finally {
      setGerandoSlug(null)
    }
  }

  const nomeArquivo = (r: Resultado, ext: string) =>
    `criativo-${veiculo.placa || 'veiculo'}-${r.formato}-${r.slug.replace('criativo_', '')}.${ext}`

  const baixar = () => {
    if (resultado) downloadBlob(resultado.blob, nomeArquivo(resultado, 'png'))
  }

  const salvarNoSistema = async () => {
    if (!resultado) return
    setSalvando(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const caminho = `criativos/${veiculo.placa || veiculo.id}_${resultado.formato}_${resultado.slug}_${Date.now()}.png`
      const { publicUrl } = await uploadToR2(resultado.blob, caminho, 'image/png', 'media')
      const { error } = await supabase.from('veiculo_criativos').insert({
        veiculo_id: veiculo.id,
        template_slug: resultado.slug,
        foto_origem_url: fotosSel[0],
        imagem_url: publicUrl,
        criado_por: user?.id,
      })
      if (error) throw error
      toast({ title: 'Criativo salvo no sistema' })
      carregarSalvos()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar o criativo',
        description: mensagemErroAmigavel(err),
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const baixarSalvo = async (url: string, slug: string) => {
    try {
      const res = await fetch(url)
      downloadBlob(await res.blob(), `criativo-${veiculo.placa || 'veiculo'}-${slug}.png`)
    } catch (err: any) {
      toast({
        title: 'Erro ao baixar',
        description: mensagemErroAmigavel(err),
        variant: 'destructive',
      })
    }
  }

  const apagarSalvo = async (id: string) => {
    if (
      !confirm(
        'Apagar este criativo salvo? A imagem continua acessível pelo link até ser removida do R2 manualmente.',
      )
    )
      return
    const { error } = await supabase.from('veiculo_criativos').delete().eq('id', id)
    if (error) {
      toast({
        title: 'Erro ao apagar',
        description: mensagemErroAmigavel(error),
        variant: 'destructive',
      })
      return
    }
    carregarSalvos()
  }

  // ---- Post orgânico ----
  const gerarLegenda = async () => {
    setGerandoTexto(true)
    try {
      const { data, error } = await supabase.functions.invoke('gerar-conteudo-social', {
        body: { veiculo_id: veiculo.id },
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido')
      setTextoPost(htmlParaTexto(String(data.text ?? data.data ?? '')))
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar o texto do post',
        description: mensagemErroAmigavel(err),
        variant: 'destructive',
      })
    } finally {
      setGerandoTexto(false)
    }
  }

  const abrirPostOrganico = () => {
    // Stories: o Facebook Stories ainda não é suportado pelo sistema.
    setRedesPost({ facebook: resultado?.formato !== 'stories', instagram: true })
    setPostAberto(true)
    if (!textoPost) gerarLegenda()
  }

  const criarPostOrganico = async () => {
    const canvas = finalRef.current
    if (!resultado || !canvas) return
    const ehStories = resultado.formato === 'stories'
    const redes = { facebook: redesPost.facebook && !ehStories, instagram: redesPost.instagram }
    if (!redes.facebook && !redes.instagram) {
      toast({ title: 'Escolha pelo menos uma rede', variant: 'destructive' })
      return
    }
    setCriandoPost(true)
    try {
      // O Instagram só aceita JPEG pela API de publicação — o PNG do download
      // não serve pra post.
      const jpeg = await canvasParaBlob(canvas, 'image/jpeg', 0.92)
      const caminho = `social/${veiculo.placa || veiculo.id}_${resultado.formato}_${Date.now()}.jpg`
      const { publicUrl } = await uploadToR2(jpeg, caminho, 'image/jpeg', 'media')
      const { error } = await supabase.from('social_posts').insert({
        redes,
        texto: textoPost,
        imagem: publicUrl,
        data_agendamento: new Date().toISOString(),
        status: 'Rascunho',
        veiculo_id: veiculo.id,
        content_type: ehStories ? 'stories' : 'feed',
      })
      if (error) throw error
      toast({
        title: 'Post criado como rascunho',
        description:
          'Aprove em Central de Redes Sociais → Aprovações. Nada é publicado antes disso.',
      })
      setPostAberto(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao criar o post',
        description: mensagemErroAmigavel(err),
        variant: 'destructive',
      })
    } finally {
      setCriandoPost(false)
    }
  }

  const f = FORMATOS[formato]

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="font-bold flex items-center gap-2 text-slate-800 mb-1">
        <ImageIcon className="w-5 h-5 text-blue-600" /> Gerador de Criativos (Meta/Google Ads e
        redes sociais)
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Escolha de 1 a {MAX_FOTOS_CRIATIVO} fotos, o formato (Feed ou Stories) e um dos 2 modelos.
        Preço, quilometragem e a logo são colocados pelo sistema com os dados reais; a IA só trata a
        foto principal. Depois é só baixar, salvar ou criar um post orgânico.
      </p>

      {fotos.length === 0 ? (
        <p className="text-sm text-slate-500 bg-slate-50 border rounded p-4">
          Cadastre fotos na aba "Fotos & Mídia" primeiro.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-bold text-slate-600">
              1. Escolha de 1 a {MAX_FOTOS_CRIATIVO} fotos (a primeira que você clicar é a
              principal)
            </Label>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {fotosSel.length}/{MAX_FOTOS_CRIATIVO} selecionadas
              {fotosSel.length > 0 && (
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => {
                    setFotosSel([])
                    setResultado(null)
                  }}
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-6">
            {fotos.map((url, i) => {
              const ordem = fotosSel.indexOf(url)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => alternarFoto(url)}
                  className={cn(
                    'relative aspect-square rounded overflow-hidden border-2',
                    ordem >= 0
                      ? 'border-blue-600 ring-2 ring-blue-300'
                      : 'border-transparent hover:border-slate-300',
                  )}
                >
                  {/* crossOrigin: a mesma foto é desenhada no canvas logo depois; sem isso o
                      navegador reaproveita a cópia sem CORS e recusa (erro ao clicar). */}
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

          {fotosSel.length > 0 && (
            <>
              <Label className="text-xs font-bold text-slate-600 mb-2 block">
                2. Escolha o formato
              </Label>
              <div className="flex gap-2 mb-6">
                {(Object.keys(FORMATOS) as FormatoCriativo[]).map((k) => (
                  <Button
                    key={k}
                    type="button"
                    size="sm"
                    variant={formato === k ? 'default' : 'outline'}
                    onClick={() => escolherFormato(k)}
                  >
                    {FORMATOS[k].nome} ({FORMATOS[k].dimensoes})
                  </Button>
                ))}
              </div>

              <Label className="text-xs font-bold text-slate-600 mb-2 block">
                3. Escolha o modelo e gere com IA
              </Label>
              <div className="grid grid-cols-2 gap-4 max-w-2xl mb-6">
                {MODELOS_CRIATIVO.map((m) => (
                  <div key={m.slug} className="space-y-2">
                    <div
                      className={cn(
                        'rounded-lg overflow-hidden border-2 bg-slate-100',
                        resultado?.slug === m.slug ? 'border-blue-600' : 'border-slate-200',
                      )}
                    >
                      <canvas
                        ref={(el) => {
                          previewRefs.current[m.slug] = el
                        }}
                        className="w-full h-auto block"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant={resultado?.slug === m.slug ? 'default' : 'outline'}
                      className="w-full"
                      disabled={gerandoSlug !== null || !veiculo.id}
                      onClick={() => gerar(m.slug)}
                    >
                      {gerandoSlug === m.slug ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4 mr-1" />
                      )}
                      {m.nome}
                    </Button>
                  </div>
                ))}
              </div>
              {!veiculo.id && (
                <p className="text-xs text-amber-700 mb-4">
                  Salve o veículo antes de gerar com IA.
                </p>
              )}
            </>
          )}

          <div className={resultado ? '' : 'hidden'}>
            <Label className="text-xs font-bold text-slate-600 mb-2 block">
              4. Resultado final ({f.nome} {f.dimensoes})
            </Label>
            <div className={cn('mb-3', formato === 'stories' ? 'max-w-[260px]' : 'max-w-xs')}>
              <canvas ref={finalRef} className="w-full h-auto rounded-lg border" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={baixar}>
                <Download className="w-4 h-4 mr-1" /> Baixar imagem
              </Button>
              <Button size="sm" variant="outline" onClick={salvarNoSistema} disabled={salvando}>
                {salvando ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4 mr-1" />
                )}
                Salvar no sistema
              </Button>
              <Button size="sm" variant="outline" onClick={abrirPostOrganico}>
                <Share2 className="w-4 h-4 mr-1" /> Criar post orgânico
              </Button>
            </div>
          </div>

          {salvos.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <Label className="text-xs font-bold text-slate-600 mb-2 block">
                Criativos já salvos deste veículo
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {salvos.map((c) => (
                  <div key={c.id} className="space-y-1">
                    <img
                      src={c.imagem_url}
                      alt={c.template_slug}
                      className="aspect-square object-cover rounded border w-full"
                    />
                    <div className="flex justify-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => baixarSalvo(c.imagem_url, c.template_slug)}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-500"
                        onClick={() => apagarSalvo(c.id)}
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={postAberto} onOpenChange={setPostAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar post orgânico</DialogTitle>
            <DialogDescription>
              O post vai como rascunho para Central de Redes Sociais → Aprovações. Nada é publicado
              antes de você aprovar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Texto do post</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={gerarLegenda}
                  disabled={gerandoTexto}
                >
                  {gerandoTexto ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3 mr-1" />
                  )}
                  Gerar com IA
                </Button>
              </div>
              <Textarea
                value={textoPost}
                onChange={(e) => setTextoPost(e.target.value)}
                rows={7}
                placeholder={gerandoTexto ? 'Gerando o texto...' : 'Escreva o texto do post'}
              />
              {resultado?.formato === 'stories' && (
                <p className="text-xs text-slate-500 mt-1">
                  O Instagram não mostra texto em Stories; ele fica só registrado no post.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Onde publicar</Label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={redesPost.facebook && resultado?.formato !== 'stories'}
                  disabled={resultado?.formato === 'stories'}
                  onCheckedChange={(v) => setRedesPost((r) => ({ ...r, facebook: v === true }))}
                />
                Facebook
                {resultado?.formato === 'stories' && (
                  <span className="text-xs text-slate-500">(Stories ainda não é suportado)</span>
                )}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={redesPost.instagram}
                  onCheckedChange={(v) => setRedesPost((r) => ({ ...r, instagram: v === true }))}
                />
                Instagram
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={criarPostOrganico} disabled={criandoPost || gerandoTexto}>
              {criandoPost && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Enviar para aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
