// Transcrição de áudio recebido do WhatsApp (26/08/2026, pedido da Adriana) —
// baixa o áudio de verdade da Meta e manda pro Gemini entender o que a
// pessoa falou, pra Clara conseguir seguir o atendimento normal a partir de
// um áudio, igual seguiria a partir de texto. Nunca lança erro pra fora:
// falha aqui só faz o chamador cair no aviso genérico de sempre.
function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

async function transcreverAudio(bytes: Uint8Array, mimeType: string): Promise<string | null> {
  const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GEMINI_APY_KEY')
  if (!apiKey) return null

  try {
    const base64 = toBase64(bytes)
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Transcreva literalmente o que a pessoa fala neste áudio, em português do Brasil. Responda só com a transcrição, sem nenhum comentário antes ou depois. Se não conseguir entender nada de útil (ruído, silêncio, áudio corrompido), responda exatamente: [inaudivel]',
                },
                { inline_data: { mime_type: mimeType, data: base64 } },
              ],
            },
          ],
        }),
      },
    )
    if (!res.ok) {
      console.error('Falha ao transcrever áudio no Gemini:', res.status, await res.text())
      return null
    }
    const data = await res.json()
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!texto || texto === '[inaudivel]') return null
    return texto
  } catch (err) {
    console.error('Erro ao transcrever áudio:', err)
    return null
  }
}

export async function baixarETranscreverAudioWhatsApp(mediaId: string): Promise<string | null> {
  try {
    const waToken = Deno.env.get('WHATSAPP_TOKEN')
    if (!waToken) return null

    const metaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${waToken}` },
    })
    if (!metaRes.ok) return null
    const metaData = await metaRes.json()
    if (!metaData.url) return null

    const audioRes = await fetch(metaData.url, { headers: { Authorization: `Bearer ${waToken}` } })
    if (!audioRes.ok) return null
    const bytes = new Uint8Array(await audioRes.arrayBuffer())
    const mimeType = (metaData.mime_type || 'audio/ogg').split(';')[0].trim()

    return await transcreverAudio(bytes, mimeType)
  } catch (err) {
    console.error('Falha ao baixar áudio recebido do WhatsApp:', err)
    return null
  }
}
