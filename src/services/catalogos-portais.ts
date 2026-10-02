import { supabase } from '@/lib/supabase/client'

interface Atributos {
  cor?: string | null
  cambio?: string | null
  combustivel?: string | null
}

const semAcento = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()

// Pré-checagem ANTES de gravar o veículo (pedido da Adriana, 01/10/2026): confere
// cor, câmbio e combustível contra os catálogos da Webmotors e da NaPista e
// devolve a lista de problemas, em português. Usa exatamente a mesma regra de
// comparação dos mapeadores no servidor (wm-catalogo-match.ts e
// matchAtributoNapista), pra não bloquear aqui o que lá passaria — nem o
// contrário. Catálogo que não carregar não bloqueia (não dá pra afirmar nada).
export async function checarAtributosPortais(v: Atributos): Promise<string[]> {
  const problemas: string[] = []

  if (!v.cambio) {
    problemas.push('Câmbio não informado (a Webmotors e a NaPista exigem)')
  }

  const [cores, cambios, combustiveis, napista] = await Promise.all([
    supabase.from('wm_cores').select('nome_crm, nome_wm'),
    supabase.from('wm_cambios').select('nome_crm, nome_wm'),
    supabase.from('wm_combustiveis').select('nome_crm, nome_wm'),
    supabase.from('napista_atributos').select('dados').eq('id', 'catalogo').maybeSingle(),
  ])

  // Webmotors: igualdade (sem diferenciar maiúscula) com nome_crm OU nome_wm.
  const wmTem = (
    linhas: { nome_crm: string | null; nome_wm: string | null }[] | null,
    valor: string,
  ) => {
    const alvo = valor.trim().toLowerCase()
    return (linhas || []).some(
      (r) =>
        (r.nome_crm || '').trim().toLowerCase() === alvo ||
        (r.nome_wm || '').trim().toLowerCase() === alvo,
    )
  }
  // NaPista: igualdade sem acento e sem diferenciar maiúscula com o nome do item.
  const dados: any = napista.data?.dados || {}
  const napistaTem = (itens: { name: string }[] | undefined, valor: string) =>
    (itens || []).some((i) => semAcento(i.name || '') === semAcento(valor))

  const conferir = (
    rotulo: string,
    valor: string | null | undefined,
    wm: { nome_crm: string | null; nome_wm: string | null }[] | null,
    itensNapista: { name: string }[] | undefined,
  ) => {
    if (!valor) return
    if (wm && wm.length > 0 && !wmTem(wm, valor)) {
      problemas.push(`${rotulo} "${valor}" não existe no catálogo da Webmotors`)
    }
    if (itensNapista && itensNapista.length > 0 && !napistaTem(itensNapista, valor)) {
      problemas.push(`${rotulo} "${valor}" não existe no catálogo da NaPista`)
    }
  }

  conferir('Cor', v.cor, cores.data, dados.colors?.items)
  conferir('Câmbio', v.cambio, cambios.data, dados.transmissionTypes?.items)
  conferir('Combustível', v.combustivel, combustiveis.data, dados.fuelTypes?.items)

  return problemas
}
