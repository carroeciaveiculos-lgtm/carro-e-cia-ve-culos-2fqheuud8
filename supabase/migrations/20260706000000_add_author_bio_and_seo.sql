-- Add author bio columns to usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS especialidade TEXT;

-- Add FAQ schema column to articles
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS faq_schema TEXT;

-- Seed Gabriel Araujo in auth.users and usuarios (idempotent)
DO $$
DECLARE
  gabriel_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'gabriel.araujo@kmzero.com.br') THEN
    gabriel_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      gabriel_user_id,
      '00000000-0000-0000-0000-000000000000',
      'gabriel.araujo@kmzero.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Gabriel Araujo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, ativo, modulos, nivel, bio, foto_url, especialidade)
    VALUES (
      gabriel_user_id,
      'gabriel.araujo@kmzero.com.br',
      'Gabriel Araújo',
      'vendedor',
      true,
      ARRAY['estoque', 'crm'],
      'operador',
      'Especialista em seguros automotivos, ajudando clientes a encontrar as melhores coberturas com o melhor custo-benefício.',
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/gabriel%20na%20mesa.jpeg',
      'Seguro Auto'
    )
    ON CONFLICT (email) DO NOTHING;
  END IF;

  -- Update Adriana with bio, foto_url and especialidade
  UPDATE public.usuarios SET
    bio = 'Com mais de 20 anos de experiência no mercado automotivo de Uberaba, Adriana é referência em financiamento veicular, consórcios e soluções de crédito para compra de veículos.',
    foto_url = 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos/adriana%20na%20mesa.jpeg',
    especialidade = 'Financiamento, Consórcios e Seguros'
  WHERE email = 'adriana.araujo@kmzero.com.br';
END $$;
