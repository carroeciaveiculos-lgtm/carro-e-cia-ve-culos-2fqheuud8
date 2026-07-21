-- Reset Google Drive sync offset to 0 so all vehicles are re-processed
-- The updated edge function will skip vehicles that already have all media fields populated
-- but will re-sync vehicles missing video_url or qrcode_url

INSERT INTO public.sync_control (sync_key, current_offset, updated_at)
VALUES ('drive_offset', 0, NOW())
ON CONFLICT (sync_key) DO UPDATE SET current_offset = 0, updated_at = NOW();

-- Ensure logs_integracao has RLS policies for error logging from edge functions
ALTER TABLE public.logs_integracao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_logs_integracao" ON public.logs_integracao;
CREATE POLICY "auth_select_logs_integracao" ON public.logs_integracao
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_logs_integracao" ON public.logs_integracao;
CREATE POLICY "auth_insert_logs_integracao" ON public.logs_integracao
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_logs_integracao" ON public.logs_integracao;
CREATE POLICY "service_role_all_logs_integracao" ON public.logs_integracao
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add index for logs_integracao lookups by veiculo_id
CREATE INDEX IF NOT EXISTS idx_logs_integracao_veiculo_id
  ON public.logs_integracao(veiculo_id, created_at DESC);

-- Add index for logs_integracao lookups by portal
CREATE INDEX IF NOT EXISTS idx_logs_integracao_portal_status
  ON public.logs_integracao(portal, status, created_at DESC)
  WHERE status = 'error';
