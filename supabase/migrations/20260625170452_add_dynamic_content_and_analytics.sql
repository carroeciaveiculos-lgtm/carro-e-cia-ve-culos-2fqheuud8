DO $$
BEGIN
  -- Add visualizacoes and notas_internas to pages
  ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0;
  ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS notas_internas text;
  
  -- Add visualizacoes and notas_internas to articles
  ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0;
  ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS notas_internas text;
  
  -- Add visualizacoes and notas_internas to landing_pages
  ALTER TABLE public.landing_pages ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0;
  ALTER TABLE public.landing_pages ADD COLUMN IF NOT EXISTS notas_internas text;
END $$;

CREATE OR REPLACE FUNCTION public.increment_page_view(p_slug text)
RETURNS void AS $$
BEGIN
  UPDATE public.pages SET visualizacoes = COALESCE(visualizacoes, 0) + 1 WHERE slug = p_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed home page with dynamic blocks
INSERT INTO public.pages (id, titulo, slug, status_publicacao, conteudo, criado_em, atualizado_em)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Home',
  'home',
  'Publicado',
  '{"blocks":[{"type":"home-hero"},{"type":"home-info"},{"type":"home-features"},{"type":"home-social"},{"type":"home-faq"}]}',
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Seed LP Templates
INSERT INTO public.block_templates (id, nome, categoria, conteudo)
VALUES 
  (gen_random_uuid(), 'LP Oferta Relâmpago', 'Landing Page', '[{"id":"1","type":"hero","data":{"title":"Oferta Relâmpago","cta_text":"Aproveitar"}}]'::jsonb),
  (gen_random_uuid(), 'LP Captação de Leads', 'Landing Page', '[{"id":"2","type":"hero","data":{"title":"Baixe nosso Guia"}}, {"id":"3","type":"text","data":{"html":"Deixe seu contato"}}]'::jsonb),
  (gen_random_uuid(), 'LP Lançamento de Estoque', 'Landing Page', '[{"id":"4","type":"hero","data":{"title":"Lançamento Exclusivo"}}]'::jsonb)
ON CONFLICT DO NOTHING;

-- Seed Auth User for testing administrative features
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
      crypt('Skip@Pass123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Adriana Araujo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, nivel, ativo)
    VALUES (new_user_id, 'adriana.araujo@kmzero.com.br', 'Adriana Araujo', 'admin', 'admin', true)
    ON CONFLICT (email) DO NOTHING;
  END IF;
END $$;
