DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed user
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
      NULL,
      '', '', ''
    );
    
    INSERT INTO public.usuarios (id, email, nome, role, nivel)
    VALUES (new_user_id, 'adriana.araujo@kmzero.com.br', 'Adriana Araujo', 'admin', 'gerente')
    ON CONFLICT (email) DO NOTHING;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.brain_ia_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL DEFAULT 'texto', -- 'texto', 'documento'
  titulo TEXT NOT NULL,
  conteudo TEXT,
  file_url TEXT,
  file_name TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP POLICY IF EXISTS "allow_auth_all_brain_ia" ON public.brain_ia_knowledge;
CREATE POLICY "allow_auth_all_brain_ia" ON public.brain_ia_knowledge
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.brain_ia_knowledge ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public) VALUES ('brain_docs', 'brain_docs', true) ON CONFLICT DO NOTHING;
DROP POLICY IF EXISTS "allow_auth_all_brain_docs" ON storage.objects;
CREATE POLICY "allow_auth_all_brain_docs" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'brain_docs');

