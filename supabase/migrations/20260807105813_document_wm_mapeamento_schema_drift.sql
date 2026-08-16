-- Documenta no histórico de migrations o schema de wm_mapeamento_veiculos e as
-- funções de match que já existem em produção mas não tinham migration
-- rastreada (aplicadas direto no banco numa sessão anterior). Idempotente:
-- só fecha a divergência entre o banco real e o repositório, não muda
-- comportamento nem dados existentes.

ALTER TABLE public.wm_mapeamento_veiculos ADD COLUMN IF NOT EXISTS codigo_cor_wm TEXT;
ALTER TABLE public.wm_mapeamento_veiculos ADD COLUMN IF NOT EXISTS codigo_combustivel_wm TEXT;
ALTER TABLE public.wm_mapeamento_veiculos ADD COLUMN IF NOT EXISTS codigo_cambio_wm TEXT;
ALTER TABLE public.wm_mapeamento_veiculos ADD COLUMN IF NOT EXISTS codigo_modalidade_wm TEXT;
ALTER TABLE public.wm_mapeamento_veiculos ADD COLUMN IF NOT EXISTS confianca_marca NUMERIC;
ALTER TABLE public.wm_mapeamento_veiculos ADD COLUMN IF NOT EXISTS confianca_modelo NUMERIC;
ALTER TABLE public.wm_mapeamento_veiculos ADD COLUMN IF NOT EXISTS confianca_versao NUMERIC;
ALTER TABLE public.wm_mapeamento_veiculos ADD COLUMN IF NOT EXISTS candidatos_modelo JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.wm_mapeamento_veiculos ADD COLUMN IF NOT EXISTS candidatos_versao JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.wm_mapeamento_veiculos ADD COLUMN IF NOT EXISTS confirmado_manualmente BOOLEAN DEFAULT false;

-- Funções de fuzzy-match usadas por wm-mapear-veiculo (assume que public.wm_marcas
-- e public.wm_modelos, com colunas codigo_wm/nome_wm, já existem em produção).
CREATE OR REPLACE FUNCTION public.match_wm_marca(texto_busca text)
RETURNS TABLE(codigo_wm text, nome_wm text, score real)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    ma.codigo_wm,
    ma.nome_wm,
    word_similarity(unaccent(lower(ma.nome_wm)), unaccent(lower(texto_busca))) AS score
  FROM public.wm_marcas ma
  WHERE ma.nome_wm IS NOT NULL
  ORDER BY score DESC
  LIMIT 3;
$function$;

CREATE OR REPLACE FUNCTION public.match_wm_modelo(texto_busca text, p_codigo_marca_wm text)
RETURNS TABLE(codigo_wm text, nome_wm text, score real)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    mo.codigo_wm,
    mo.nome_wm,
    word_similarity(unaccent(lower(mo.nome_wm)), unaccent(lower(texto_busca))) AS score
  FROM public.wm_modelos mo
  WHERE mo.codigo_marca_wm = p_codigo_marca_wm
    AND mo.nome_wm IS NOT NULL
  ORDER BY score DESC
  LIMIT 3;
$function$;
