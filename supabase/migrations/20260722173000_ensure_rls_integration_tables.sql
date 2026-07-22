-- Ensure RLS policies on all integration-related tables
-- These tables are used by edge functions (service_role) and admin UI (authenticated)

-- ml_listings: ensure authenticated can read and manage
ALTER TABLE public.ml_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_ml_listings_final" ON public.ml_listings;
CREATE POLICY "auth_select_ml_listings_final" ON public.ml_listings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_ml_listings_final" ON public.ml_listings;
CREATE POLICY "auth_insert_ml_listings_final" ON public.ml_listings
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_ml_listings_final" ON public.ml_listings;
CREATE POLICY "auth_update_ml_listings_final" ON public.ml_listings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_ml_listings_final" ON public.ml_listings;
CREATE POLICY "auth_delete_ml_listings_final" ON public.ml_listings
  FOR DELETE TO authenticated USING (true);

-- ml_credentials: ensure authenticated can read and manage
ALTER TABLE public.ml_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_ml_credentials_final" ON public.ml_credentials;
CREATE POLICY "auth_select_ml_credentials_final" ON public.ml_credentials
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_ml_credentials_final" ON public.ml_credentials;
CREATE POLICY "auth_insert_ml_credentials_final" ON public.ml_credentials
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_ml_credentials_final" ON public.ml_credentials;
CREATE POLICY "auth_update_ml_credentials_final" ON public.ml_credentials
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- sync_control: ensure authenticated can read and update
ALTER TABLE public.sync_control ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_sync_control" ON public.sync_control;
CREATE POLICY "auth_select_sync_control" ON public.sync_control
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_sync_control" ON public.sync_control;
CREATE POLICY "auth_update_sync_control" ON public.sync_control
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_insert_sync_control" ON public.sync_control;
CREATE POLICY "auth_insert_sync_control" ON public.sync_control
  FOR INSERT TO authenticated WITH CHECK (true);

-- logs_integracao: ensure full CRUD for authenticated
ALTER TABLE public.logs_integracao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_logs_integracao_final" ON public.logs_integracao;
CREATE POLICY "auth_select_logs_integracao_final" ON public.logs_integracao
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_logs_integracao_final" ON public.logs_integracao;
CREATE POLICY "auth_insert_logs_integracao_final" ON public.logs_integracao
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_logs_integracao_final" ON public.logs_integracao;
CREATE POLICY "auth_update_logs_integracao_final" ON public.logs_integracao
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_logs_integracao_final" ON public.logs_integracao;
CREATE POLICY "auth_delete_logs_integracao_final" ON public.logs_integracao
  FOR DELETE TO authenticated USING (true);

-- service_role full access on all integration tables (for edge functions)
DROP POLICY IF EXISTS "service_role_all_ml_listings_final" ON public.ml_listings;
CREATE POLICY "service_role_all_ml_listings_final" ON public.ml_listings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_ml_credentials_final" ON public.ml_credentials;
CREATE POLICY "service_role_all_ml_credentials_final" ON public.ml_credentials
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_sync_control" ON public.sync_control;
CREATE POLICY "service_role_all_sync_control" ON public.sync_control
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_logs_integracao_final" ON public.logs_integracao;
CREATE POLICY "service_role_all_logs_integracao_final" ON public.logs_integracao
  FOR ALL TO service_role USING (true) WITH CHECK (true);
