-- Helper para ler o secret compartilhado com as Edge Functions (INTERNAL_SERVICE_SECRET)
-- a partir do Supabase Vault, em vez de guardar o valor em texto plano numa tabela.
-- O valor precisa ser criado manualmente pelo usuário via:
--   select vault.create_secret('<mesmo_valor_usado_em_INTERNAL_SERVICE_SECRET>', 'internal_service_secret', 'Secret compartilhado com Edge Functions para chamadas internas via x-internal-secret');
CREATE OR REPLACE FUNCTION public.get_internal_service_secret()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'internal_service_secret' LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_internal_service_secret() FROM PUBLIC, anon, authenticated;

-- Trigger: notify new vehicle via WhatsApp (agora envia x-internal-secret)
CREATE OR REPLACE FUNCTION public.notify_new_vehicle_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/notify-new-vehicle',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', coalesce(public.get_internal_service_secret(), '')
    ),
    body := jsonb_build_object(
      'veiculo_id', NEW.id,
      'marca', NEW.marca,
      'modelo', NEW.modelo,
      'ano_modelo', NEW.ano_modelo,
      'preco_venda', NEW.preco_venda,
      'placa', NEW.placa
    )
  );
  RETURN NEW;
END;
$function$;

-- Atualiza os cron jobs existentes (por jobid, preservando o job) para enviar x-internal-secret.
-- Usa cron.alter_job (pg_cron >= 1.5) em vez de unschedule+schedule, para não recriar o job.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 're-engagement-cron-daily') THEN
    PERFORM cron.alter_job(
      job_id := (SELECT jobid FROM cron.job WHERE jobname = 're-engagement-cron-daily'),
      command := $cron$SELECT net.http_post(
        url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/re-engagement-cron',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), ''))
      );$cron$
    );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 're-engagement-cron-job') THEN
    PERFORM cron.alter_job(
      job_id := (SELECT jobid FROM cron.job WHERE jobname = 're-engagement-cron-job'),
      command := $cron$SELECT net.http_post(
        url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/re-engagement-cron',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), ''))
      );$cron$
    );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-report-cron-job') THEN
    PERFORM cron.alter_job(
      job_id := (SELECT jobid FROM cron.job WHERE jobname = 'daily-report-cron-job'),
      command := $cron$SELECT net.http_post(
        url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/daily-report-cron',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), ''))
      );$cron$
    );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'avaliar-qualidade-anuncios-cron') THEN
    PERFORM cron.alter_job(
      job_id := (SELECT jobid FROM cron.job WHERE jobname = 'avaliar-qualidade-anuncios-cron'),
      command := $cron$SELECT net.http_post(
        url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/avaliar-qualidade-anuncios',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), '')),
        body := '{}'::jsonb
      );$cron$
    );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ml_weekly_quality_check') THEN
    PERFORM cron.alter_job(
      job_id := (SELECT jobid FROM cron.job WHERE jobname = 'ml_weekly_quality_check'),
      command := $cron$SELECT net.http_post(
        url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/avaliar-qualidade-anuncios',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), '')),
        body := '{}'::jsonb
      );$cron$
    );
  END IF;
END $$;
