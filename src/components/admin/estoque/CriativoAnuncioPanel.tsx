import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
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
import { mensagemErroAmigavel } from '@/lib/friendly-error'
import {
  LOGO_FUNDO_ESCURO_URL,
  MAX_FOTOS_CRIATIVO,
  carregarImagem,
  prepararLogo,
  type FormatoCriativo,
} from '@/lib/criativo-anuncio'
import {
  FORMATOS_PADRAO,
  MAX_FOTOS_PADRAO,
  MODELO_PADRAO_SLUG,
  SELO_CAUTELAR_URL,
  TAMANHO_IA_PADRAO,
  desenharCriativoPadrao,
  prepararFontesPadrao,
  type DadosCriativoPadrao,
  type FormatoPadrao,
} from '@/lib/criativo-padrao'
import {
  Image as ImageIcon,
  Wand2,
  UploadCloud,
  Trash,
  Loader2,
  Share2,
  Copy,
  ExternalLink,
} from 'lucide-react'

// Formatos que o painel oferece. O único modelo é o Padrão Carro e Cia, em 1:1, 4:5 e 9:16
// (os 2 modelos antigos foram aposentados em 01/11/2026). 16:9 ainda não tem layout
// (não basta esticar), por isso aparece desativado.
type FormatoSel = '1:1' | '4:5' | '9:16' | '16:9'
const FORMATOS_SEL: { id: FormatoSel; nome: string; dimensoes: string; ativo: boolean }[] = [
  { id: '1:1', nome: 'Quadrado 1:1', dimensoes: '1080 × 1080', ativo: true },
  { id: '4:5', nome: 'Feed 4:5', dimensoes: '1080 × 1350', ativo: true },
  { id: '9:16', nome: 'Stories 9:16', dimensoes: '1080 × 1920', ativo: true },
  { id: '16:9', nome: 'Horizontal 16:9', dimensoes: '1920 × 1080', ativo: false },
]

// Os 3 estilos de tratamento da foto pela IA (textos na tela Regras de IA).
const ESTILOS_IA = [
  { slug: 'criativo_estilo_loja', nome: 'Brilho sofisticado' },
  { slug: 'criativo_estilo_estudio_claro', nome: 'Estúdio claro' },
  { slug: 'criativo_estilo_estudio_escuro', nome: 'Estúdio escuro premium' },
]

// Gerador de criativos de anúncio (Meta/Google Ads + post orgânico). 1 a 4 fotos,
// formatos 1:1, 4:5 (feed) e 9:16 (Stories), modelo único "Padrão Carro e Cia", logo
// original sem alteração, salvar no sistema e criar post orgânico.
// Preço, km, logo e textos são desenhados por código; a IA trata só a foto
// principal (function gerar-criativo-anuncio).

interface Resultado {
  slug: string
  // 'quadrado' = 1:1 (publica como post de feed)
  formato: FormatoCriativo
  rotulo: string
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
  const [formatoSel, setFormatoSel] = useState<FormatoSel>('4:5')
  const [estiloIA, setEstiloIA] = useState(ESTILOS_IA[0].slug)
  // 16:9 ainda não tem layout: nenhum modelo disponível.
  const formatoPadrao: FormatoPadrao | null = formatoSel === '16:9' ? null : formatoSel
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

