-- FIPE do estoque, Fase 1 (09/10/2026): guarda o valor FIPE de cada veiculo disponivel, mes a mes.
-- NAO altera `veiculos` (valor_fipe/fipe_ref ficam como estao): Mercado Livre e Webmotors leem
-- esses campos e os gatilhos de reenvio podem disparar. A copia para `veiculos` e a Fase 2.
-- Detalhes em docs/tabela-fipe.md.

CREATE TABLE IF NOT EXISTS public.fipe_valores_veiculo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
  referencia_codigo text NOT NULL,
  referencia_mes text NOT NULL,
  valor numeric(12,2),
  codigo_fipe text NOT NULL,
  ano_modelo integer,
  ano_codigo text,
  combustivel text,
  modelo_fipe text,
  situacao text NOT NULL DEFAULT 'ok' CHECK (situacao IN ('ok', 'revisar')),
  motivo text,
  consultado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (veiculo_id, referencia_codigo)
);

CREATE INDEX IF NOT EXISTS idx_fipe_valores_veiculo_ref
  ON public.fipe_valores_veiculo (referencia_codigo, situacao);

ALTER TABLE public.fipe_valores_veiculo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_fipe_valores_veiculo" ON public.fipe_valores_veiculo;
CREATE POLICY "service_role_full_access_fipe_valores_veiculo"
  ON public.fipe_valores_veiculo FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_fipe_valores_veiculo" ON public.fipe_valores_veiculo;
CREATE POLICY "authenticated_select_fipe_valores_veiculo"
  ON public.fipe_valores_veiculo FOR SELECT TO authenticated USING (true);

-- Um registro por execucao que de fato fez algo (dia sem novidade nao grava nada).
CREATE TABLE IF NOT EXISTS public.fipe_estoque_execucoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executado_em timestamptz NOT NULL DEFAULT now(),
  referencia_codigo text,
  referencia_mes text,
  status text NOT NULL CHECK (status IN ('concluida', 'parcial', 'erro')),
  veiculos_processados integer NOT NULL DEFAULT 0,
  veiculos_ok integer NOT NULL DEFAULT 0,
  veiculos_revisar integer NOT NULL DEFAULT 0,
  chamadas_api integer NOT NULL DEFAULT 0,
  token_invalido boolean NOT NULL DEFAULT false,
  alerta_enviado boolean NOT NULL DEFAULT false,
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  erro text
);

ALTER TABLE public.fipe_estoque_execucoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_fipe_estoque_execucoes" ON public.fipe_estoque_execucoes;
CREATE POLICY "service_role_full_access_fipe_estoque_execucoes"
  ON public.fipe_estoque_execucoes FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_fipe_estoque_execucoes" ON public.fipe_estoque_execucoes;
CREATE POLICY "authenticated_select_fipe_estoque_execucoes"
  ON public.fipe_estoque_execucoes FOR SELECT TO authenticated USING (true);

-- Todo dia 10:00 UTC (07:00 Brasilia). Dia sem mes novo e sem veiculo novo = 1 chamada a /references e fim.
SELECT cron.schedule(
  'fipe-atualizar-estoque-cron-job',
  '0 10 * * *',
  $cron$
    SELECT net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/fipe-atualizar-estoque',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), '')),
      timeout_milliseconds := 150000
    );
  $cron$
);
