-- Completa a correcao anterior (ml_sync_trigger_inclui_campos_tecnicos):
-- Marca, Modelo e Ano Modelo entram no titulo do anuncio (formatVehicleTitle),
-- is_zero_km decide "Novo"/"Usado" (ITEM_CONDITION), fotos alimenta as
-- pictures do anuncio -- nenhum desses disparava reenvio ainda.
CREATE OR REPLACE FUNCTION public.trigger_ml_sync_on_veiculo_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  existing_ml_item_id text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.exibir_no_site = true THEN
      INSERT INTO public.ml_listings (veiculo_id, status)
      VALUES (NEW.id, 'pending_create');
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT ml_item_id INTO existing_ml_item_id FROM public.ml_listings WHERE veiculo_id = NEW.id LIMIT 1;

    IF (NEW.status IN ('vendido', 'devolvido') OR NEW.exibir_no_site = false) THEN
      IF existing_ml_item_id IS NULL THEN
        UPDATE public.ml_listings SET status = 'closed', last_synced_at = now() WHERE veiculo_id = NEW.id;
      ELSE
        UPDATE public.ml_listings SET status = 'pending_close' WHERE veiculo_id = NEW.id;
      END IF;
    ELSIF (OLD.preco_venda IS DISTINCT FROM NEW.preco_venda
        OR OLD.status IS DISTINCT FROM NEW.status
        OR OLD.exibir_no_site IS DISTINCT FROM NEW.exibir_no_site
        OR OLD.descricao IS DISTINCT FROM NEW.descricao
        OR OLD.quilometragem IS DISTINCT FROM NEW.quilometragem
        OR OLD.cor IS DISTINCT FROM NEW.cor
        OR OLD.combustivel IS DISTINCT FROM NEW.combustivel
        OR OLD.cambio IS DISTINCT FROM NEW.cambio
        OR OLD.portas IS DISTINCT FROM NEW.portas
        OR OLD.direcao IS DISTINCT FROM NEW.direcao
        OR OLD.cilindrada IS DISTINCT FROM NEW.cilindrada
        OR OLD.versao IS DISTINCT FROM NEW.versao
        OR OLD.categoria IS DISTINCT FROM NEW.categoria
        OR OLD.marca IS DISTINCT FROM NEW.marca
        OR OLD.modelo IS DISTINCT FROM NEW.modelo
        OR OLD.ano_modelo IS DISTINCT FROM NEW.ano_modelo
        OR OLD.is_zero_km IS DISTINCT FROM NEW.is_zero_km
        OR OLD.fotos IS DISTINCT FROM NEW.fotos) THEN
      UPDATE public.ml_listings SET status = 'pending_update' WHERE veiculo_id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_ml_sync_veiculos ON public.veiculos;
CREATE TRIGGER trigger_ml_sync_veiculos
  AFTER INSERT OR UPDATE OF preco_venda, status, exibir_no_site, descricao, quilometragem,
    cor, combustivel, cambio, portas, direcao, cilindrada, versao, categoria,
    marca, modelo, ano_modelo, is_zero_km, fotos
  ON public.veiculos
  FOR EACH ROW EXECUTE FUNCTION public.trigger_ml_sync_on_veiculo_change();