  // ---- Padrão Carro e Cia (1:1, 4:5 e 9:16; foto original ou tratada pela IA) ----
  // Campos editáveis: a condição do preço ("à vista") NUNCA é texto fixo, e a
  // linha de motor/potência começa com a cilindrada e o combustível do cadastro
  // (não existe coluna de potência — se quiser, digite aqui, ex.: "2.0 • 404 cv • Híbrido").
  const [condicao, setCondicao] = useState('à vista')
  const linhaMotorInicial = [veiculo.cilindrada, veiculo.combustivel].filter(Boolean).join(' • ')
  const [linhaMotor, setLinhaMotor] = useState(linhaMotorInicial)
  const kmPadrao = veiculo.is_zero_km
    ? '0 km'
    : veiculo.nao_exibir_km || !veiculo.quilometragem
      ? ''
      : `${Number(veiculo.quilometragem).toLocaleString('pt-BR')} km`
  const dadosPadrao: DadosCriativoPadrao = {
    marca: veiculo.marca || '',
    modelo: veiculo.modelo || '',
    versao: veiculo.versao || '',
    linhaMotor,
    // No 1:1 o título é de 1 linha (como na referência): o complemento só entra se você
    // digitou algo diferente do que veio do cadastro (ex.: "404 cv • Híbrido").
    complementoTitulo: linhaMotor.trim() !== linhaMotorInicial.trim() ? linhaMotor : '',
    anoFabricacao: veiculo.ano_fabricacao ? String(veiculo.ano_fabricacao) : '',
    anoModelo: veiculo.ano_modelo ? String(veiculo.ano_modelo) : '',
    km: kmPadrao,
    cambio: veiculo.cambio || '',
    precoVenda: Number(veiculo.preco_venda) || 0,
    condicao,
  }
  const chaveDadosPadrao = JSON.stringify(dadosPadrao)

  const imagem = async (url: string) => {
    if (!cacheImagens.current[url]) cacheImagens.current[url] = await carregarImagem(url)
    return cacheImagens.current[url]
  }

  // A logo branca e vermelha (transparente de verdade), já recortada. Se falhar, o
  // criativo sai sem ela em vez de quebrar.
  const carregarLogo = (): Promise<HTMLCanvasElement | null> =>
    imagem(LOGO_FUNDO_ESCURO_URL)
      .then((i) => prepararLogo(i, false))
      .catch(() => null)

  // Selo "Cautelar Aprovada" (transparente). Se falhar, o criativo sai sem ele em vez de quebrar.
  const carregarSelo = (): Promise<HTMLImageElement | null> =>
    imagem(SELO_CAUTELAR_URL).catch(() => null)

