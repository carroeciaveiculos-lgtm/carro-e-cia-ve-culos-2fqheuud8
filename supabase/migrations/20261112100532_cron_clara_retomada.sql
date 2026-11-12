-- Agendamento da retomada automática da Clara (11/11/2026). Aplicar SÓ DEPOIS de a função
-- clara-retomada-cron estar publicada (senão o job chama uma função inexistente).
-- A cada 10 minutos. A função confere x-internal-secret.
-- Rollback: select cron.unschedule('clara-retomada-cron-job');

select cron.unschedule('clara-retomada-cron-job')
where exists (select 1 from cron.job where jobname = 'clara-retomada-cron-job');

select cron.schedule(
  'clara-retomada-cron-job',
  '*/10 * * * *',
  $cron$
    select net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/clara-retomada-cron',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), '')),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    );
  $cron$
);
