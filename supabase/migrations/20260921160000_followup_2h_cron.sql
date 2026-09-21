-- Reengajamento rápido (21/09/2026, pedido da Adriana) — cobre o intervalo
-- entre o silêncio do cliente e o re-engagement-cron (que só age a partir de
-- 48h). Roda de hora em hora; a function decide sozinha, por lead, se é hora
-- de mandar a 1ª/2ª/3ª tentativa ou a etapa de template (24h+), sem precisar
-- de coluna nova (rastreio via marcador em conversation_history, ver código).
SELECT cron.schedule(
  'follow-up-2h-cron-job',
  '45 * * * *',
  $cron$
    SELECT net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/follow-up-2h-cron',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), ''))
    );
  $cron$
);
