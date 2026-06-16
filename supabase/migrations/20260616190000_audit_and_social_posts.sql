DO $$
BEGIN
  -- 1. Create access_log
  CREATE TABLE IF NOT EXISTS public.access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID,
    modulo TEXT,
    acao TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
  );

  -- 2. Create logs_ia
  CREATE TABLE IF NOT EXISTS public.logs_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acao TEXT,
    tokens_input INT,
    tokens_output INT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- 3. Create logs_integracao
  CREATE TABLE IF NOT EXISTS public.logs_integracao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portal TEXT,
    status TEXT,
    mensagem TEXT,
    veiculo_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- 4. Create or Update social_posts
  CREATE TABLE IF NOT EXISTS public.social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    redes JSONB NOT NULL DEFAULT '{}'::jsonb,
    texto TEXT,
    imagem TEXT,
    data_agendamento TIMESTAMPTZ,
    status VARCHAR DEFAULT 'Agendado',
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    veiculo_id UUID
  );

  -- Force redes column to JSONB if it was created as array previously
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'redes' AND data_type = 'ARRAY') THEN
    ALTER TABLE public.social_posts DROP COLUMN redes;
    ALTER TABLE public.social_posts ADD COLUMN redes JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- Catch any potential errors from existing structure conflicts safely
END $$;

-- Setup Policies (Drop then Create for idempotency)
DROP POLICY IF EXISTS "authenticated_select_access_log" ON public.access_log;
CREATE POLICY "authenticated_select_access_log" ON public.access_log FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_access_log" ON public.access_log;
CREATE POLICY "authenticated_insert_access_log" ON public.access_log FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_logs_ia" ON public.logs_ia;
CREATE POLICY "authenticated_select_logs_ia" ON public.logs_ia FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_logs_ia" ON public.logs_ia;
CREATE POLICY "authenticated_insert_logs_ia" ON public.logs_ia FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_logs_integracao" ON public.logs_integracao;
CREATE POLICY "authenticated_select_logs_integracao" ON public.logs_integracao FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_logs_integracao" ON public.logs_integracao;
CREATE POLICY "authenticated_insert_logs_integracao" ON public.logs_integracao FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_social" ON public.social_posts;
CREATE POLICY "authenticated_select_social" ON public.social_posts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_social" ON public.social_posts;
CREATE POLICY "authenticated_insert_social" ON public.social_posts FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_social" ON public.social_posts;
CREATE POLICY "authenticated_update_social" ON public.social_posts FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_delete_social" ON public.social_posts;
CREATE POLICY "authenticated_delete_social" ON public.social_posts FOR DELETE TO authenticated USING (true);

-- Enable RLS
ALTER TABLE public.access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_integracao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- Insert Mock Data for Demo
INSERT INTO public.logs_ia (acao, tokens_input, tokens_output, status) VALUES
('Geração de Kit Social Media', 150, 240, 'success'),
('Geração de Kit Social Media', 130, 210, 'success'),
('Geração de Descrição', 50, 0, 'error')
ON CONFLICT DO NOTHING;

INSERT INTO public.logs_integracao (portal, status, mensagem) VALUES
('Webmotors', 'success', 'Veículo sincronizado com sucesso'),
('OLX', 'error', 'Falha de autenticação no portal')
ON CONFLICT DO NOTHING;

-- Grant permissions to initial admin user
DO $$
BEGIN
  UPDATE public.usuarios
  SET modulos = array_append(array_append(array_remove(array_remove(modulos, 'auditoria'), 'social'), 'auditoria'), 'social')
  WHERE email = 'adriana.araujo@kmzero.com.br';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
