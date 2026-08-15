-- Mapeamento veiculos.* -> códigos do NaPista, um registro por veículo.
-- Espelha wm_mapeamento_veiculos (ver docs/webmotors-integracao.md e
-- docs/integracao-napista.md) — mesmo fluxo de confiança/revisão manual.
CREATE TABLE IF NOT EXISTS public.napista_mapeamento_veiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid NOT NULL UNIQUE REFERENCES public.veiculos(id) ON DELETE CASCADE,
  napista_marca_id text,
  napista_modelo_id text,
  napista_version_id text,
  napista_offer_id text,
  codigo_cor text,
  codigo_cambio text,
  codigo_combustivel text,
  confianca_marca numeric,
  confianca_modelo numeric,
  confianca_versao numeric,
  candidatos_modelo jsonb,
  candidatos_versao jsonb,
  confirmado_manualmente boolean DEFAULT false,
  status_sincronizacao text DEFAULT 'pendente',
  erro_msg text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.napista_mapeamento_veiculos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_napista_mapeamento" ON public.napista_mapeamento_veiculos;
CREATE POLICY "service_role_full_access_napista_mapeamento"
  ON public.napista_mapeamento_veiculos FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_auth_all_napista_mapeamento" ON public.napista_mapeamento_veiculos;
CREATE POLICY "allow_auth_all_napista_mapeamento"
  ON public.napista_mapeamento_veiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_napista_mapeamento_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_napista_mapeamento_updated_at ON public.napista_mapeamento_veiculos;
CREATE TRIGGER trigger_update_napista_mapeamento_updated_at
  BEFORE UPDATE ON public.napista_mapeamento_veiculos
  FOR EACH ROW EXECUTE FUNCTION public.update_napista_mapeamento_updated_at();

-- Trigram fuzzy-match, mesmo padrão de match_wm_marca/match_wm_modelo
-- (mesmas extensões pg_trgm/unaccent já habilitadas no projeto).
CREATE OR REPLACE FUNCTION public.match_napista_marca(texto_busca text)
RETURNS TABLE(id text, nome text, score real)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    ma.id,
    ma.nome,
    word_similarity(unaccent(lower(ma.nome)), unaccent(lower(texto_busca))) AS score
  FROM public.napista_marcas ma
  WHERE ma.nome IS NOT NULL
  ORDER BY score DESC
  LIMIT 3;
$function$;

CREATE OR REPLACE FUNCTION public.match_napista_modelo(texto_busca text, p_marca_id text)
RETURNS TABLE(id text, nome text, score real)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    mo.id,
    mo.nome,
    word_similarity(unaccent(lower(mo.nome)), unaccent(lower(texto_busca))) AS score
  FROM public.napista_modelos mo
  WHERE mo.marca_id = p_marca_id
    AND mo.nome IS NOT NULL
  ORDER BY score DESC
  LIMIT 3;
$function$;
