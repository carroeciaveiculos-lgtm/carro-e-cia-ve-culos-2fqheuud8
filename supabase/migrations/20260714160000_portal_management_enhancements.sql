-- Ensure veiculos has INSERT and UPDATE policies for authenticated users
DROP POLICY IF EXISTS "auth_insert_veiculos" ON public.veiculos;
CREATE POLICY "auth_insert_veiculos" ON public.veiculos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_veiculos" ON public.veiculos;
CREATE POLICY "auth_update_veiculos" ON public.veiculos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Ensure estoque_publicacoes has all RLS policies for authenticated users
ALTER TABLE public.estoque_publicacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_estoque_pub_v2" ON public.estoque_publicacoes;
CREATE POLICY "auth_select_estoque_pub_v2" ON public.estoque_publicacoes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_estoque_pub_v2" ON public.estoque_publicacoes;
CREATE POLICY "auth_insert_estoque_pub_v2" ON public.estoque_publicacoes
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_estoque_pub_v2" ON public.estoque_publicacoes;
CREATE POLICY "auth_update_estoque_pub_v2" ON public.estoque_publicacoes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_estoque_pub_v2" ON public.estoque_publicacoes;
CREATE POLICY "auth_delete_estoque_pub_v2" ON public.estoque_publicacoes
  FOR DELETE TO authenticated USING (true);

-- Ensure seed user exists (idempotent)
DO $$
DECLARE
  seed_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br') THEN
    seed_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      seed_user_id,
      '00000000-0000-0000-0000-000000000000',
      'adriana.araujo@kmzero.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Adriana Araujo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
    INSERT INTO public.usuarios (id, nome, email, role, ativo, nivel, modulos)
    VALUES (seed_user_id, 'Adriana Araujo', 'adriana.araujo@kmzero.com.br', 'admin', true, 'admin', ARRAY['estoque','crm','portais','relatorios','configuracoes'])
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Add index for estoque_publicacoes lookup by veiculo_id
CREATE INDEX IF NOT EXISTS idx_estoque_pub_veiculo_v2 ON public.estoque_publicacoes(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_estoque_pub_platform ON public.estoque_publicacoes(platform);
