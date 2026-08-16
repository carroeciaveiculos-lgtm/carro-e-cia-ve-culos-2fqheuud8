-- Remove crons duplicados, achados em 16/08/2026 investigando o wm-sync.
-- re-engagement-cron-daily (23/06) e re-engagement-cron-job (23/06, mesmo dia)
-- chamam a mesma função no mesmo horário (0 10 * * *) desde a criação — alguém
-- tentou recriar/renomear o job e esqueceu de desligar o original.
-- avaliar-qualidade-anuncios-cron (23/07) e ml_weekly_quality_check (23/07,
-- minutos depois) chamam a mesma função avaliar-qualidade-anuncios, mesmo
-- padrão de duplicação. Os dois pares foram inclusive atualizados em paralelo
-- em 02/08 (internal_service_secret_cron_headers) sem que a duplicidade fosse
-- percebida.
-- Mantidos: re-engagement-cron-job e avaliar-qualidade-anuncios-cron (seguem
-- o padrão de nome <função>-cron-job/-cron do resto do sistema).
DO $$
BEGIN
  PERFORM cron.unschedule('re-engagement-cron-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('ml_weekly_quality_check');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
