CREATE TABLE IF NOT EXISTS public.ads_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plataforma TEXT NOT NULL,
  acao TEXT NOT NULL,
  campanha_id TEXT,
  detalhes JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'sucesso',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ads_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_auth_all_ads_audit_logs" ON public.ads_audit_logs;
CREATE POLICY "allow_auth_all_ads_audit_logs" ON public.ads_audit_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS slug TEXT;
