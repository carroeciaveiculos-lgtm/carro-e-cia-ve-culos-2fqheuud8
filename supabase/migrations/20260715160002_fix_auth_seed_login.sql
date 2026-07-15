-- Fix "Invalid login credentials" by ensuring the admin user exists with correct credentials
-- This migration is idempotent and safe to run multiple times.

DO $$
DECLARE
  new_user_id uuid;
  pwd text := crypt('securepassword123', gen_salt('bf'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      email_change_token_current,
      phone,
      phone_change,
      phone_change_token,
      reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'adriana.araujo@kmzero.com.br',
      pwd,
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Adriana Araujo"}',
      false,
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      '',
      '',
      NULL,
      '',
      '',
      ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, nivel, ativo, modulos)
    VALUES (
      new_user_id,
      'adriana.araujo@kmzero.com.br',
      'Adriana Araujo',
      'admin_master',
      'admin_master',
      true,
      ARRAY['estoque', 'crm', 'portais', 'site', 'avaliacao', 'relatorios', 'marketing', 'configuracoes']
    )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- User exists: ensure the password and confirmed email are aligned
    UPDATE auth.users
    SET
      encrypted_password = pwd,
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmation_token = '',
      recovery_token = '',
      email_change_token_new = '',
      email_change = '',
      email_change_token_current = '',
      phone_change = '',
      phone_change_token = '',
      reauthentication_token = ''
    WHERE email = 'adriana.araujo@kmzero.com.br';

    -- Ensure the usuarios record is also up to date
    UPDATE public.usuarios
    SET
      role = 'admin_master',
      nivel = 'admin_master',
      ativo = true,
      modulos = ARRAY['estoque', 'crm', 'portais', 'site', 'avaliacao', 'relatorios', 'marketing', 'configuracoes']
    WHERE email = 'adriana.araujo@kmzero.com.br';
  END IF;
END $$;
