-- Supabase Migration: Add RLS for integration logs
-- User Story: As an administrator, I want to monitor Meta integration failures...
-- Ensure authenticated users can read the logs.

DO $$
BEGIN
  -- Re-enable RLS on meta_webhook_logs just in case
  ALTER TABLE public.meta_webhook_logs ENABLE ROW LEVEL SECURITY;

  -- Create SELECT policy for authenticated users on meta_webhook_logs
  DROP POLICY IF EXISTS "allow_auth_select_meta_webhook_logs" ON public.meta_webhook_logs;
  CREATE POLICY "allow_auth_select_meta_webhook_logs" ON public.meta_webhook_logs
    FOR SELECT TO authenticated USING (true);

  -- Ensure RLS is active on logs_integracao
  ALTER TABLE public.logs_integracao ENABLE ROW LEVEL SECURITY;

  -- Create SELECT policy for authenticated users on logs_integracao
  DROP POLICY IF EXISTS "allow_auth_select_logs_integracao" ON public.logs_integracao;
  CREATE POLICY "allow_auth_select_logs_integracao" ON public.logs_integracao
    FOR SELECT TO authenticated USING (true);
END $$;