  // Prévia do modelo: só desenho, não gasta IA.
  useEffect(() => {
    if (fotosSel.length === 0) return
    let cancelado = false
    ;(async () => {
      try {
        const [imgs, logo, selo] = await Promise.all([
          Promise.all(fotosSel.map(imagem)),
          carregarLogo(),
          carregarSelo(),
        ])
        if (cancelado) return
        // Prévia do Padrão Carro e Cia: foto original, sem IA.
        const canvasPadrao = previewRefs.current[MODELO_PADRAO_SLUG]
        if (canvasPadrao && formatoPadrao) {
          await prepararFontesPadrao()
          if (cancelado) return
          desenharCriativoPadrao(
            canvasPadrao,
            formatoPadrao,
            imgs.slice(0, MAX_FOTOS_PADRAO),
            logo,
            dadosPadrao,
            selo,
          )
        }
      } catch (err: any) {
        if (!cancelado) {
          toast({
            title: 'Erro ao montar a prévia do modelo',
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
  }, [fotosSel, formatoSel, chaveDadosPadrao])

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

  const escolherFormato = (f: FormatoSel) => {
    setFormatoSel(f)
    setResultado(null)
  }

  // Padrão Carro e Cia. Sem IA: só desenha com a foto original. Com IA: a function trata a
  // foto principal no estilo escolhido, já na proporção da janela da foto do layout (assim
  // o respiro que a IA deixa não é cortado); as demais fotos entram como estão.
  const gerarPadrao = async (comIA: boolean) => {
    if (!formatoPadrao) return
    if (comIA && !veiculo.id) {
      toast({ title: 'Salve o veículo antes de gerar com IA', variant: 'destructive' })
      return
    }
    setGerandoSlug(comIA ? estiloIA : MODELO_PADRAO_SLUG)
    setResultado(null)
    try {
      let principalTratada: HTMLImageElement | null = null
      if (comIA) {
        const { data, error } = await supabase.functions.invoke('gerar-criativo-anuncio', {
          body: {
            veiculo_id: veiculo.id,
            foto_url: fotosSel[0],
            template_slug: estiloIA,
            size: TAMANHO_IA_PADRAO[formatoPadrao],
          },
        })
        if (error) throw error
        if (!data?.success) throw new Error(data?.error || 'Falha ao tratar a foto')
        principalTratada = await carregarImagem(data.imagem_tratada)
      }
      const [imgs, logo, selo] = await Promise.all([
        Promise.all(fotosSel.map(imagem)),
        carregarLogo(),
        carregarSelo(),
      ])
      await prepararFontesPadrao()
      const canvas = finalRef.current
      if (!canvas) throw new Error('Não foi possível montar o criativo final')
      const fotosUsadas = (principalTratada ? [principalTratada, ...imgs.slice(1)] : imgs).slice(
        0,
        MAX_FOTOS_PADRAO,
      )
      desenharCriativoPadrao(canvas, formatoPadrao, fotosUsadas, logo, dadosPadrao, selo)
      setResultado({
        slug: comIA ? estiloIA : MODELO_PADRAO_SLUG,
        formato:
          formatoPadrao === '1:1' ? 'quadrado' : formatoPadrao === '9:16' ? 'stories' : 'feed',
        rotulo: `${FORMATOS_PADRAO[formatoPadrao].nome}${comIA ? ' (foto tratada pela IA)' : ' (foto original)'}`,
        blob: await canvasParaBlob(canvas, 'image/png'),
      })
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

  // Nada é gravado no computador: o criativo vai para o R2 (Cloudflare) e o link é copiado,
  // ou a imagem é copiada para a área de transferência (sem criar arquivo).
  const copiarTexto = async (texto: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(texto)
      toast({ title: ok })
    } catch {
      toast({
        title: 'Não foi possível copiar automaticamente',
        description: texto,
        variant: 'destructive',
      })
    }
  }

  const copiarImagem = async () => {
    if (!resultado) return
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': resultado.blob })])
      toast({ title: 'Imagem copiada. É só colar onde precisar (Ctrl+V).' })
    } catch {
      toast({
        title: 'Seu navegador não permitiu copiar a imagem',
        description: 'Use "Salvar e copiar link", que guarda no sistema e copia o endereço.',
        variant: 'destructive',
      })
    }
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
      carregarSalvos()
      await copiarTexto(publicUrl, 'Criativo salvo no sistema e link copiado')
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

  // Criativo já salvo (no R2): abrir numa aba ou copiar o link. Não grava no computador.
  const abrirSalvo = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
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

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="font-bold flex items-center gap-2 text-slate-800 mb-1">
        <ImageIcon className="w-5 h-5 text-blue-600" /> Gerador de Criativos (Meta/Google Ads e
        redes sociais)
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Escolha de 1 a {MAX_FOTOS_CRIATIVO} fotos e o formato. Preço, quilometragem e a logo são
        colocados pelo sistema com os dados reais; a IA só trata a foto principal. Nada é gravado no
        seu computador: salve no sistema (nuvem), copie o link ou a imagem, ou crie um post
        orgânico.
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
              <div className="flex flex-wrap gap-2 mb-6">
                {FORMATOS_SEL.map((k) => (
                  <Button
                    key={k.id}
                    type="button"
                    size="sm"
                    variant={formatoSel === k.id ? 'default' : 'outline'}
                    disabled={!k.ativo}
                    title={k.ativo ? undefined : 'Ainda sem layout próprio (em breve)'}
                    onClick={() => escolherFormato(k.id)}
                  >
                    {k.nome} ({k.dimensoes})
                  </Button>
                ))}
              </div>

              <Label className="text-xs font-bold text-slate-600 mb-2 block">
                3. Gere o criativo (foto original ou tratada pela IA)
              </Label>
              <div className="max-w-sm mb-6">
                {/* Padrão Carro e Cia: 1:1, 4:5 e 9:16, foto original ou tratada pela IA */}
                <div className="space-y-2">
                  {formatoPadrao ? (
                    <>
                      <div
                        className={cn(
                          'rounded-lg overflow-hidden border-2 bg-slate-100',
                          resultado?.slug === MODELO_PADRAO_SLUG
                            ? 'border-blue-600'
                            : 'border-slate-200',
                        )}
                      >
                        <canvas
                          ref={(el) => {
                            previewRefs.current[MODELO_PADRAO_SLUG] = el
                          }}
                          className="w-full h-auto block"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant={resultado?.slug === MODELO_PADRAO_SLUG ? 'default' : 'outline'}
                        className="w-full"
                        disabled={gerandoSlug !== null}
                        onClick={() => gerarPadrao(false)}
                      >
                        {gerandoSlug === MODELO_PADRAO_SLUG ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <ImageIcon className="w-4 h-4 mr-1" />
                        )}
                        Padrão Carro e Cia
                      </Button>
                      <p className="text-[11px] text-slate-500">
                        Foto original, sem IA. Usa a 1ª foto como principal e até 3 como
                        complementares. O selo "Cautelar Aprovada" entra no canto da foto principal.
                      </p>
                      <div className="space-y-1 rounded-lg border bg-slate-50 p-2">
                        <Label className="text-[11px] text-slate-600">
                          Ou trate a foto principal com IA (escolha o estilo)
                        </Label>
                        <div className="flex flex-col gap-1">
                          {ESTILOS_IA.map((e) => (
                            <button
                              key={e.slug}
                              type="button"
                              onClick={() => setEstiloIA(e.slug)}
                              className={cn(
                                'rounded border px-2 py-1 text-left text-xs',
                                estiloIA === e.slug
                                  ? 'border-blue-600 bg-blue-50 font-semibold text-blue-700'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                              )}
                            >
                              {e.nome}
                            </button>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={gerandoSlug !== null || !veiculo.id}
                          onClick={() => gerarPadrao(true)}
                        >
                          {gerandoSlug === estiloIA ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Wand2 className="w-4 h-4 mr-1" />
                          )}
                          Gerar com IA
                        </Button>
                        <p className="text-[11px] text-slate-500">
                          Usa a API de imagens (tem custo por geração). A prévia acima mostra a foto
                          original, para você comparar com o resultado.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-600">
                          Condição do preço (deixe vazio para não mostrar)
                        </Label>
                        <Input
                          value={condicao}
                          onChange={(e) => {
                            setCondicao(e.target.value)
                            setResultado(null)
                          }}
                          placeholder="à vista"
                          className="h-8 text-sm"
                        />
                        <Label className="text-[11px] text-slate-600">
                          Motor / potência / combustível (no 1:1 só entra no título se você alterar
                          o texto)
                        </Label>
                        <Input
                          value={linhaMotor}
                          onChange={(e) => {
                            setLinhaMotor(e.target.value)
                            setResultado(null)
                          }}
                          placeholder="2.0 • 404 cv • Híbrido"
                          className="h-8 text-sm"
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 border rounded-lg p-4 bg-slate-50">
                      O "Padrão Carro e Cia" ainda não tem layout para este formato. Use 1:1, 4:5 ou
                      9:16.
                    </p>
                  )}
                </div>
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
              4. Resultado final ({resultado?.rotulo})
            </Label>
            <div
              className={cn(
                'mb-3',
                resultado?.formato === 'stories' ? 'max-w-[260px]' : 'max-w-xs',
              )}
            >
              <canvas ref={finalRef} className="w-full h-auto rounded-lg border" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={salvarNoSistema} disabled={salvando}>
                {salvando ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4 mr-1" />
                )}
                Salvar e copiar link
              </Button>
              <Button size="sm" variant="outline" onClick={copiarImagem}>
                <Copy className="w-4 h-4 mr-1" /> Copiar imagem
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
                        title="Abrir"
                        onClick={() => abrirSalvo(c.imagem_url)}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Copiar link"
                        onClick={() => copiarTexto(c.imagem_url, 'Link copiado')}
                      >
                        <Copy className="w-3.5 h-3.5" />
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
