DO $$
DECLARE
  v_user_id uuid;
  v_pwd text := extensions.crypt('Skip@Pass123!', extensions.gen_salt('bf'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      last_sign_in_at,
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
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'adriana.araujo@kmzero.com.br',
      v_pwd,
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Adriana Araujo"}',
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
      v_user_id,
      'adriana.araujo@kmzero.com.br',
      'Adriana Araujo',
      'admin',
      'admin_master',
      true,
      ARRAY['estoque', 'crm', 'portais', 'site', 'avaliacao', 'relatorios', 'marketing', 'configuracoes']
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      nome = EXCLUDED.nome,
      role = EXCLUDED.role,
      nivel = EXCLUDED.nivel,
      ativo = EXCLUDED.ativo,
      modulos = EXCLUDED.modulos;
  ELSE
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br';

    UPDATE auth.users
    SET
      encrypted_password = v_pwd,
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      last_sign_in_at = COALESCE(last_sign_in_at, NOW()),
      updated_at = NOW(),
      raw_app_meta_data = '{"provider": "email", "providers": ["email"]}',
      raw_user_meta_data = '{"full_name": "Adriana Araujo"}',
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
      email = 'adriana.araujo@kmzero.com.br',
      nome = 'Adriana Araujo',
      role = 'admin',
      nivel = 'admin_master',
      ativo = true,
      modulos = ARRAY['estoque', 'crm', 'portais', 'site', 'avaliacao', 'relatorios', 'marketing', 'configuracoes']
    WHERE id = v_user_id;

    IF NOT FOUND THEN
      INSERT INTO public.usuarios (id, email, nome, role, nivel, ativo, modulos)
      VALUES (
        v_user_id,
        'adriana.araujo@kmzero.com.br',
        'Adriana Araujo',
        'admin',
        'admin_master',
        true,
        ARRAY['estoque', 'crm', 'portais', 'site', 'avaliacao', 'relatorios', 'marketing', 'configuracoes']
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
END $$;
