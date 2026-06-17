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
      '{"name": "Adriana Araújo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, email, name, is_admin)
    VALUES (new_user_id, 'adriana.araujo@kmzero.com.br', 'Adriana Araújo', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

ALTER TABLE public.social_configuracoes ADD COLUMN IF NOT EXISTS ai_system_prompt TEXT DEFAULT 'Você é um assistente de marketing digital especialista em veículos seminovos.';

CREATE TABLE IF NOT EXISTS public.veiculos_cache (
  placa TEXT PRIMARY KEY,
  chassi TEXT,
  renavam TEXT,
  marca TEXT,
  modelo TEXT,
  ano_fab TEXT,
  ano_modelo TEXT,
  combustivel TEXT,
  combustivel_sintetico TEXT,
  cor TEXT,
  preco_fipe NUMERIC,
  mes_referencia TEXT,
  codigo_fipe TEXT,
  url_fipe TEXT,
  historico_fipe JSONB,
  categoria TEXT,
  categoria_sintetica TEXT,
  chassi_completo TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.veiculos_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_veiculos_cache" ON public.veiculos_cache;
CREATE POLICY "allow_all_veiculos_cache" ON public.veiculos_cache FOR ALL USING (true) WITH CHECK (true);
