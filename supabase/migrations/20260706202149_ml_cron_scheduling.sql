-- Ensure required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Ensure logs_integracao has payload_erro column for structured logging
ALTER TABLE public.logs_integracao ADD COLUMN IF NOT EXISTS payload_erro JSONB;

-- ===========================================================================
-- STANDARDIZATION POLICY FOR EXTERNAL INTEGRATIONS:
-- Every new external platform integration (Webmotors, Icarros, OLX, etc.)
-- MUST include a corresponding pg_cron entry in its deployment migration
-- for background syncing. Follow this pattern:
--   1. Unscheduled existing job name (idempotent via DO block)
--   2. Schedule with cron.schedule() using pg_net http_post
--   3. Edge functions must log results to logs_integracao table
--   4. Token refresh cron jobs should run at intervals shorter than token TTL
-- ===========================================================================

-- Schedule ml-sync Edge Function every 30 minutes
-- Synchronizes Mercado Livre listings with CRM inventory changes
DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('ml-sync-cron-job');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

SELECT cron.schedule(
  'ml-sync-cron-job',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/ml-sync',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);

-- Schedule ml-auth token refresh check every 1 hour
-- Proactively refreshes OAuth credentials before they expire
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
  '0 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/ml-auth',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{"action": "refresh_check"}'::jsonb
    );
  $$
);
