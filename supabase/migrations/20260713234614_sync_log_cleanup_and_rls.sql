-- Clear stuck pending sync_log records to terminal state
UPDATE public.sync_log
SET status = 'erro',
    mensagem = COALESCE(mensagem, '') || ' [Auto-cleared: was stuck in pending state]',
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('auto_cleared_at', now()::text, 'original_status', 'pending')
WHERE status = 'pending';

-- Enable RLS on estoque_publicacoes if not already enabled
ALTER TABLE public.estoque_publicacoes ENABLE ROW LEVEL SECURITY;

-- RLS policies for estoque_publicacoes (authenticated SELECT and UPDATE)
DROP POLICY IF EXISTS "auth_select_estoque_publicacoes" ON public.estoque_publicacoes;
CREATE POLICY "auth_select_estoque_publicacoes" ON public.estoque_publicacoes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_estoque_publicacoes" ON public.estoque_publicacoes;
CREATE POLICY "auth_insert_estoque_publicacoes" ON public.estoque_publicacoes
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_estoque_publicacoes" ON public.estoque_publicacoes;
CREATE POLICY "auth_update_estoque_publicacoes" ON public.estoque_publicacoes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_estoque_publicacoes" ON public.estoque_publicacoes;
CREATE POLICY "auth_delete_estoque_publicacoes" ON public.estoque_publicacoes
  FOR DELETE TO authenticated USING (true);

-- Ensure sync_log has explicit SELECT and UPDATE policies for authenticated users
DROP POLICY IF EXISTS "auth_select_sync_log_v2" ON public.sync_log;
CREATE POLICY "auth_select_sync_log_v2" ON public.sync_log
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_sync_log_v2" ON public.sync_log;
CREATE POLICY "auth_update_sync_log_v2" ON public.sync_log
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Ensure sync_log INSERT policy exists for authenticated
DROP POLICY IF EXISTS "auth_insert_sync_log_v2" ON public.sync_log;
CREATE POLICY "auth_insert_sync_log_v2" ON public.sync_log
  FOR INSERT TO authenticated WITH CHECK (true);
