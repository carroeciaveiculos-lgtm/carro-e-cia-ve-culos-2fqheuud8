-- Ensure sync_log has RLS policies for authenticated users
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_sync_log_v4" ON public.sync_log;
CREATE POLICY "auth_select_sync_log_v4" ON public.sync_log
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_sync_log_v4" ON public.sync_log;
CREATE POLICY "auth_insert_sync_log_v4" ON public.sync_log
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_sync_log_v4" ON public.sync_log;
CREATE POLICY "auth_update_sync_log_v4" ON public.sync_log
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Ensure estoque_publicacoes has RLS policies for authenticated users
ALTER TABLE public.estoque_publicacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_estoque_pub_v4" ON public.estoque_publicacoes;
CREATE POLICY "auth_select_estoque_pub_v4" ON public.estoque_publicacoes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_estoque_pub_v4" ON public.estoque_publicacoes;
CREATE POLICY "auth_insert_estoque_pub_v4" ON public.estoque_publicacoes
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_estoque_pub_v4" ON public.estoque_publicacoes;
CREATE POLICY "auth_update_estoque_pub_v4" ON public.estoque_publicacoes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_estoque_pub_v4" ON public.estoque_publicacoes;
CREATE POLICY "auth_delete_estoque_pub_v4" ON public.estoque_publicacoes
  FOR DELETE TO authenticated USING (true);

-- Add composite index for review panel queries
CREATE INDEX IF NOT EXISTS idx_sync_log_veiculo_status
  ON public.sync_log(veiculo_id, status, created_at DESC);

-- Add index for estoque_publicacoes error lookups
CREATE INDEX IF NOT EXISTS idx_estoque_pub_erro_status
  ON public.estoque_publicacoes(veiculo_id, status)
  WHERE erro_msg IS NOT NULL AND erro_msg != '';
