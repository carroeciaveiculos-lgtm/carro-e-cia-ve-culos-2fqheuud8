-- Achado em auditoria (14/08/2026, pedido da Adriana): publicar-social já
-- sabia buscar posts com status='Agendado' vencidos, mas nada disparava essa
-- function sozinha — a publicação agendada nunca saía do papel. Roda a cada
-- 15 minutos (mais frequente que os outros cron jobs porque post agendado
-- pra um horário específico não deveria atrasar até 1h pra sair).
SELECT cron.schedule(
  'publicar-social-cron-job',
  '*/15 * * * *',
  $cron$
    SELECT net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/publicar-social',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), ''))
    );
  $cron$
);
