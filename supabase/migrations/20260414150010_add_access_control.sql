DO $$
BEGIN
  -- Adiciona as colunas de controle de acesso na tabela usuarios
  ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS modulos TEXT[] DEFAULT ARRAY['estoque']::TEXT[];
  ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMP;
  ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS nivel TEXT DEFAULT 'operador';
END $$;

CREATE TABLE IF NOT EXISTS public.access_log (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES public.usuarios(id),
  modulo TEXT,
  acao TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- RLS para access_log
ALTER TABLE public.access_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_access_log" ON public.access_log;
CREATE POLICY "allow_auth_all_access_log" ON public.access_log
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed usuarios e auth.users
DO $$
DECLARE
  new_user_id uuid;
  pwd text := crypt('Skip@Pass123!', gen_salt('bf'));
BEGIN
  -- Luiz
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lgacomerciodeveiculos@gmail.com') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone, phone_change, phone_change_token, reauthentication_token)
    VALUES (new_user_id, '00000000-0000-0000-0000-000000000000', 'lgacomerciodeveiculos@gmail.com', pwd, NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Luiz Fernando"}', false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', '');
    
    INSERT INTO public.usuarios (id, email, nome, role, nivel, modulos)
    VALUES (new_user_id, 'lgacomerciodeveiculos@gmail.com', 'Luiz Fernando', 'admin_master', 'admin_master', ARRAY['estoque', 'crm', 'portais', 'site', 'avaliacao', 'relatorios', 'marketing', 'configuracoes'])
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE public.usuarios SET nivel = 'admin_master', modulos = ARRAY['estoque', 'crm', 'portais', 'site', 'avaliacao', 'relatorios', 'marketing', 'configuracoes'] WHERE email = 'lgacomerciodeveiculos@gmail.com';
  END IF;

  -- Adriana
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone, phone_change, phone_change_token, reauthentication_token)
    VALUES (new_user_id, '00000000-0000-0000-0000-000000000000', 'adriana.araujo@kmzero.com.br', pwd, NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Adriana Araújo"}', false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', '');
    
    INSERT INTO public.usuarios (id, email, nome, role, nivel, modulos)
    VALUES (new_user_id, 'adriana.araujo@kmzero.com.br', 'Adriana Araújo', 'admin_master', 'admin_master', ARRAY['estoque', 'crm', 'portais', 'site', 'avaliacao', 'relatorios', 'marketing', 'configuracoes'])
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE public.usuarios SET nivel = 'admin_master', modulos = ARRAY['estoque', 'crm', 'portais', 'site', 'avaliacao', 'relatorios', 'marketing', 'configuracoes'] WHERE email = 'adriana.araujo@kmzero.com.br';
  END IF;

  -- Roberto
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'roberto@carroecia.com') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone, phone_change, phone_change_token, reauthentication_token)
    VALUES (new_user_id, '00000000-0000-0000-0000-000000000000', 'roberto@carroecia.com', pwd, NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Roberto Junior"}', false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', '');
    
    INSERT INTO public.usuarios (id, email, nome, role, nivel, modulos)
    VALUES (new_user_id, 'roberto@carroecia.com', 'Roberto Junior', 'gerente', 'gerente', ARRAY['estoque', 'crm', 'portais', 'avaliacao'])
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE public.usuarios SET nivel = 'gerente', modulos = ARRAY['estoque', 'crm', 'portais', 'avaliacao'] WHERE email = 'roberto@carroecia.com';
  END IF;

  -- Jessica
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'jessica@carroecia.com') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone, phone_change, phone_change_token, reauthentication_token)
    VALUES (new_user_id, '00000000-0000-0000-0000-000000000000', 'jessica@carroecia.com', pwd, NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Jessica Germano"}', false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', '');
    
    INSERT INTO public.usuarios (id, email, nome, role, nivel, modulos)
    VALUES (new_user_id, 'jessica@carroecia.com', 'Jessica Germano', 'operador', 'operador', ARRAY['estoque', 'site', 'relatorios', 'configuracoes'])
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE public.usuarios SET nivel = 'operador', modulos = ARRAY['estoque', 'site', 'relatorios', 'configuracoes'] WHERE email = 'jessica@carroecia.com';
  END IF;
END $$;
