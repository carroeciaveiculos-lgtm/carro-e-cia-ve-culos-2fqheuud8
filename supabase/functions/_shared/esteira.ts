// Lógica da esteira de postagens (05/10/2026), separada da função para poder ser testada com um banco
// simulado. Ver supabase/functions/esteira-proximo-post/index.ts para o contexto e a autorização.

// Hoje só carrossel é gerado; vídeo (Fase B) fica na fila até ser ligado.
export const TIPOS_ATIVOS = ['carrossel']
export const MAX_ITENS_POR_CHAMADA = 5 // itens bloqueados (poucas fotos limpas) saltados numa chamada

// deno-lint-ignore no-explicit-any
export type Cliente = any

export type RespostaMontar = { status: number; corpo: any }
export type ChamarMontar = (veiculoId: string, ciclo: number) => Promise<RespostaMontar>

// Veículos novos entram na frente da fila (mais recentes primeiro); veículo que deixou de estar
// disponível (vendido) sai da fila; vídeo cadastrado depois ganha seu item.
export async function sincronizarFila(admin: Cliente) {
  const { data: veiculos } = await admin
    .from('veiculos')
    .select('id, status, videos')
    .eq('status', 'disponivel')
  const disponiveis = (veiculos ?? []) as { id: string; videos: unknown }[]

  const { data: itens } = await admin
    .from('social_esteira')
    .select('veiculo_id, tipo, ciclo, ordem, estado')
  const existentes = (itens ?? []) as {
    veiculo_id: string
    tipo: string
    ciclo: number
    ordem: number
    estado: string
  }[]
  const tem = (id: string, tipo: string) =>
    existentes.some((i) => i.veiculo_id === id && i.tipo === tipo)
  const ordemCarrossel = (id: string) =>
    existentes.find((i) => i.veiculo_id === id && i.tipo === 'carrossel')?.ordem

  let menor = existentes.reduce((m, i) => Math.min(m, i.ordem), 0)
  const novos: Record<string, unknown>[] = []
  // mais recentes primeiro: cada novo entra antes do anterior
  const semItem = disponiveis.filter((v) => !tem(v.id, 'carrossel'))
  if (semItem.length > 0) {
    const { data: datas } = await admin
      .from('veiculos')
      .select('id, created_at')
      .in(
        'id',
        semItem.map((v) => v.id),
      )
      .order('created_at', { ascending: true })
    for (const d of (datas ?? []) as { id: string }[]) {
      menor -= 10
      novos.push({ veiculo_id: d.id, tipo: 'carrossel', ciclo: 1, ordem: menor, estado: 'fila' })
      const v = disponiveis.find((x) => x.id === d.id)
      if (v && Array.isArray(v.videos) && v.videos.length > 0) {
        novos.push({ veiculo_id: d.id, tipo: 'video', ciclo: 1, ordem: menor + 1, estado: 'fila' })
      }
    }
  }
  for (const v of disponiveis) {
    const o = ordemCarrossel(v.id)
    if (o !== undefined && !tem(v.id, 'video') && Array.isArray(v.videos) && v.videos.length > 0) {
      novos.push({ veiculo_id: v.id, tipo: 'video', ciclo: 1, ordem: o + 1, estado: 'fila' })
    }
  }
  if (novos.length > 0) {
    await admin
      .from('social_esteira')
      .upsert(novos, { onConflict: 'veiculo_id,tipo,ciclo', ignoreDuplicates: true })
  }

  // saiu do estoque disponível: não vale mais postar
  const idsDisponiveis = new Set(disponiveis.map((v) => v.id))
  const sairam = existentes
    .filter((i) => i.estado === 'fila' && !idsDisponiveis.has(i.veiculo_id))
    .map((i) => i.veiculo_id)
  if (sairam.length > 0) {
    await admin
      .from('social_esteira')
      .update({
        estado: 'pulado',
        motivo: 'veículo não está mais disponível',
        atualizado_em: new Date().toISOString(),
      })
      .eq('estado', 'fila')
      .in('veiculo_id', sairam)
  }
  return { novos: novos.length, sairam: sairam.length }
}

// Itens "em aprovação" cujos rascunhos já foram decididos (aprovados, publicados, recusados ou apagados)
// deixam de segurar a fila. Apagou todos = pulado; ficou algum post = concluído.
export async function reconciliar(admin: Cliente): Promise<number> {
  const { data: itens } = await admin
    .from('social_esteira')
    .select('id, post_ids')
    .eq('estado', 'em_aprovacao')
  let aindaPendentes = 0
  for (const item of (itens ?? []) as { id: string; post_ids: string[] }[]) {
    const { data: posts } = await admin
      .from('social_posts')
      .select('id, status')
      .in('id', item.post_ids)
    const lista = (posts ?? []) as { id: string; status: string }[]
    if (lista.some((p) => p.status === 'Rascunho')) {
      aindaPendentes++
      continue
    }
    await admin
      .from('social_esteira')
      .update(
        lista.length === 0
          ? {
              estado: 'pulado',
              motivo: 'rascunhos apagados pela equipe',
              atualizado_em: new Date().toISOString(),
            }
          : { estado: 'concluido', motivo: null, atualizado_em: new Date().toISOString() },
      )
      .eq('id', item.id)
  }
  return aindaPendentes
}

export async function proximo(admin: Cliente, chamarMontar: ChamarMontar) {
  for (let i = 0; i < MAX_ITENS_POR_CHAMADA; i++) {
    const { data: item } = await admin
      .from('social_esteira')
      .select('id, veiculo_id, tipo, ciclo')
      .eq('estado', 'fila')
      .in('tipo', TIPOS_ATIVOS)
      .order('ordem', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (!item) return { acao: 'fila_vazia' }

    const r = await chamarMontar(item.veiculo_id, item.ciclo)
    const j = r.corpo ?? {}
    const agora = new Date().toISOString()

    // veículo sem como virar carrossel (poucas fotos limpas, não disponível...): bloqueia e segue
    if (r.status === 422) {
      await admin
        .from('social_esteira')
        .update({
          estado: 'bloqueado',
          motivo: String(j?.error ?? 'não foi possível montar o carrossel').slice(0, 300),
          atualizado_em: agora,
        })
        .eq('id', item.id)
      continue
    }
    if (r.status < 200 || r.status >= 300 || !j?.success) {
      // erro inesperado (rede, banco): não gasta o item, tenta de novo no próximo ciclo
      return {
        acao: 'erro',
        item_id: item.id,
        erro: String(j?.error ?? `HTTP ${r.status}`).slice(0, 200),
      }
    }

    const criados = Object.values(j.resultados ?? {})
      .filter((x) => (x as { criado?: boolean }).criado)
      .map((x) => (x as { post_id: string }).post_id)
    if (criados.length === 0) {
      // já existia post automático igual (ex.: criado antes da esteira): considera tratado
      await admin
        .from('social_esteira')
        .update({
          estado: 'concluido',
          motivo: 'já existia post automático igual',
          atualizado_em: agora,
        })
        .eq('id', item.id)
      continue
    }
    await admin
      .from('social_esteira')
      .update({ estado: 'em_aprovacao', post_ids: criados, motivo: null, atualizado_em: agora })
      .eq('id', item.id)
    return { acao: 'criado', item_id: item.id, veiculo_id: item.veiculo_id, posts: criados }
  }
  return { acao: 'varios_bloqueados' }
}
