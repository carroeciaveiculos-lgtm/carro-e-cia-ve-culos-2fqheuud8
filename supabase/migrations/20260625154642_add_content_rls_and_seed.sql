DO $do$
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
      '{"name": "Admin Adriana"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, nivel)
    VALUES (new_user_id, 'adriana.araujo@kmzero.com.br', 'Adriana', 'admin', 'admin')
    ON CONFLICT (email) DO NOTHING;
  END IF;
END $do$;

-- Ensure RLS is enabled
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Add generic authenticated access policies
DROP POLICY IF EXISTS "allow_auth_all_pages" ON public.pages;
CREATE POLICY "allow_auth_all_pages" ON public.pages FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_all_articles" ON public.articles;
CREATE POLICY "allow_auth_all_articles" ON public.articles FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_all_blog_posts" ON public.blog_posts;
CREATE POLICY "allow_auth_all_blog_posts" ON public.blog_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_all_landing_pages" ON public.landing_pages;
CREATE POLICY "allow_auth_all_landing_pages" ON public.landing_pages FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_all_media_assets" ON public.media_assets;
CREATE POLICY "allow_auth_all_media_assets" ON public.media_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add public read policies for published contents
DROP POLICY IF EXISTS "allow_public_read_pages" ON public.pages;
CREATE POLICY "allow_public_read_pages" ON public.pages FOR SELECT USING (status_publicacao = 'Publicado');

DROP POLICY IF EXISTS "allow_public_read_articles" ON public.articles;
CREATE POLICY "allow_public_read_articles" ON public.articles FOR SELECT USING (status_publicacao = 'Publicado');

DROP POLICY IF EXISTS "allow_public_read_blog_posts" ON public.blog_posts;
CREATE POLICY "allow_public_read_blog_posts" ON public.blog_posts FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "allow_public_read_landing_pages" ON public.landing_pages;
CREATE POLICY "allow_public_read_landing_pages" ON public.landing_pages FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "allow_public_read_media_assets" ON public.media_assets;
CREATE POLICY "allow_public_read_media_assets" ON public.media_assets FOR SELECT USING (true);
