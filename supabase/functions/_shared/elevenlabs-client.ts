// Voz da Clara clonada pela Adriana na ElevenLabs (26/08/2026) — usada só
// quando o cliente manda áudio primeiro (ai-sdr decide isso, não este
// arquivo). Nunca lança erro pra fora: falha aqui deve sempre cair pro
// texto normal, nunca travar a conversa.
export async function gerarAudioClara(texto: string): Promise<Uint8Array | null> {
  const apiKey = Deno.env.get('ELEVENLABS_API_KEY')
  const voiceId = Deno.env.get('ELEVENLABS_VOICE_ID')
  if (!apiKey || !voiceId) return null

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: texto,
        model_id: 'eleven_multilingual_v2',
      }),
    })
    if (!res.ok) {
      console.error('ElevenLabs TTS falhou:', res.status, await res.text())
      return null
    }
    return new Uint8Array(await res.arrayBuffer())
  } catch (err) {
    console.error('Erro ao gerar áudio na ElevenLabs:', err)
    return null
  }
}
