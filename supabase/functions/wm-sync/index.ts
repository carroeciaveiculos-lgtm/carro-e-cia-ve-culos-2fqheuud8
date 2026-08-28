import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  buildAuthXML,
  buildIncluirCarroXML,
  buildAlterarCarroXML,
  buildTrocarModalidadeXML,
  buildExcluirCarroXML,
  buildObterEstoqueAtualXML,
  parseEstoqueAtual,
  buildObterModalidadeXML,
  parseModalidades,
  buildIncluirFotoXML,
  buildObterFotosCarroXML,
  parseQuantidadeFotos,
  callSOAP,
  type WMCredentials,
  type MapeamentoWM,
  type AnuncioWMResumo,
} from '../_shared/wm-soap.ts'

function normalizarPlaca(placa: string | null | undefined): string {
  return (placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

// Tabela oficial da Webmotors (confirmada pela Adriana, 13/08/2026):
// 21|9 = foto acima de 500 Kbytes; 21|10 = formato inválido. Nossas fotos
// originais vêm de câmera de celular, 3-4MB — sempre estouravam o limite. O
// CDN (Cloudflare Image Resizing) já sabe redimensionar via URL, sem precisar
// de nenhum processamento aqui: testado ao vivo, 1280px/qualidade 80 fica em
// ~150KB, bem dentro do limite, mantendo qualidade boa o suficiente pro
// anúncio.
function urlFotoRedimensionada(urlOriginal: string): string {
  if (!urlOriginal.includes('carroeciamotors.com.br')) return urlOriginal
  const base = urlOriginal.replace(/^https?:\/\//, '')
  return `https://imagens.carroeciamotors.com.br/cdn-cgi/image/width=1280,quality=80,format=jpeg/https://${base}`
}

function arrayBufferParaBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

// Achado via WSDL (13/08/2026): fotos não vão no IncluirCarro, é uma chamada
// separada por foto, depois de ter o CodigoAnuncio. IncluirFotoUrl (manda a
// URL, Webmotors busca sozinha) sempre voltou 21|10 mesmo com imagem trivial
// de outro domínio — descartado. O exemplo OFICIAL do manual da Webmotors usa
// IncluirFoto com os bytes da imagem (confirmado pela Adriana, 13/08/2026):
// baixamos a versão redimensionada do nosso CDN e mandamos em base64. Melhor
// esforço: uma foto falhando não derruba a publicação (que já aconteceu).
async function enviarFotos(
  hash: string,
  codigoAnuncio: string,
  fotos: string[],
): Promise<{ enviadas: number; falhas: number; primeiroErro?: string }> {
  let enviadas = 0
  let falhas = 0
  let primeiroErro: string | undefined
  for (const urlOriginal of fotos) {
    if (typeof urlOriginal !== 'string' || !urlOriginal) continue
    try {
      const urlRedimensionada = urlFotoRedimensionada(urlOriginal)
      const imgRes = await fetch(urlRedimensionada)
      if (!imgRes.ok) {
        falhas++
        if (!primeiroErro) primeiroErro = `Falha ao baixar foto do CDN: HTTP ${imgRes.status}`
        continue
      }
      const base64Image = arrayBufferParaBase64(await imgRes.arrayBuffer())
      const xml = buildIncluirFotoXML(hash, codigoAnuncio, base64Image)
      const res = await callSOAP(xml, 'IncluirFoto', hash)
      if (res.success) {
        enviadas++
      } else {
        falhas++
        if (!primeiroErro) primeiroErro = res.raw?.slice(0, 800) || res.error
      }
    } catch (err: any) {
      falhas++
      if (!primeiroErro) primeiroErro = err.message
    }
  }
  return { enviadas, falhas, primeiroErro }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

// O hash de autenticação aparece no XML enviado; nunca persistir sem mascarar.
function mascararHash(xml: string): string {
  return xml.replace(/(<pHashAutenticacao>)[^<]*(<\/pHashAutenticacao>)/gi, '$1***$2')
}

// Guarda request + response no mapeamento do veículo. Sem isso a depuração vira
// adivinhação: até aqui só sobrava a resposta da Webmotors, e o que foi enviado
// tinha de ser inferido a partir do eco dela.
async function registrarTrocaXML(
  supabase: any,
  veiculoId: string,
  operacao: string,
  requestXml: string,
  responseXml: string | undefined,
) {
  await supabase
    .from('wm_mapeamento_veiculos')
    .update({
      ultima_resposta_xml: [
        `-- ${operacao} @ ${new Date().toISOString()}`,
        '-- REQUEST --',
        mascararHash(requestXml),
        '-- RESPONSE --',
        responseXml ?? '(sem resposta)',
      ].join('\n'),
    })
    .eq('veiculo_id', veiculoId)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const body = await req.json().catch(() => ({}))
    const specificVeiculoId = body.veiculo_id

    const creds: WMCredentials = {
      email: Deno.env.get('WM_EMAIL') || '',
      senha: Deno.env.get('WM_SENHA') || '',
      cnpj: Deno.env.get('WM_CNPJ') || '',
    }

    if (!creds.email || !creds.senha) {
      return new Response(JSON.stringify({ error: 'WM credentials not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authResult = await callSOAP(buildAuthXML(creds), 'autenticar')
    if (!authResult.success || !authResult.hashAutenticacao) {
      if (authResult.networkError) {
        return new Response(
          JSON.stringify({
            error: 'Unable to connect to Webmotors service. Please try again later.',
            details: authResult.error,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      return new Response(
        JSON.stringify({
          error: 'WM authentication failed',
          details: authResult.error,
          codigoRetorno: authResult.codigoRetorno,
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const hash = authResult.hashAutenticacao

    // Checagem de duplicidade (12/08/2026, pedido da Adriana): busca o que já
    // está anunciado na Webmotors ANTES de criar qualquer anúncio novo, pra não
    // repetir o que aconteceu com o VW up! (ver docs/webmotors-integracao.md).
    // Roda uma vez por execução, não por item. Se falhar, segue sem a checagem
    // (fail-open) — não é motivo pra travar publicações novas legítimas.
    let estoqueAtualWebmotors: AnuncioWMResumo[] = []
    try {
      const estoqueRes = await callSOAP(buildObterEstoqueAtualXML(hash), 'ObterEstoqueAtual', hash)
      if (estoqueRes.success && estoqueRes.raw) {
        estoqueAtualWebmotors = parseEstoqueAtual(estoqueRes.raw)
      }
    } catch {
      // fail-open — ver comentário acima
    }

    // Cota de anúncios simultâneos por modalidade — só informativo agora
    // (painel/dashboard). Até 27/08/2026 travava IncluirCarro aqui, mas
    // ObterModalidade provou ficar desatualizada por horas depois de
    // exclusões manuais no painel (18/18 quando o real já era 16/18),
    // bloqueando publicações que cabiam de verdade. A trava real hoje é a
    // própria resposta da Webmotors no IncluirCarro (43|32/43|33).
    const quotaPorModalidade: Record<string, { total: number; usados: number }> = {}
    try {
      const modalidadeRes = await callSOAP(buildObterModalidadeXML(hash), 'ObterModalidade', hash)
      if (modalidadeRes.success && modalidadeRes.raw) {
        const modalidades = parseModalidades(modalidadeRes.raw)
        for (const m of modalidades) {
          quotaPorModalidade[m.codigoModalidade] = {
            total: m.quantidadeTotal,
            usados: m.quantidadeUsados,
          }
          await supabase.from('wm_modalidades').upsert(
            {
              codigo_wm: m.codigoModalidade,
              descricao: m.descricao,
              quantidade_total: m.quantidadeTotal,
              quantidade_usados: m.quantidadeUsados,
              atualizado_em: new Date().toISOString(),
            },
            { onConflict: 'codigo_wm' },
          )
        }
      }
    } catch {
      // fail-open — ver comentário acima
    }

    const { data: integracao } = await supabase
      .from('integracao_plataforma')
      .select('id')
      .eq('status', 'conectado')
      .limit(1)
      .maybeSingle()

    if (integracao) {
      await supabase
        .from('integracao_plataforma')
        .update({
          credentials: { hashAutenticacao: hash },
          ultima_sincronizacao: new Date().toISOString(),
        })
        .eq('id', integracao.id)
    }

    const { data: wmPlataforma } = await supabase
      .from('plataformas')
      .select('id')
      .eq('slug', 'webmotors')
      .maybeSingle()

    // Retry manual de um veiculo especifico agora inclui 'error' -- mesmo
    // ajuste ja feito no napista-sync 25/08/2026 (achado real: clicar em
    // retry num veiculo que ja tinha falhado antes nao encontrava linha
    // nenhuma e nao fazia nada). A varredura geral do cron continua sem
    // re-tentar erro sozinha.
    const statusAceitosWM = specificVeiculoId
      ? ['agendado', 'pending_create', 'pending_update', 'pending_modalidade', 'pending_close', 'error']
      : ['agendado', 'pending_create', 'pending_update', 'pending_modalidade', 'pending_close']

    let pubQuery = supabase
      .from('estoque_publicacoes')
      .select('id, veiculo_id, platform, status, post_id, created_at')
      .eq('platform', 'webmotors')
      .in('status', statusAceitosWM)
      .order('created_at', { ascending: false })

    if (specificVeiculoId) {
      pubQuery = pubQuery.eq('veiculo_id', specificVeiculoId)
    }

    const { data: pendingPubsBrutos } = await pubQuery.limit(50)
    if (!pendingPubsBrutos || pendingPubsBrutos.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Achado real 26/08/2026 (Fit LX, publicado 2x na Webmotors): mais de uma
    // linha pendente SEM post_id ainda pro MESMO veiculo (duas gravacoes
    // quase simultaneas do formulario, ou varios erros acumulados de
    // tentativas antigas) fazia esta function processar cada linha como uma
    // criacao SEPARADA -- publicando o mesmo carro varias vezes de verdade.
    // A checagem contra estoqueAtualWebmotors (abaixo) so pega duplicata
    // entre RODADAS diferentes, nao dentro da mesma rodada. Dedup so entre
    // linhas SEM post_id -- linhas com post_id sao anuncios JA criados de
    // verdade (ex.: pending_close de ofertas duplicadas antigas, cada uma
    // apontando pra um anuncio real diferente) e continuam sendo
    // processadas todas.
    const maisRecenteCriacaoPorVeiculoWM = new Map<string, (typeof pendingPubsBrutos)[number]>()
    const idsCanceladosWM: string[] = []
    for (const pub of pendingPubsBrutos) {
      if (pub.post_id) continue
      const existente = maisRecenteCriacaoPorVeiculoWM.get(pub.veiculo_id)
      if (!existente) {
        maisRecenteCriacaoPorVeiculoWM.set(pub.veiculo_id, pub)
      } else {
        idsCanceladosWM.push(pub.id)
      }
    }
    if (idsCanceladosWM.length > 0) {
      await supabase.from('estoque_publicacoes').update({ status: 'cancelado' }).in('id', idsCanceladosWM)
    }
    const idsCanceladosWMSet = new Set(idsCanceladosWM)
    const pendingPubs = pendingPubsBrutos.filter((pub) => !idsCanceladosWMSet.has(pub.id))

    const results: any[] = []
    for (const pub of pendingPubs) {
      const { data: veiculo } = await supabase
        .from('veiculos')
        .select('*')
        .eq('id', pub.veiculo_id)
        .maybeSingle()

      if (!veiculo) {
        await supabase
          .from('estoque_publicacoes')
          .update({ status: 'error', erro_msg: 'Vehicle not found' })
          .eq('id', pub.id)
        results.push({ id: pub.id, status: 'error', error: 'Vehicle not found' })
        continue
      }

      const { data: mapeamento } = await supabase
        .from('wm_mapeamento_veiculos')
        .select('*')
        .eq('veiculo_id', veiculo.id)
        .maybeSingle()

      if (!mapeamento || mapeamento.status_sincronizacao !== 'mapeado') {
        const msg =
          'Veículo sem mapeamento de catálogo Webmotors confirmado (marca/modelo/versão/cor/câmbio/combustível). Publicação bloqueada até mapear.'
        await supabase
          .from('estoque_publicacoes')
          .update({ status: 'error', erro_msg: msg })
          .eq('id', pub.id)
        results.push({ id: pub.id, status: 'error', error: msg })
        continue
      }

      const [{ data: corRow }, { data: cambioRow }, { data: combustivelRow }] = await Promise.all([
        supabase
          .from('wm_cores')
          .select('nome_wm')
          .eq('codigo_wm', mapeamento.codigo_cor_wm)
          .maybeSingle(),
        supabase
          .from('wm_cambios')
          .select('nome_wm')
          .eq('codigo_wm', mapeamento.codigo_cambio_wm)
          .maybeSingle(),
        supabase
          .from('wm_combustiveis')
          .select('nome_wm')
          .eq('codigo_wm', mapeamento.codigo_combustivel_wm)
          .maybeSingle(),
      ])

      const mapa: MapeamentoWM = {
        codigo_marca_wm: mapeamento.codigo_marca_wm,
        codigo_modelo_wm: mapeamento.codigo_modelo_wm,
        codigo_versao_wm: mapeamento.codigo_versao_wm,
        codigo_cor_wm: mapeamento.codigo_cor_wm,
        codigo_combustivel_wm: mapeamento.codigo_combustivel_wm,
        codigo_cambio_wm: mapeamento.codigo_cambio_wm,
        codigo_modalidade_wm: mapeamento.codigo_modalidade_wm,
        descricao_cor: corRow?.nome_wm || veiculo.cor || '',
        descricao_cambio: cambioRow?.nome_wm || veiculo.cambio || '',
        descricao_combustivel: combustivelRow?.nome_wm || veiculo.combustivel || '',
        ano_modelo_override_wm: mapeamento.ano_modelo_override_wm,
      }

      // Guard corrigido em 07/08/2026: a validação original só checava as
      // DESCRIÇÕES (descricao_cor/descricao_cambio/descricao_combustivel), que
      // têm fallback pro texto livre do veículo e por isso quase sempre passam
      // mesmo com o CÓDIGO ausente. Os campos <Codigo*> enviados no XML não têm
      // fallback nenhum — se vierem null/undefined, o template literal manda a
      // string literal "null"/"undefined" pra Webmotors. É exatamente essa classe
      // de bug (CodigoRetorno 22|78 de 06/08/2026) que essa correção pretendia
      // fechar; o guard antigo não cobria os códigos, só o eco textual deles.
      const codigosFaltando = [
        !mapa.codigo_cor_wm && 'codigo_cor_wm',
        !mapa.codigo_cambio_wm && 'codigo_cambio_wm',
        !mapa.codigo_combustivel_wm && 'codigo_combustivel_wm',
        !mapa.codigo_modalidade_wm && 'codigo_modalidade_wm',
      ].filter(Boolean)

      if (codigosFaltando.length > 0) {
        const msg = `Código(s) de catálogo Webmotors ausente(s) em wm_mapeamento_veiculos: ${codigosFaltando.join(', ')}. Publicação bloqueada — enviar esses campos vazios faria a Webmotors receber "null"/"undefined" no XML. Complete o mapeamento antes de publicar.`
        await supabase
          .from('estoque_publicacoes')
          .update({ status: 'error', erro_msg: msg })
          .eq('id', pub.id)
        results.push({ id: pub.id, status: 'error', error: msg })
        continue
      }

      // De/para opcionais (13/08/2026): termos de veiculos.diferenciais sem
      // equivalente em wm_opcionais.nome_crm simplesmente não viram opcional
      // lá — não bloqueia a publicação, só não aparece esse badge específico.
      const diferenciais: string[] = Array.isArray(veiculo.diferenciais) ? veiculo.diferenciais : []
      let codigosOpcionais: string[] = []
      if (diferenciais.length > 0) {
        const { data: opcionaisRows } = await supabase
          .from('wm_opcionais')
          .select('codigo_wm')
          .in('nome_crm', diferenciais)
        codigosOpcionais = (opcionaisRows || []).map((o: any) => o.codigo_wm)
      }
      const fotosVeiculo: string[] = Array.isArray(veiculo.fotos) ? veiculo.fotos : []

      try {
        if (pub.status === 'pending_create' || pub.status === 'agendado' || (pub.status === 'error' && !pub.post_id)) {
          const placaVeiculo = normalizarPlaca(veiculo.placa)
          const candidatoDuplicado = placaVeiculo
            ? estoqueAtualWebmotors.find((a) => a.placa === placaVeiculo)
            : undefined
          // Achado real 27/08/2026 (HR-V, CodigoAnuncio 77614580): a lista
          // do ObterEstoqueAtual pode ficar presa com um anuncio ja
          // excluido manualmente no painel por muito tempo (+24h) --
          // confiar cegamente nela quase causou um falso "ja publicado"
          // que teria travado uma publicacao legitima pra sempre.
          // Confirma com ObterFotosCarro antes de aceitar o match: se o
          // anuncio realmente existe, ele ecoa o mesmo CodigoAnuncio de
          // volta; se for fantasma, ecoa 0.
          let jaAnunciado = candidatoDuplicado
          if (candidatoDuplicado) {
            const fotosXml = buildObterFotosCarroXML(hash, candidatoDuplicado.codigoAnuncio)
            const fotosRes = await callSOAP(fotosXml, 'ObterFotosCarro', hash)
            const codigoEcoado = fotosRes.raw ? (fotosRes.raw.match(/<(?:\w+:)?CodigoAnuncio>([^<]*)</)?.[1] ?? '0') : '0'
            if (codigoEcoado === '0' || codigoEcoado !== candidatoDuplicado.codigoAnuncio) {
              jaAnunciado = undefined
            }
          }
          if (jaAnunciado) {
            const msg = `Este veículo já está anunciado na Webmotors (CodigoAnuncio ${jaAnunciado.codigoAnuncio}) — envio pulado pra não duplicar. Se precisar atualizar o anúncio existente, use a edição, não uma nova publicação.`
            await supabase
              .from('estoque_publicacoes')
              .update({
                status: 'publicado',
                post_id: jaAnunciado.codigoAnuncio,
                erro_msg: msg,
              })
              .eq('id', pub.id)
            await supabase
              .from('veiculos')
              .update({ publicado_webmotors: true })
              .eq('id', veiculo.id)
            results.push({ id: pub.id, status: 'already_published', warning: msg })
            continue
          }

          // Trava de cota local removida (27/08/2026, pedido da Adriana):
          // ObterModalidade provou repetidas vezes nesta sessao estar
          // desatualizada por horas depois de exclusoes manuais no painel
          // (18/18 quando o real ja era 16/18) -- bloqueava publicacoes que
          // cabiam de verdade. Agora tenta sempre; se nao houver vaga real,
          // a propria Webmotors recusa no IncluirCarro com 43|32 (modalidade
          // esgotada) ou 43|33 (pacote esgotado), e cai no tratamento de
          // erro abaixo -- auditoria pelo retorno real, nao por cache local.
          const xml = buildIncluirCarroXML(veiculo, hash, mapa, codigosOpcionais)
          const res = await callSOAP(xml, 'IncluirCarro', hash)
          await registrarTrocaXML(supabase, veiculo.id, 'IncluirCarro', xml, res.raw)
          if (res.success && res.codigoAnuncio) {
            await supabase
              .from('estoque_publicacoes')
              .update({
                status: 'publicado',
                post_id: res.codigoAnuncio,
                publicado_em: new Date().toISOString(),
                erro_msg: null,
              })
              .eq('id', pub.id)
            await supabase
              .from('veiculos')
              .update({ publicado_webmotors: true })
              .eq('id', veiculo.id)
            await supabase
              .from('wm_mapeamento_veiculos')
              .update({ codigo_anuncio_wm: res.codigoAnuncio })
              .eq('veiculo_id', veiculo.id)
            const fotosResultado = await enviarFotos(hash, res.codigoAnuncio, fotosVeiculo)
            results.push({
              id: pub.id,
              status: 'created',
              codigoAnuncio: res.codigoAnuncio,
              fotos: fotosResultado,
            })
          } else {
            await supabase
              .from('estoque_publicacoes')
              .update({ status: 'error', erro_msg: res.error })
              .eq('id', pub.id)
            results.push({ id: pub.id, status: 'error', error: res.error })
          }
        } else if ((pub.status === 'pending_update' || pub.status === 'error') && pub.post_id) {
          const xml = buildAlterarCarroXML(veiculo, hash, mapa, pub.post_id, codigosOpcionais)
          const res = await callSOAP(xml, 'AlterarCarro', hash)
          await registrarTrocaXML(supabase, veiculo.id, 'AlterarCarro', xml, res.raw)
          if (res.success) {
            await supabase
              .from('estoque_publicacoes')
              .update({ status: 'publicado', erro_msg: null })
              .eq('id', pub.id)
            // Só manda foto se o anúncio ainda não tem nenhuma — evita
            // duplicar a cada AlterarCarro (ex: preço mudou de novo).
            let fotosResultado: { enviadas: number; falhas: number } | null = null
            try {
              const fotosRes = await callSOAP(
                buildObterFotosCarroXML(hash, pub.post_id),
                'ObterFotosCarro',
                hash,
              )
              const quantidadeAtual = fotosRes.success && fotosRes.raw ? parseQuantidadeFotos(fotosRes.raw) : -1
              if (quantidadeAtual === 0 && fotosVeiculo.length > 0) {
                fotosResultado = await enviarFotos(hash, pub.post_id, fotosVeiculo)
              }
            } catch {
              // não bloqueia o update por falha nessa checagem extra
            }
            results.push({ id: pub.id, status: 'updated', fotos: fotosResultado })
          } else {
            await supabase
              .from('estoque_publicacoes')
              .update({ status: 'error', erro_msg: res.error })
              .eq('id', pub.id)
            results.push({ id: pub.id, status: 'error', error: res.error })
          }
        } else if (pub.status === 'pending_modalidade' && pub.post_id && mapa.codigo_modalidade_wm) {
          // TrocarModalidadeCarro -- criado 28/08/2026 pra trocar SÓ a
          // modalidade de um anúncio já existente. Diferente de AlterarCarro
          // (bloco acima), que reenvia o anúncio inteiro; essa é a operação
          // que o manual documenta especificamente pra mudança de modalidade.
          // Enfileirado pelo trigger `wm_sync_on_modalidade_change` sempre
          // que codigo_modalidade_wm muda pra um veículo já publicado -- pega
          // o próximo ciclo do cron (a cada 30min), sem precisar clicar em
          // "Publicar/Sincronizar Agora".
          const xml = buildTrocarModalidadeXML(hash, pub.post_id, mapa.codigo_modalidade_wm)
          const res = await callSOAP(xml, 'TrocarModalidadeCarro', hash)
          await registrarTrocaXML(supabase, veiculo.id, 'TrocarModalidadeCarro', xml, res.raw)
          if (res.success) {
            await supabase
              .from('estoque_publicacoes')
              .update({ status: 'publicado', erro_msg: null })
              .eq('id', pub.id)
            results.push({ id: pub.id, status: 'modalidade_trocada' })
          } else {
            await supabase
              .from('estoque_publicacoes')
              .update({ status: 'error', erro_msg: res.error })
              .eq('id', pub.id)
            results.push({ id: pub.id, status: 'error', error: res.error })
          }
        } else if (pub.status === 'pending_close' && pub.post_id) {
          const xml = buildExcluirCarroXML(hash, pub.post_id)
          const res = await callSOAP(xml, 'ExcluirCarro', hash)
          await registrarTrocaXML(supabase, veiculo.id, 'ExcluirCarro', xml, res.raw)
          if (res.success) {
            await supabase
              .from('estoque_publicacoes')
              .update({ status: 'despublicado' })
              .eq('id', pub.id)
            // Só zera a flag se não sobrar nenhuma outra publicação ativa pra esse
            // veículo na Webmotors — sem essa checagem, cancelar um anúncio
            // duplicado (ver docs/webmotors-integracao.md) marcava o veículo como
            // despublicado mesmo com o outro CodigoAnuncio ainda no ar.
            const { count: outrasPublicadas } = await supabase
              .from('estoque_publicacoes')
              .select('id', { count: 'exact', head: true })
              .eq('veiculo_id', veiculo.id)
              .eq('platform', 'webmotors')
              .eq('status', 'publicado')
              .neq('id', pub.id)
            if (!outrasPublicadas) {
              await supabase
                .from('veiculos')
                .update({ publicado_webmotors: false })
                .eq('id', veiculo.id)
            }
            results.push({ id: pub.id, status: 'closed' })
          } else {
            results.push({ id: pub.id, status: 'error', error: res.error })
          }
        }
      } catch (err: any) {
        results.push({ id: pub.id, status: 'error', error: err.message })
      }
    }

    if (wmPlataforma) {
      const logs = results.map((r) => ({
        plataforma_id: wmPlataforma.id,
        veiculo_id: pendingPubs.find((p) => p.id === r.id)?.veiculo_id,
        acao:
          r.status === 'created'
            ? 'create'
            : r.status === 'updated'
              ? 'update'
              : r.status === 'closed'
                ? 'close'
                : r.status === 'already_published'
                  ? 'skip_duplicado'
                  : 'error',
        status:
          r.status === 'error' ? 'erro' : r.status === 'already_published' ? 'warning' : 'success',
        mensagem: r.error || r.warning || `WM sync ${r.status}`,
        metadata: { codigoAnuncio: r.codigoAnuncio },
      }))
      if (logs.length > 0) await supabase.from('sync_log').insert(logs)
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
