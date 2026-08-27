-- Fase 2 do plano de corte Modelo/Versao (MEMORY_WORK.MD, sessao 16/17).
-- Hoje a busca de veiculo por texto (Clara/ai-sdr, site/Estoque.tsx, admin/
-- Leads.tsx) so olha Modelo, nunca Versao -- um cliente que procura
-- "hibrido" ou "automatico" nao acha o carro se essa palavra estiver presa
-- dentro do texto de Versao. Coluna nova, mantida por trigger (nao
-- GENERATED ALWAYS AS -- unaccent() e' STABLE, nao IMMUTABLE, entao nao e'
-- aceito em coluna gerada), concatenando marca+modelo+versao+placa sem
-- acento e em minusculo, pra buscar os 4 campos de uma vez com um unico
-- ilike, sem se importar com onde a palavra esta nem com acentuacao.
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS busca_normalizada text;

CREATE OR REPLACE FUNCTION public.atualizar_busca_normalizada_veiculo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.busca_normalizada := lower(unaccent(
    coalesce(NEW.marca, '') || ' ' ||
    coalesce(NEW.modelo, '') || ' ' ||
    coalesce(NEW.versao, '') || ' ' ||
    coalesce(NEW.placa, '')
  ));
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_busca_normalizada_veiculo ON public.veiculos;
CREATE TRIGGER trigger_busca_normalizada_veiculo
  BEFORE INSERT OR UPDATE OF marca, modelo, versao, placa ON public.veiculos
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_busca_normalizada_veiculo();

-- Backfill dos veiculos existentes (mesma formula do trigger).
UPDATE public.veiculos SET busca_normalizada = lower(unaccent(
  coalesce(marca, '') || ' ' ||
  coalesce(modelo, '') || ' ' ||
  coalesce(versao, '') || ' ' ||
  coalesce(placa, '')
));

CREATE INDEX IF NOT EXISTS idx_veiculos_busca_normalizada_trgm
  ON public.veiculos USING gin (busca_normalizada gin_trgm_ops);
