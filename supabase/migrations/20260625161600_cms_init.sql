DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed admin user (idempotent: skip if email already exists)
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
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, modulos, nivel)
    VALUES (
      new_user_id, 
      'adriana.araujo@kmzero.com.br', 
      'Adriana Araujo', 
      'admin', 
      ARRAY['estoque','crm','avaliacao','site','financiamento','administrativo','marketing','configuracoes'], 
      'admin'
    )
    ON CONFLICT (email) DO UPDATE SET modulos = ARRAY['estoque','crm','avaliacao','site','financiamento','administrativo','marketing','configuracoes'];
  END IF;
END $$;

-- Add RLS Policies for pages, articles, and landing_pages to ensure authenticated access
DROP POLICY IF EXISTS "allow_auth_all_pages" ON public.pages;
CREATE POLICY "allow_auth_all_pages" ON public.pages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_all_articles" ON public.articles;
CREATE POLICY "allow_auth_all_articles" ON public.articles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_all_landing_pages" ON public.landing_pages;
CREATE POLICY "allow_auth_all_landing_pages" ON public.landing_pages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed basic structural pages if they don't exist
INSERT INTO public.pages (slug, titulo, status_publicacao, conteudo)
VALUES 
  ('home', 'Página Inicial (Home)', 'Publicado', '{"blocks":[],"designVars":{}}'),
  ('sobre', 'Sobre Nós', 'Publicado', '{"blocks":[],"designVars":{}}'),
  ('contato', 'Contato', 'Publicado', '{"blocks":[],"designVars":{}}'),
  ('estoque', 'Estoque de Veículos', 'Publicado', '{"blocks":[],"designVars":{}}'),
  ('servicos', 'Nossos Serviços', 'Publicado', '{"blocks":[],"designVars":{}}')
ON CONFLICT (slug) DO NOTHING;
