-- Ensure table and columns exist
CREATE TABLE IF NOT EXISTS public.social_configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_token TEXT,
  facebook_page_id TEXT,
  facebook_token TEXT,
  whatsapp_number TEXT,
  ai_system_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.social_configuracoes ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE public.social_configuracoes ADD COLUMN IF NOT EXISTS ai_system_prompt TEXT;

-- RLS
ALTER TABLE public.social_configuracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_soc_cfg" ON public.social_configuracoes;
CREATE POLICY "authenticated_select_soc_cfg" ON public.social_configuracoes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_soc_cfg" ON public.social_configuracoes;
CREATE POLICY "authenticated_insert_soc_cfg" ON public.social_configuracoes
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_soc_cfg" ON public.social_configuracoes;
CREATE POLICY "authenticated_update_soc_cfg" ON public.social_configuracoes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Seed Data & Auth User
DO $DO_BLOCK$
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

  -- Ensure at least one social config exists
  IF NOT EXISTS (SELECT 1 FROM public.social_configuracoes) THEN
    INSERT INTO public.social_configuracoes (whatsapp_number, ai_system_prompt)
    VALUES (
      '5534999999999', 
      'Você é um assistente de marketing experiente focado em venda de seminovos. Mantenha um tom profissional, porém amigável.'
    );
  END IF;
END $DO_BLOCK$;
