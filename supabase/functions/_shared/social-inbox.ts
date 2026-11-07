// Caixa de entrada da Central de Redes Sociais (04/10/2026): grava conversas e mensagens de
// Instagram/Messenger em social_conversas e social_mensagens. NÃO cria lead: o CRM de leads da Clara
// é só de WhatsApp (decisão da Adriana).
import type { MensagemDireta } from './mensagem-direta.ts'

// Nome de quem escreveu (melhor esforço: sem token ou sem permissão, devolve null).
// Instagram: nome/@usuário; Messenger: nome.
export type PerfilMeta = { nome: string | null; usuario: string | null }

// 06/11/2026: as 23 conversas existentes ficaram sem nome porque a consulta falhava em silêncio.
// Agora tenta mais de uma combinação de campos (um campo sem permissão derruba a consulta toda) e
// REGISTRA o motivo da Meta no log (nunca o token).
export async function buscarPerfilMeta(id: string, plataforma: string): Promise<PerfilMeta> {
  const vazio: PerfilMeta = { nome: null, usuario: null }
  try {
    const token = Deno.env.get('META_PAGE_ACCESS_TOKEN')
    if (!token) {
      console.error('buscarPerfilMeta: META_PAGE_ACCESS_TOKEN ausente, nome não buscado')
      return vazio
    }
    const tentativas =
      plataforma === 'instagram'
        ? ['name,username', 'username', 'name']
        : ['name', 'first_name,last_name']
    for (const campos of tentativas) {
      const r = await fetch(
        `https://graph.facebook.com/v20.0/${id}?fields=${campos}&access_token=${encodeURIComponent(token)}`,
        { signal: AbortSignal.timeout(4000) },
      )
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        console.error(
          `buscarPerfilMeta ${plataforma} campos=${campos} HTTP ${r.status}:`,
          JSON.stringify(j?.error ?? j).slice(0, 300),
        )
        continue
      }
      const completo = [j?.first_name, j?.last_name].filter(Boolean).join(' ')
      const nome = j?.name || completo || null
      const usuario = j?.username ? String(j.username).slice(0, 80) : null
      if (nome || usuario) {
        return {
          nome: nome ? String(nome).slice(0, 120) : usuario ? `@${usuario}` : null,
          usuario,
        }
      }
    }
    return vazio
  } catch (e) {
    console.error('buscarPerfilMeta falhou:', e)
    return vazio
  }
}

export async function buscarNomePerfilMeta(id: string, plataforma: string): Promise<string | null> {
  return (await buscarPerfilMeta(id, plataforma)).nome
}

export type ResultadoRegistro = {
  nova: boolean // false = reenvio da Meta (mesmo mid) ou erro: não deve gerar aviso
  conversaId: string | null
  nome: string | null
}

// deno-lint-ignore no-explicit-any
export async function registrarMensagemSocial(
  supabase: any,
  m: MensagemDireta,
): Promise<ResultadoRegistro> {
  try {
    // Reenvio do mesmo evento (a Meta repete quando demora a responder 200): não duplica.
    if (m.mid) {
      const { data: jaTem } = await supabase
        .from('social_mensagens')
        .select('id')
        .eq('mid', m.mid)
        .limit(1)
        .maybeSingle()
      if (jaTem) return { nova: false, conversaId: null, nome: null }
    }

    const { data: existente } = await supabase
      .from('social_conversas')
      .select('id, contato_nome, nao_lidas, origem_contato')
      .eq('plataforma', m.plataforma)
      .eq('contato_id', m.contatoId)
      .maybeSingle()

    let conversaId: string | null = existente?.id ?? null
    let nome: string | null = existente?.contato_nome ?? null
    let usuario: string | null = null
    if (!nome) {
      const perfil = await buscarPerfilMeta(m.contatoId, m.plataforma)
      nome = perfil.nome
      usuario = perfil.usuario
    }

    const quando = m.quando.toISOString()
    const entrada = m.direcao === 'entrada'

    if (!conversaId) {
      const { data: criada, error } = await supabase
        .from('social_conversas')
        .insert({
          plataforma: m.plataforma,
          contato_id: m.contatoId,
          contato_nome: nome,
          contato_usuario: usuario,
          origem_contato: m.origemContato,
          ultima_mensagem: m.texto.slice(0, 300),
          ultima_mensagem_em: quando,
          ultima_do_cliente_em: entrada ? quando : null,
          nao_lidas: entrada ? 1 : 0,
        })
        .select('id')
        .single()
      if (error) {
        // duas mensagens da mesma pessoa chegando juntas: a outra criou a conversa primeiro
        const { data: outra } = await supabase
          .from('social_conversas')
          .select('id')
          .eq('plataforma', m.plataforma)
          .eq('contato_id', m.contatoId)
          .maybeSingle()
        if (!outra) {
          console.error('Falha ao criar conversa social:', error)
          return { nova: false, conversaId: null, nome }
        }
        conversaId = outra.id
      } else {
        conversaId = criada.id
      }
    }

    const { error: erroMsg } = await supabase.from('social_mensagens').insert({
      conversa_id: conversaId,
      direcao: m.direcao,
      origem: m.origem,
      texto: m.texto,
      mid: m.mid,
      criado_em: quando,
    })
    if (erroMsg) {
      // 23505 = mid repetido (corrida entre dois reenvios): já foi gravada
      if (erroMsg.code !== '23505') console.error('Falha ao gravar mensagem social:', erroMsg)
      return { nova: false, conversaId, nome }
    }

    // Conversa já existia: atualiza o resumo. (Se acabou de ser criada acima, já está certa.)
    if (existente) {
      const patch: Record<string, unknown> = {
        ultima_mensagem: m.texto.slice(0, 300),
        ultima_mensagem_em: quando,
      }
      if (nome && !existente.contato_nome) patch.contato_nome = nome
      if (usuario) patch.contato_usuario = usuario
      if (m.origemContato && !existente.origem_contato) patch.origem_contato = m.origemContato
      if (entrada) {
        patch.ultima_do_cliente_em = quando
        patch.nao_lidas = (existente.nao_lidas ?? 0) + 1
        patch.status = 'aberta' // cliente voltou a escrever: reabre
      } else {
        patch.nao_lidas = 0 // a equipe respondeu: nada pendente
      }
      await supabase.from('social_conversas').update(patch).eq('id', conversaId)
    }

    return { nova: true, conversaId, nome }
  } catch (e) {
    console.error('Erro ao registrar mensagem social:', e)
    return { nova: false, conversaId: null, nome: null }
  }
}
