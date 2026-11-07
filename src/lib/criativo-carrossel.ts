// Monta os cartões 1:1 (1080 × 1080) de um anúncio carrossel de veículo.
//
// Regras (Adriana, 05/11/2026): o 1º cartão é o criativo "Padrão Carro e Cia" (logo, preço,
// km e selo, desenhados por código a partir do cadastro) e os demais são as fotos limpas
// que ela escolheu. Foto limpa NUNCA é cortada nem ampliada: entra inteira, centralizada,
// sobre um fundo escuro feito da própria foto desfocada (regra dos cards de veículo).
// Tudo roda no navegador, igual ao criativo estático; nada é enviado para o servidor.
import { carregarImagem, LOGO_FUNDO_ESCURO_URL, prepararLogo } from '@/lib/criativo-anuncio'
import {
  desenharCriativoPadrao,
  prepararFontesPadrao,
  SELO_CAUTELAR_URL,
  type DadosCriativoPadrao,
} from '@/lib/criativo-padrao'

const LADO = 1080

export interface CartaoCarrossel {
  indice: number // 1, 2, 3...
  blob: Blob
  previaUrl: string // URL temporária para <img>; liberar com liberarCartoes()
  nome: string // nome do arquivo para baixar
  comPreco: boolean
}

const canvasParaJpeg = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Não foi possível gerar a imagem do cartão'))),
      'image/jpeg',
      0.92,
    ),
  )

// Foto inteira (contain) sobre fundo escuro. O desfoque só existe onde o navegador suporta
// `ctx.filter`; onde não suporta (Safari antigo) o fundo fica preto liso, sem quebrar.
function desenharFotoLimpa(canvas: HTMLCanvasElement, img: HTMLImageElement) {
  canvas.width = LADO
  canvas.height = LADO
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível desenhar o cartão')

  ctx.fillStyle = '#0B0B0B'
  ctx.fillRect(0, 0, LADO, LADO)

  if ('filter' in ctx) {
    const cobrir = Math.max(LADO / img.width, LADO / img.height) * 1.15
    ctx.save()
    ctx.filter = 'blur(40px) brightness(0.55)'
    ctx.drawImage(
      img,
      (LADO - img.width * cobrir) / 2,
      (LADO - img.height * cobrir) / 2,
      img.width * cobrir,
      img.height * cobrir,
    )
    ctx.restore()
  }

  const caber = Math.min(LADO / img.width, LADO / img.height)
  const w = img.width * caber
  const h = img.height * caber
  ctx.drawImage(img, (LADO - w) / 2, (LADO - h) / 2, w, h)
}

// Dados do criativo Padrão a partir da linha do cadastro (mesma regra de km e motor do
// painel do Estoque: zero km mostra "0 km"; "não exibir km" ou km vazio esconde o card).
export function dadosPadraoDoVeiculo(v: any): DadosCriativoPadrao {
  const linhaMotor = [v.cilindrada, v.combustivel].filter(Boolean).join(' • ')
  const km = v.is_zero_km
    ? '0 km'
    : v.nao_exibir_km || !v.quilometragem
      ? ''
      : `${Number(v.quilometragem).toLocaleString('pt-BR')} km`
  return {
    marca: v.marca || '',
    modelo: v.modelo || '',
    versao: v.versao || '',
    linhaMotor,
    complementoTitulo: '',
    anoFabricacao: v.ano_fabricacao ? String(v.ano_fabricacao) : '',
    anoModelo: v.ano_modelo ? String(v.ano_modelo) : '',
    km,
    cambio: v.cambio || '',
    precoVenda: Number(v.preco_venda) || 0,
    condicao: '', // sem etiqueta "à vista" (pedido da Adriana, 06/11/2026)
  }
}

export function liberarCartoes(cartoes: CartaoCarrossel[]) {
  cartoes.forEach((c) => URL.revokeObjectURL(c.previaUrl))
}

export async function montarCartoesCarrossel(
  fotos: string[],
  dados: DadosCriativoPadrao,
  nomeBase: string,
): Promise<CartaoCarrossel[]> {
  if (fotos.length === 0) throw new Error('Escolha ao menos uma foto')

  const imagens = await Promise.all(fotos.map((u) => carregarImagem(u)))
  await prepararFontesPadrao()
  // Logo e selo são opcionais: se falharem, o 1º cartão sai sem eles em vez de quebrar.
  const logo = await carregarImagem(LOGO_FUNDO_ESCURO_URL)
    .then((i) => prepararLogo(i, false))
    .catch(() => null)
  const selo = await carregarImagem(SELO_CAUTELAR_URL).catch(() => null)

  const cartoes: CartaoCarrossel[] = []
  for (let i = 0; i < imagens.length; i++) {
    const canvas = document.createElement('canvas')
    const primeiro = i === 0
    if (primeiro) desenharCriativoPadrao(canvas, '1:1', [imagens[0]], logo, dados, selo)
    else desenharFotoLimpa(canvas, imagens[i])
    const blob = await canvasParaJpeg(canvas)
    cartoes.push({
      indice: i + 1,
      blob,
      previaUrl: URL.createObjectURL(blob),
      nome: `${nomeBase}_carrossel_${String(i + 1).padStart(2, '0')}.jpg`,
      comPreco: primeiro,
    })
  }
  return cartoes
}
