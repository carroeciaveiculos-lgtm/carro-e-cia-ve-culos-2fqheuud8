-- Indexes for ml_listings pending lookups
CREATE INDEX IF NOT EXISTS idx_ml_listings_status ON public.ml_listings(status);
CREATE INDEX IF NOT EXISTS idx_ml_listings_veiculo ON public.ml_listings(veiculo_id);

-- Ensure RLS on ml_listings for authenticated users
DROP POLICY IF EXISTS "auth_select_ml_listings_v3" ON public.ml_listings;
CREATE POLICY "auth_select_ml_listings_v3" ON public.ml_listings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_ml_listings_v3" ON public.ml_listings;
CREATE POLICY "auth_insert_ml_listings_v3" ON public.ml_listings
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_ml_listings_v3" ON public.ml_listings;
CREATE POLICY "auth_update_ml_listings_v3" ON public.ml_listings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Ensure RLS on veiculos for authenticated users
DROP POLICY IF EXISTS "auth_select_veiculos_ml_fix" ON public.veiculos;
CREATE POLICY "auth_select_veiculos_ml_fix" ON public.veiculos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_veiculos_ml_fix" ON public.veiculos;
CREATE POLICY "auth_insert_veiculos_ml_fix" ON public.veiculos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_veiculos_ml_fix" ON public.veiculos;
CREATE POLICY "auth_update_veiculos_ml_fix" ON public.veiculos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Ensure RLS on sync_log for authenticated users
DROP POLICY IF EXISTS "auth_all_sync_log_ml_fix" ON public.sync_log;
CREATE POLICY "auth_all_sync_log_ml_fix" ON public.sync_log
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to auto-retry stuck pending ml_listings (older than 10 minutes)
CREATE OR REPLACE FUNCTION public.auto_retry_stuck_ml_listings()
RETURNS void AS $$
BEGIN
  UPDATE public.ml_listings
  SET status = CASE
    WHEN ml_item_id IS NOT NULL THEN 'pending_update'
    ELSE 'pending_create'
  END,
  last_synced_at = now()
  WHERE status IN ('pending_create', 'pending_update')
    AND last_synced_at < now() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update ml-auth token refresh cron to every 5 hours (within 6h token expiry)
DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('ml-auth-token-refresh-cron-job');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

SELECT cron.schedule(
  'ml-auth-token-refresh-cron-job',
  '0 */5 * * *',
  $$
    SELECT net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/ml-auth',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{"action": "refresh_check"}'::jsonb
    );
  $$
);
