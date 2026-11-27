-- 26/11/2026: rotina diária da limpeza do R2. 06:30 UTC = 03:30 em Brasília (fora do horário da loja).
-- Modo real autorizado pela Adriana em 26/11/2026: o corpo já pede {"executar": true}, mas a function só
-- apaga se o secret R2_LIMPEZA_ATIVA = 'true' também existir (trava dupla). Sem o secret, roda em ensaio.
-- Para voltar só ao ensaio: apagar o secret R2_LIMPEZA_ATIVA (não precisa mexer no cron).
select cron.schedule(
  'r2-limpeza-diaria',
  '30 6 * * *',
  $cron$
  select net.http_post(
    url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/r2-limpeza',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), '')),
    body := '{"executar": true}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cron$
);

-- Para desfazer: select cron.unschedule('r2-limpeza-diaria');
