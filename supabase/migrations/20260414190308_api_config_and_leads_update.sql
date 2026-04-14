CREATE TABLE IF NOT EXISTS configuracoes_api (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal TEXT NOT NULL UNIQUE,
  api_key TEXT,
  auth_token TEXT,
  ativo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs_integracao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID,
  portal TEXT NOT NULL,
  payload_erro JSONB,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS carro_modelo TEXT,
ADD COLUMN IF NOT EXISTS carro_ano TEXT,
ADD COLUMN IF NOT EXISTS carro_placa TEXT;

-- RLS configuracoes_api
ALTER TABLE public.configuracoes_api ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_configuracoes_api" ON public.configuracoes_api;
CREATE POLICY "allow_auth_all_configuracoes_api" ON public.configuracoes_api
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS logs_integracao
ALTER TABLE public.logs_integracao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_logs_integracao" ON public.logs_integracao;
CREATE POLICY "allow_auth_all_logs_integracao" ON public.logs_integracao
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default portais
INSERT INTO public.configuracoes_api (portal, ativo) VALUES
  ('Webmotors', false),
  ('iCarros', false),
  ('OLX', false),
  ('Mercado Livre', false)
ON CONFLICT (portal) DO NOTHING;
