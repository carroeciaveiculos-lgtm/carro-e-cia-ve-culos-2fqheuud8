-- Create notificacoes table
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at ON public.notificacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON public.notificacoes(usuario_id);

-- RLS policies
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_notificacoes" ON public.notificacoes;
CREATE POLICY "auth_select_notificacoes" ON public.notificacoes
  FOR SELECT TO authenticated USING (
    usuario_id IS NULL
    OR usuario_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "auth_insert_notificacoes" ON public.notificacoes;
CREATE POLICY "auth_insert_notificacoes" ON public.notificacoes
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_notificacoes" ON public.notificacoes;
CREATE POLICY "auth_update_notificacoes" ON public.notificacoes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_notificacoes" ON public.notificacoes;
CREATE POLICY "service_role_all_notificacoes" ON public.notificacoes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Ensure pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule weekly ad quality evaluation every Sunday at 08:00 BRT (11:00 UTC)
DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('avaliar-qualidade-anuncios-cron');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

SELECT cron.schedule(
  'avaliar-qualidade-anuncios-cron',
  '0 11 * * 0',
  $$
    SELECT net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/avaliar-qualidade-anuncios',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
