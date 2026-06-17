DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'adriana.araujo@kmzero.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Adriana Araujo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, email, name, is_admin)
    VALUES (new_user_id, 'adriana.araujo@kmzero.com.br', 'Adriana Araujo', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.social_configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_token TEXT,
  facebook_page_id TEXT,
  facebook_token TEXT,
  whatsapp_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure RLS on social_configuracoes
ALTER TABLE public.social_configuracoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_select_soc_cfg" ON public.social_configuracoes;
CREATE POLICY "authenticated_select_soc_cfg" ON public.social_configuracoes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_insert_soc_cfg" ON public.social_configuracoes;
CREATE POLICY "authenticated_insert_soc_cfg" ON public.social_configuracoes FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_update_soc_cfg" ON public.social_configuracoes;
CREATE POLICY "authenticated_update_soc_cfg" ON public.social_configuracoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Ensure RLS on veiculos_cache
CREATE TABLE IF NOT EXISTS public.veiculos_cache (
  placa TEXT PRIMARY KEY,
  chassi TEXT,
  renavam TEXT,
  marca TEXT,
  modelo TEXT,
  ano_fab TEXT,
  ano_modelo TEXT,
  combustivel TEXT,
  combustivel_sintetico TEXT,
  cor TEXT,
  preco_fipe NUMERIC,
  mes_referencia TEXT,
  codigo_fipe TEXT,
  url_fipe TEXT,
  historico_fipe JSONB,
  categoria TEXT,
  categoria_sintetica TEXT,
  chassi_completo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.veiculos_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_select_cache" ON public.veiculos_cache;
CREATE POLICY "authenticated_select_cache" ON public.veiculos_cache FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_insert_cache" ON public.veiculos_cache;
CREATE POLICY "authenticated_insert_cache" ON public.veiculos_cache FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_update_cache" ON public.veiculos_cache;
CREATE POLICY "authenticated_update_cache" ON public.veiculos_cache FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Ensure RLS on media_assets
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_select_media" ON public.media_assets;
CREATE POLICY "authenticated_select_media" ON public.media_assets FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_insert_media" ON public.media_assets;
CREATE POLICY "authenticated_insert_media" ON public.media_assets FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_update_media" ON public.media_assets;
CREATE POLICY "authenticated_update_media" ON public.media_assets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_delete_media" ON public.media_assets;
CREATE POLICY "authenticated_delete_media" ON public.media_assets FOR DELETE TO authenticated USING (true);

-- Ensure RLS on social_posts
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_select_social" ON public.social_posts;
CREATE POLICY "authenticated_select_social" ON public.social_posts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_insert_social" ON public.social_posts;
CREATE POLICY "authenticated_insert_social" ON public.social_posts FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_update_social" ON public.social_posts;
CREATE POLICY "authenticated_update_social" ON public.social_posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_delete_social" ON public.social_posts;
CREATE POLICY "authenticated_delete_social" ON public.social_posts FOR DELETE TO authenticated USING (true);
