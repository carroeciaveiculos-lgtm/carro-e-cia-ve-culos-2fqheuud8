-- Post orgânico diário na página do Facebook (22/09/2026, pedido da
-- Adriana). Gera 1 Rascunho por dia às 08h (BRT) pra ela revisar e aprovar
-- em Redes Sociais > Aprovação — nunca publica sozinho.
SELECT cron.schedule(
  'post-organico-diario-cron-job',
  '0 11 * * *',
  $cron$
    SELECT net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/post-organico-diario-cron',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), ''))
    );
  $cron$
);
