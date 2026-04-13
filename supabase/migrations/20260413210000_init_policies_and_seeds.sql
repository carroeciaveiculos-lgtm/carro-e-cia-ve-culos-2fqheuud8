-- Enable RLS and setup policies

-- Veiculos
DROP POLICY IF EXISTS "allow_anon_select_veiculos" ON public.veiculos;
CREATE POLICY "allow_anon_select_veiculos" ON public.veiculos FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_auth_all_veiculos" ON public.veiculos;
CREATE POLICY "allow_auth_all_veiculos" ON public.veiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Leads
DROP POLICY IF EXISTS "allow_anon_insert_leads" ON public.leads;
CREATE POLICY "allow_anon_insert_leads" ON public.leads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_all_leads" ON public.leads;
CREATE POLICY "allow_auth_all_leads" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Consignacoes
DROP POLICY IF EXISTS "allow_auth_all_consignacoes" ON public.consignacoes;
CREATE POLICY "allow_auth_all_consignacoes" ON public.consignacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Usuarios
DROP POLICY IF EXISTS "allow_auth_all_usuarios" ON public.usuarios;
CREATE POLICY "allow_auth_all_usuarios" ON public.usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed Auth User
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
      crypt('Skip@Pass123!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role)
    VALUES (new_user_id, 'adriana.araujo@kmzero.com.br', 'Admin', 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Seed Veiculos
INSERT INTO public.veiculos (id, marca, modelo, versao, ano_fabricacao, ano_modelo, preco_venda, quilometragem, fotos, status, is_consignado)
VALUES 
  (gen_random_uuid(), 'Toyota', 'Corolla', '2.0 XEI 16V', 2022, 2022, 145900, 32000, '["https://img.usecurling.com/p/800/600?q=white%20suv&color=white"]'::jsonb, 'disponivel', false),
  (gen_random_uuid(), 'Jeep', 'Compass', '2.0 LIMITED 4X4', 2021, 2021, 165000, 45000, '["https://img.usecurling.com/p/800/600?q=black%20suv&color=black"]'::jsonb, 'disponivel', false),
  (gen_random_uuid(), 'Honda', 'Civic', '2.0 EXL 16V', 2020, 2020, 115900, 58000, '["https://img.usecurling.com/p/800/600?q=silver%20sedan&color=gray"]'::jsonb, 'disponivel', true),
  (gen_random_uuid(), 'Volkswagen', 'Nivus', '1.3 HIGHLINE', 2023, 2023, 135000, 15000, '["https://img.usecurling.com/p/800/600?q=red%20suv&color=red"]'::jsonb, 'disponivel', false)
ON CONFLICT (id) DO NOTHING;

