-- Fase 5 do plano de corte Modelo/Versao (sessao 16, MEMORY_WORK.MD) --
-- unica fase que faltava; Fases 1-4 ja estavam completas e em producao
-- desde 27/08/2026. So registra o resultado de cada auditoria mensal --
-- quem decide se um candidato vira excecao de verdade continua sendo a
-- Adriana (ver supabase/functions/fipe-auditoria-modelo-versao).
CREATE TABLE IF NOT EXISTS public.fipe_auditoria_modelo_versao_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executado_em timestamptz NOT NULL DEFAULT now(),
  marcas_auditadas integer NOT NULL DEFAULT 0,
  modelos_auditados integer NOT NULL DEFAULT 0,
  candidatos jsonb NOT NULL DEFAULT '[]'::jsonb,
  marcas_sem_correspondencia_fipe jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'ok',
  erro text
);

ALTER TABLE public.fipe_auditoria_modelo_versao_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_fipe_auditoria" ON public.fipe_auditoria_modelo_versao_runs;
CREATE POLICY "service_role_full_access_fipe_auditoria"
  ON public.fipe_auditoria_modelo_versao_runs FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_fipe_auditoria" ON public.fipe_auditoria_modelo_versao_runs;
CREATE POLICY "authenticated_select_fipe_auditoria"
  ON public.fipe_auditoria_modelo_versao_runs FOR SELECT TO authenticated USING (true);

-- Roda todo dia 15 as 12h UTC (~9h Brasilia). So avisa (WhatsApp, mesmo
-- padrao do daily-report-cron) -- nunca insere/altera excecao sozinha.
SELECT cron.schedule(
  'fipe-auditoria-modelo-versao-cron-job',
  '0 12 15 * *',
  $cron$
    SELECT net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/fipe-auditoria-modelo-versao',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), ''))
    );
  $cron$
);
