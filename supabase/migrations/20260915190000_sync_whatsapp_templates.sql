-- Etapa 1 do plano de templates no chat (15/09/2026, pedido da Adriana).
-- whatsapp_templates existia mas nunca tinha constraint pra upsert seguro
-- por template (a Meta identifica template por nome+idioma).
ALTER TABLE public.whatsapp_templates
  ADD CONSTRAINT whatsapp_templates_nome_idioma_key UNIQUE (nome, idioma);

-- Roda 1x por dia às 8h (Brasília, 11h UTC) — pega aprovação/rejeição da
-- Meta que aconteceu sem ninguém clicar em "Atualizar" no chat.
SELECT cron.schedule(
  'sync-whatsapp-templates-cron-job',
  '0 11 * * *',
  $cron$
    SELECT net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/sync-whatsapp-templates',
      headers := jsonb_build_object('Content-Type', 'application/json')
    );
  $cron$
);
