DO $$
DECLARE
  v_user_id uuid;
  v_pwd text := crypt('Skip@Pass', gen_salt('bf'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'adriana.araujo@kmzero.com.br',
      v_pwd,
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Adriana Araujo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, nivel, ativo, modulos)
    VALUES (
      v_user_id,
      'adriana.araujo@kmzero.com.br',
      'Adriana Araujo',
      'admin', 'admin_master', true,
      ARRAY['estoque', 'crm', 'portais', 'site', 'avaliacao', 'relatorios', 'marketing', 'configuracoes']
    )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = v_pwd,
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW(),
      confirmation_token = '',
      recovery_token = '',
      email_change_token_new = '',
      email_change = '',
      email_change_token_current = '',
      phone_change = '',
      phone_change_token = '',
      reauthentication_token = '',
      phone = NULL
    WHERE email = 'adriana.araujo@kmzero.com.br';

    UPDATE public.usuarios
    SET
      role = 'admin',
      nivel = 'admin_master',
      ativo = true,
      modulos = ARRAY['estoque', 'crm', 'portais', 'site', 'avaliacao', 'relatorios', 'marketing', 'configuracoes']
    WHERE email = 'adriana.araujo@kmzero.com.br';
  END IF;
END $$;
