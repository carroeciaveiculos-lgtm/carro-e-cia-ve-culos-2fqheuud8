-- Anos de modelo válidos por versão na Webmotors (ObterVersao devolve <AnoModelo><AnoModeloWM><AnoModelo>2018</AnoModelo>...). 06/10/2026.
-- NULL = ano ainda desconhecido (linha antiga do cache): não bloqueia nem filtra. Preenchida pelo wm-mapear-veiculo e pela carga.
ALTER TABLE public.wm_versoes ADD COLUMN IF NOT EXISTS anos_modelo integer[];
COMMENT ON COLUMN public.wm_versoes.anos_modelo IS 'Anos de modelo aceitos pela Webmotors para esta versão (ObterVersao). NULL = desconhecido.';
