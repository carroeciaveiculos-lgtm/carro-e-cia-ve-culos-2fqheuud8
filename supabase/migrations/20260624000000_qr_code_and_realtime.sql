-- Add qrcode_url column to veiculos
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS qrcode_url TEXT;

-- Enable realtime for leads table safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'leads'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE leads';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to add leads to supabase_realtime publication: %', SQLERRM;
END $$;

-- Create meta_tester test user
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'meta_tester@carroeciamotors.com.br') THEN
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
      'meta_tester@carroeciamotors.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Meta Tester"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, ativo, nivel, modulos)
    VALUES (new_user_id, 'meta_tester@carroeciamotors.com.br', 'Meta Tester', 'vendedor', true, 'operador', ARRAY['estoque', 'crm', 'relatorios'])
    ON CONFLICT (email) DO NOTHING;
  END IF;
END $$;
