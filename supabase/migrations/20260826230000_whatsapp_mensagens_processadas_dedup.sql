-- Achado real 26/08/2026 (Adriana testando audio da Clara): a Meta reenvia
-- o MESMO webhook de mensagem (mesmo wamid) quando nossa function demora
-- pra responder -- audio (baixar + transcrever no Gemini + gerar resposta +
-- gerar audio na ElevenLabs + subir no R2 + mandar pelo WhatsApp) e' um
-- processamento bem mais lento que texto puro, quase sempre estoura o prazo
-- de resposta que a Meta espera. Resultado real: a MESMA pergunta de audio
-- foi processada 3 vezes (wamid identico, 3 entregas em ~45s), gerando 3
-- respostas duplicadas e inconsistentes entre si.
CREATE TABLE IF NOT EXISTS public.whatsapp_mensagens_processadas (
  wamid text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.whatsapp_mensagens_processadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_wa_msgs_processadas" ON public.whatsapp_mensagens_processadas;
CREATE POLICY "service_role_full_access_wa_msgs_processadas"
  ON public.whatsapp_mensagens_processadas FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Limpeza automatica: nao precisa guardar pra sempre, so o suficiente pra
-- cobrir a janela de retry da Meta (algumas horas, no maximo).
CREATE INDEX IF NOT EXISTS idx_wa_msgs_processadas_created_at
  ON public.whatsapp_mensagens_processadas (created_at);
