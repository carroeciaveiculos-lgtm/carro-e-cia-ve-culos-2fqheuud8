import { supabase } from '@/lib/supabase/client'

export const NIVEIS_USUARIO = ['admin_master', 'gerente', 'operador', 'bloqueado'] as const

export type DadosPessoais = { whatsapp: string; endereco: string }

/** Só números, com DDI 55 quando a pessoa digitou só DDD + número. Vazio se não houver número. */
export const normalizarWhatsApp = (valor: string) => {
  const digitos = (valor || '').replace(/\D/g, '')
  if (!digitos) return ''
  return digitos.length <= 11 ? `55${digitos}` : digitos
}

/** Formata para mostrar na tela: +55 (34) 99999-9999. Devolve o texto original se não reconhecer. */
export const formatarWhatsApp = (digitos: string) => {
  const m = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(digitos || '')
  return m ? `+55 (${m[1]}) ${m[2]}-${m[3]}` : digitos || ''
}

export const getDadosPessoais = async (usuarioId: string) => {
  const { data, error } = await supabase
    .from('usuarios_dados_pessoais')
    .select('whatsapp, endereco')
    .eq('usuario_id', usuarioId)
    .maybeSingle()
  return { data, error }
}

export const salvarDadosPessoais = async (usuarioId: string, dados: DadosPessoais) => {
  const whatsapp = normalizarWhatsApp(dados.whatsapp)
  const { error } = await supabase.from('usuarios_dados_pessoais').upsert({
    usuario_id: usuarioId,
    whatsapp: whatsapp || null,
    endereco: dados.endereco.trim() || null,
    updated_at: new Date().toISOString(),
  })
  return { error }
}

/**
 * Desativar = tira da lista de responsáveis e bloqueia o acesso ao painel (nível "bloqueado").
 * Não apaga nada: leads, veículos e histórico da pessoa continuam. Reversível com reativarUsuario.
 * Quem pode: só admin_master (a regra de segurança está na política do banco).
 */
export const desativarUsuario = async (id: string) => {
  const { error } = await supabase
    .from('usuarios')
    .update({ ativo: false, nivel: 'bloqueado' })
    .eq('id', id)
  return { error }
}

export const reativarUsuario = async (id: string, nivel: string) => {
  const { error } = await supabase.from('usuarios').update({ ativo: true, nivel }).eq('id', id)
  return { error }
}

/**
 * Impede o desastre mais provável: desativar a si mesma ou o último admin master ativo.
 * Devolve a mensagem em português, ou null se pode seguir.
 */
export const motivoParaNaoDesativar = async (
  alvo: { id: string; nivel?: string | null },
  eu: string | undefined,
) => {
  if (alvo.id === eu) return 'Você não pode desativar o próprio acesso.'
  if (alvo.nivel === 'admin_master') {
    const { count } = await supabase
      .from('usuarios')
      .select('id', { count: 'exact', head: true })
      .eq('nivel', 'admin_master')
      .eq('ativo', true)
      .neq('id', alvo.id)
    if (!count) return 'Este é o último Admin Master ativo; desativá-lo trancaria o painel.'
  }
  return null
}
