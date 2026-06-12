DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed admin user (idempotent: skip if email already exists)
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
      '{"name": "Adriana Araújo"}',
      false, 'authenticated', 'authenticated',
      '',    -- confirmation_token
      '',    -- recovery_token
      '',    -- email_change_token_new
      '',    -- email_change
      '',    -- email_change_token_current
      NULL,  -- phone
      '',    -- phone_change
      '',    -- phone_change_token
      ''     -- reauthentication_token
    );

    INSERT INTO public.usuarios (id, email, nome, role, nivel, ativo, modulos)
    VALUES (new_user_id, 'adriana.araujo@kmzero.com.br', 'Adriana Araújo', 'admin', 'admin', true, ARRAY['estoque', 'crm', 'site'])
    ON CONFLICT (email) DO NOTHING;
  END IF;
END $$;

-- Explicitly ensure policies for `leads`
DROP POLICY IF EXISTS "allow_auth_all_leads" ON public.leads;
CREATE POLICY "allow_auth_all_leads" ON public.leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Explicitly ensure policies for `conversation_history`
DROP POLICY IF EXISTS "allow_auth_all_conversation_history" ON public.conversation_history;
CREATE POLICY "allow_auth_all_conversation_history" ON public.conversation_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
