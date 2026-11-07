// Criativos estáticos gerados no CADASTRO do veículo (07/11/2026, pedido da Adriana).
// O operador escolhe 4 fotos e clica em "Gerar criativos": o Modelo Padrão é desenhado no
// navegador (canvas) com os dados do cadastro, em 4:5 (feed), 9:16 (Stories) e 1:1 (guardado
// para tráfego pago), enviado ao R2 na pasta do veículo e registrado em `veiculo_criativos`.
// O formato 1,91:1 (Google Ads) ainda NÃO tem layout: fica para uma etapa própria.
// Foto principal sempre original, sem IA. A regra de "foto sem marca de IA" não vale aqui.
import { supabase } from '@/lib/supabase/client'
import { uploadToR2 } from '@/lib/r2-upload'
import { LOGO_FUNDO_ESCURO_URL, carregarImagem, prepararLogo } from '@/lib/criativo-anuncio'
import {
  AVISO_RODAPE_CRIATIVO,
  MODELO_PADRAO_SLUG,
  SELO_CAUTELAR_URL,
  desenharCriativoPadrao,
  prepararFontesPadrao,
  type DadosCriativoPadrao,
  type FormatoPadrao,
} from '@/lib/criativo-padrao'

export const FOTOS_DO_CRIATIVO = 4
export const ORIGEM_CADASTRO = 'cadastro'
// Ordem de geração: o 4:5 primeiro (é o que vai para o feed).
export const FORMATOS_DO_CADASTRO: FormatoPadrao[] = ['4:5', '9:16', '1:1']

// Dados do criativo lidos do cadastro (mesma regra do painel de criativos: a linha de
// motor começa com a cilindrada e o combustível; sem "à vista"; só o ano do modelo).
export function dadosCriativoDoVeiculo(v: any): DadosCriativoPadrao {
  const km = v.is_zero_km
    ? '0 km'
    : v.nao_exibir_km || !v.quilometragem
      ? ''
      : `${Number(v.quilometragem).toLocaleString('pt-BR')} km`
  return {
    marca: v.marca || '',
    modelo: v.modelo || '',
    versao: v.versao || '',
    linhaMotor: [v.cilindrada, v.combustivel].filter(Boolean).join(' • '),
    complementoTitulo: '',
    anoFabricacao: v.ano_fabricacao ? String(v.ano_fabricacao) : '',
    anoModelo: v.ano_modelo ? String(v.ano_modelo) : '',
    km,
    cambio: v.cambio || '',
    precoVenda: Number(v.preco_venda) || 0,
    condicao: '',
  }
}

// Foto dos dados que ficam GRAVADOS na imagem. Serve para a trava: se preço, km, ano ou
// status do veículo mudarem depois, o criativo está desatualizado e não deve ser publicado.
export interface InstantaneoCriativo {
  preco_venda: number
  quilometragem: number
  ano_modelo: string
  status: string
}

export function instantaneoDoVeiculo(v: any): InstantaneoCriativo {
  return {
    preco_venda: Number(v.preco_venda) || 0,
    quilometragem: v.is_zero_km ? 0 : Number(v.quilometragem) || 0,
    ano_modelo: String(v.ano_modelo ?? ''),
    status: String(v.status ?? ''),
  }
}

// true = já existe criativo gerado e os dados do cadastro mudaram desde então.
export function criativoDesatualizado(v: any): boolean {
  const antigo = v?.criativo_dados as Partial<InstantaneoCriativo> | null | undefined
  if (!antigo || !v?.criativo_gerado_em) return false
  const atual = instantaneoDoVeiculo(v)
  return (
    atual.preco_venda !== Number(antigo.preco_venda) ||
    atual.quilometragem !== Number(antigo.quilometragem) ||
    atual.ano_modelo !== String(antigo.ano_modelo ?? '') ||
    atual.status !== String(antigo.status ?? '')
  )
}

export interface ResultadoGeracao {
  fotos_criativo: string[]
  criativo_gerado_em: string
  criativo_dados: InstantaneoCriativo
}

const canvasParaJpeg = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Não foi possível gerar a imagem'))),
      'image/jpeg', // o Instagram só aceita JPEG pela API de publicação
      0.92,
    ),
  )

// Gera os formatos, envia ao R2 e registra. Só troca o conjunto anterior (origem 'cadastro')
// depois que TUDO foi enviado e gravado; se algo falhar, o que existia continua valendo.
export async function gerarCriativosDoVeiculo(
  veiculo: any,
  fotos: string[],
  aoProgredir: (mensagem: string) => void,
): Promise<ResultadoGeracao> {
  if (!veiculo?.id) throw new Error('Salve o veículo antes de gerar os criativos.')
  if (fotos.length !== FOTOS_DO_CRIATIVO) {
    throw new Error(`Escolha exatamente ${FOTOS_DO_CRIATIVO} fotos.`)
  }

  aoProgredir('Carregando as fotos...')
  const [imgs, logo, selo] = await Promise.all([
    Promise.all(fotos.map((url) => carregarImagem(url))),
    carregarImagem(LOGO_FUNDO_ESCURO_URL)
      .then((i) => prepararLogo(i, false))
      .catch(() => null),
    carregarImagem(SELO_CAUTELAR_URL).catch(() => null),
  ])
  await prepararFontesPadrao()

  const dados = dadosCriativoDoVeiculo(veiculo)
  const pasta = String(veiculo.placa || veiculo.id)
  const canvas = document.createElement('canvas')
  const enviados: { formato: FormatoPadrao; url: string }[] = []
  for (const formato of FORMATOS_DO_CADASTRO) {
    aoProgredir(`Gerando e enviando o formato ${formato}...`)
    desenharCriativoPadrao(canvas, formato, imgs, logo, dados, selo, AVISO_RODAPE_CRIATIVO)
    const blob = await canvasParaJpeg(canvas)
    const caminho = `criativos/${pasta}/${Date.now()}_${formato.replace(':', 'x')}.jpg`
    const { publicUrl } = await uploadToR2(blob, caminho, 'image/jpeg', 'media')
    enviados.push({ formato, url: publicUrl })
  }

  aoProgredir('Salvando no sistema...')
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: antigos } = await supabase
    .from('veiculo_criativos')
    .select('id')
    .eq('veiculo_id', veiculo.id)
    .eq('origem', ORIGEM_CADASTRO)

  const { error: erroInsert } = await supabase.from('veiculo_criativos').insert(
    enviados.map((e) => ({
      veiculo_id: veiculo.id,
      template_slug: MODELO_PADRAO_SLUG,
      foto_origem_url: fotos[0],
      imagem_url: e.url,
      formato: e.formato,
      origem: ORIGEM_CADASTRO,
      criado_por: user?.id ?? null,
    })),
  )
  if (erroInsert) throw erroInsert

  const idsAntigos = (antigos || []).map((a) => a.id)
  if (idsAntigos.length) {
    await supabase.from('veiculo_criativos').delete().in('id', idsAntigos)
  }

  const resultado: ResultadoGeracao = {
    fotos_criativo: fotos,
    criativo_gerado_em: new Date().toISOString(),
    criativo_dados: instantaneoDoVeiculo(veiculo),
  }
  const { error: erroVeiculo } = await supabase
    .from('veiculos')
    .update({
      fotos_criativo: resultado.fotos_criativo,
      criativo_gerado_em: resultado.criativo_gerado_em,
      criativo_dados: resultado.criativo_dados as never,
    })
    .eq('id', veiculo.id)
  if (erroVeiculo) throw erroVeiculo
  return resultado
}
