-- Create plataformas table
CREATE TABLE IF NOT EXISTS public.plataformas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  icone VARCHAR(50),
  cor VARCHAR(7),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create integracao_plataforma table
CREATE TABLE IF NOT EXISTS public.integracao_plataforma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plataforma_id UUID REFERENCES public.plataformas(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  loja_id UUID,
  status VARCHAR(20) DEFAULT 'desconectado',
  credentials JSONB DEFAULT '{}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  ultima_sincronizacao TIMESTAMPTZ,
  ultimo_erro TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create sync_log table
CREATE TABLE IF NOT EXISTS public.sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plataforma_id UUID REFERENCES public.plataformas(id) ON DELETE CASCADE NOT NULL,
  veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE CASCADE,
  item_id VARCHAR(50),
  acao VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL,
  mensagem TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create lead_errors table
CREATE TABLE IF NOT EXISTS public.lead_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_data JSONB NOT NULL,
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plataformas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integracao_plataforma ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_errors ENABLE ROW LEVEL SECURITY;

-- RLS policies for plataformas (public read, auth manage)
DROP POLICY IF EXISTS "public_read_plataformas" ON public.plataformas;
CREATE POLICY "public_read_plataformas" ON public.plataformas FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_manage_plataformas" ON public.plataformas;
CREATE POLICY "auth_manage_plataformas" ON public.plataformas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS policies for integracao_plataforma
DROP POLICY IF EXISTS "auth_all_integracao_plataforma" ON public.integracao_plataforma;
CREATE POLICY "auth_all_integracao_plataforma" ON public.integracao_plataforma FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS policies for sync_log
DROP POLICY IF EXISTS "auth_all_sync_log" ON public.sync_log;
CREATE POLICY "auth_all_sync_log" ON public.sync_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS policies for lead_errors
DROP POLICY IF EXISTS "auth_all_lead_errors" ON public.lead_errors;
CREATE POLICY "auth_all_lead_errors" ON public.lead_errors FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_insert_lead_errors" ON public.lead_errors;
CREATE POLICY "anon_insert_lead_errors" ON public.lead_errors FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sync_log_plataforma ON public.sync_log(plataforma_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_veiculo ON public.sync_log(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_created ON public.sync_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integracao_plataforma_usuario ON public.integracao_plataforma(usuario_id);
CREATE INDEX IF NOT EXISTS idx_lead_errors_timestamp ON public.lead_errors(timestamp DESC);

-- Seed plataformas
INSERT INTO public.plataformas (slug, nome, icone, cor, ativo) VALUES
  ('mercadolivre', 'Mercado Livre', 'shopping-cart', '#FFF059', true),
  ('webmotors', 'Webmotors', 'car', '#E6332A', true),
  ('olx', 'OLX', 'tag', '#6B0E8B', true),
  ('icarros', 'iCarros', 'car-front', '#0087CA', true),
  ('napista', 'NaPista', 'circle-dot', '#28A745', true)
ON CONFLICT (slug) DO NOTHING;

-- Seed user adriana.araujo@kmzero.com.br
DO $$
DECLARE
  seed_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br') THEN
    seed_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      seed_user_id,
      '00000000-0000-0000-0000-000000000000',
      'adriana.araujo@kmzero.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Adriana Araujo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
    INSERT INTO public.usuarios (id, nome, email, role, ativo, nivel, modulos)
    VALUES (seed_user_id, 'Adriana Araujo', 'adriana.araujo@kmzero.com.br', 'admin', true, 'admin', ARRAY['estoque','crm','avaliacao','design','financiamento','administrativo','portais','relatorios','configuracoes','logs','redes-sociais','conteudo','auditoria','marketing','ajuda','usuarios'])
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Retroactive sync queue: insert pending_create for existing visible vehicles
INSERT INTO public.ml_listings (veiculo_id, status, last_synced_at)
SELECT v.id, 'pending_create', now()
FROM public.veiculos v
WHERE v.status = 'disponivel'
  AND COALESCE(v.exibir_no_site, true) = true
  AND NOT EXISTS (
    SELECT 1 FROM public.ml_listings ml WHERE ml.veiculo_id = v.id
  )
ON CONFLICT DO NOTHING;

-- Also log retroactive queue entries in sync_log
INSERT INTO public.sync_log (plataforma_id, veiculo_id, acao, status, mensagem, metadata)
SELECT p.id, v.id, 'queue_retroactive', 'pending', 'Vehicle retroactively queued for sync', '{}'::jsonb
FROM public.veiculos v
CROSS JOIN public.plataformas p
WHERE p.slug = 'mercadolivre'
  AND v.status = 'disponivel'
  AND COALESCE(v.exibir_no_site, true) = true
ON CONFLICT DO NOTHING;
