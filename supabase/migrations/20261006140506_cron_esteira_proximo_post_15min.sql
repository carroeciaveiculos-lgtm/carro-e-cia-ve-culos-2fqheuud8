-- Agendamento da esteira de postagens: a cada 15 min chama esteira-proximo-post (sincroniza a fila e, só se a esteira estiver ATIVA e sem item pendente, monta o próximo). 06/10/2026.
-- A esteira nasce pausada (esteira_config.ativa=false), então o agendamento é inofensivo até a Adriana ligar. Confere antes se já existe.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'esteira-proximo-post-cron-job') THEN
    PERFORM cron.schedule('esteira-proximo-post-cron-job', '*/15 * * * *', $job$
      SELECT net.http_post(
        url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/esteira-proximo-post',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), '')),
        body := '{"acao":"proximo"}'::jsonb
      );
    $job$);
  END IF;
END $$;
