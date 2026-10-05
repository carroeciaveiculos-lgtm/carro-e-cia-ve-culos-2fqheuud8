// Modalidade (plano do anúncio) da Webmotors — 05/10/2026.
//
// Achado real (ix35 PBB9J82, 05/10/2026): o veículo foi mapeado pelo caminho de REVISÃO + confirmação
// manual e ficou com `codigo_modalidade_wm` vazio; o guard do wm-sync bloqueia a publicação sem esse
// código (e com razão: mandaria "null" no XML). Só o caminho 100% automático do mapeador gravava a
// modalidade; os ramos de revisão e a function wm-confirmar-mapeamento não. A correção de 20/08/2026
// cobriu cor/câmbio/combustível e deixou a modalidade de fora.
//
// Regra agora: TODO mapeamento ganha a modalidade padrão ("Anúncio Básico") se ainda não tiver uma.
// Quem já tem (inclusive uma modalidade Vip escolhida na tela) NUNCA é sobrescrito.

// Busca ao vivo em wm_modalidades (o código de produção é 6351; já mudou uma vez, de 2943 em
// homologação para 6351), com 6351 como reserva caso a tabela ainda não tenha sido populada.
// deno-lint-ignore no-explicit-any
export async function obterCodigoModalidadeBasico(supabase: any): Promise<string> {
  const { data } = await supabase
    .from('wm_modalidades')
    .select('codigo_wm')
    .eq('descricao', 'Anúncio Básico')
    .maybeSingle()
  return data?.codigo_wm || '6351'
}

// Devolve os campos a gravar, acrescidos da modalidade padrão SOMENTE quando nem o mapeamento
// existente nem os campos novos já trazem uma.
// deno-lint-ignore no-explicit-any
export async function comModalidade<T extends Record<string, any>>(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  atual: { codigo_modalidade_wm?: string | null } | null | undefined,
  campos: T,
): Promise<T & { codigo_modalidade_wm?: string }> {
  if (campos.codigo_modalidade_wm || atual?.codigo_modalidade_wm) return campos
  return { ...campos, codigo_modalidade_wm: await obterCodigoModalidadeBasico(supabase) }
}
