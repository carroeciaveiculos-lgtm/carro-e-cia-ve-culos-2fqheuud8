-- Fix the ML sync trigger to handle lowercase status values (vendido/devolvido)
-- The original trigger checked for 'Vendido' (capitalized) but actual values are lowercase

CREATE OR REPLACE FUNCTION public.trigger_ml_sync_on_veiculo_change()
RETURNS trigger AS $$
BEGIN
  -- Only sync if exibir_no_site changed, status changed, or preco_venda changed
  IF (TG_OP = 'INSERT' AND COALESCE(NEW.exibir_no_site, false) = true) THEN
    INSERT INTO public.ml_listings (veiculo_id, status, last_synced_at)
    VALUES (NEW.id, 'pending_create', now())
    ON CONFLICT DO NOTHING;
  ELSIF (TG_OP = 'UPDATE' AND (
    COALESCE(OLD.preco_venda, 0) <> COALESCE(NEW.preco_venda, 0) OR
    COALESCE(OLD.status, '') <> COALESCE(NEW.status, '') OR
    COALESCE(OLD.exibir_no_site, false) <> COALESCE(NEW.exibir_no_site, false)
  )) THEN
    -- Close ML listing when vehicle is sold, devolvido, or hidden from site
    IF (NEW.status IN ('vendido', 'devolvido') OR COALESCE(NEW.exibir_no_site, false) = false) THEN
      UPDATE public.ml_listings SET status = 'pending_close', last_synced_at = now()
      WHERE veiculo_id = NEW.id AND status NOT IN ('closed', 'pending_close');
    ELSE
      UPDATE public.ml_listings SET status = 'pending_update', last_synced_at = now()
      WHERE veiculo_id = NEW.id AND status NOT IN ('pending_create', 'pending_update');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_ml_sync_veiculos ON public.veiculos;
CREATE TRIGGER trigger_ml_sync_veiculos
  AFTER INSERT OR UPDATE OF preco_venda, status, exibir_no_site
  ON public.veiculos
  FOR EACH ROW EXECUTE FUNCTION public.trigger_ml_sync_on_veiculo_change();

-- Also close existing ML listings for vehicles already in vendido/devolvido status
UPDATE public.ml_listings
SET status = 'pending_close', last_synced_at = now()
WHERE veiculo_id IN (
  SELECT id FROM public.veiculos WHERE status IN ('vendido', 'devolvido')
)
AND status NOT IN ('closed', 'pending_close');
