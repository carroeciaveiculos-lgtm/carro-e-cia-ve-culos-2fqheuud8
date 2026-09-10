-- Achado 10/09/2026: o painel "Veiculos por modalidade" (Portais) contava
-- NaPista/OLX lendo a flag `veiculos.publicado_napista`/`publicado_olx`
-- (sabidamente desatualizavel, ver docs/webmotors-integracao.md) em vez do
-- status real, e a coluna `ad_types.napista` nunca foi preenchida por
-- nenhum fluxo do sistema -- por isso 100% dos veiculos caiam no bucket
-- "Nao definida". Achado extra: `estoque_publicacoes` acumula uma linha
-- por evento de sync (sem dedup), entao qualquer contagem direta por
-- status sem pegar so a linha mais recente super-conta.
--
-- Esta function centraliza "quais veiculos estao publicados de verdade
-- numa plataforma agora" (so a linha mais recente por veiculo) para
-- reuso -- primeiro caso de uso: contador de modalidade em
-- src/services/platform-sync.ts.
CREATE OR REPLACE FUNCTION public.get_veiculos_publicados_plataforma(p_platform text)
RETURNS TABLE(veiculo_id uuid, tier text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT latest.veiculo_id, latest.tier
  FROM (
    SELECT DISTINCT ON (ep.veiculo_id)
      ep.veiculo_id,
      ep.status,
      v.ad_types ->> p_platform AS tier
    FROM public.estoque_publicacoes ep
    JOIN public.veiculos v ON v.id = ep.veiculo_id
    WHERE ep.platform = p_platform
    ORDER BY ep.veiculo_id, ep.updated_at DESC
  ) latest
  WHERE latest.status = 'publicado'
$$;

GRANT EXECUTE ON FUNCTION public.get_veiculos_publicados_plataforma(text) TO authenticated;
