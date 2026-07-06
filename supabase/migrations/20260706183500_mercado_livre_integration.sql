-- Create ml_credentials table for Mercado Livre OAuth tokens
CREATE TABLE IF NOT EXISTS public.ml_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on ml_credentials
ALTER TABLE public.ml_credentials ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access
DROP POLICY IF EXISTS "service_role_full_access_ml_credentials" ON public.ml_credentials;
CREATE POLICY "service_role_full_access_ml_credentials"
  ON public.ml_credentials FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Allow authenticated (admin) to manage
DROP POLICY IF EXISTS "allow_auth_all_ml_credentials" ON public.ml_credentials;
CREATE POLICY "allow_auth_all_ml_credentials"
  ON public.ml_credentials FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Create a table to track ML listing IDs per vehicle
CREATE TABLE IF NOT EXISTS public.ml_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid REFERENCES public.veiculos(id) ON DELETE CASCADE,
  ml_item_id text,
  ml_listing_url text,
  status text DEFAULT 'active',
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on ml_listings
ALTER TABLE public.ml_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_ml_listings" ON public.ml_listings;
CREATE POLICY "service_role_full_access_ml_listings"
  ON public.ml_listings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_all_ml_listings" ON public.ml_listings;
CREATE POLICY "allow_auth_all_ml_listings"
  ON public.ml_listings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Update updated_at on ml_credentials
CREATE OR REPLACE FUNCTION public.update_ml_credentials_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ml_credentials_updated_at ON public.ml_credentials;
CREATE TRIGGER trigger_update_ml_credentials_updated_at
  BEFORE UPDATE ON public.ml_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_ml_credentials_updated_at();

-- Trigger to detect changes in veiculos for ML sync
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
    IF (NEW.status = 'Vendido' OR COALESCE(NEW.exibir_no_site, false) = false) THEN
      UPDATE public.ml_listings SET status = 'pending_close', last_synced_at = now()
      WHERE veiculo_id = NEW.id;
    ELSE
      UPDATE public.ml_listings SET status = 'pending_update', last_synced_at = now()
      WHERE veiculo_id = NEW.id;
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

-- Schedule daily report cron job at 08:00 UTC-3 (11:00 UTC)
DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('daily-report-cron-job');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

SELECT cron.schedule(
  'daily-report-cron-job',
  '0 11 * * *',
  $$
    SELECT net.http_post(
      url:='https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/daily-report-cron'
    );
  $$
);
