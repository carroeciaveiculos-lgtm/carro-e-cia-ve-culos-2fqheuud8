-- Migration: 20260611151440_update_crm_rls_seed.sql

-- 1. Ensure RLS policies for `followups`, `interacoes`, `mensagens_template` allow authenticated users.
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_followups" ON public.followups;
CREATE POLICY "authenticated_all_followups" ON public.followups
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.interacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_interacoes" ON public.interacoes;
CREATE POLICY "authenticated_all_interacoes" ON public.interacoes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.mensagens_template ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_mensagens_template" ON public.mensagens_template;
CREATE POLICY "authenticated_all_mensagens_template" ON public.mensagens_template
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Seed User 'adriana.araujo@kmzero.com.br' and 'Roberto Junior'
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

    INSERT INTO public.usuarios (id, email, nome, role, ativo, nivel)
    VALUES (new_user_id, 'adriana.araujo@kmzero.com.br', 'Adriana Araujo', 'admin', true, 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Seed Roberto Junior se não existir (mencionado na user story)
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE nome = 'Roberto Junior') THEN
    INSERT INTO public.usuarios (id, email, nome, role, ativo, nivel)
    VALUES (gen_random_uuid(), 'roberto@carroecia.com.br', 'Roberto Junior', 'vendedor', true, 'vendedor')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
