-- Enable RLS and add policies for public tables

-- site_banners
ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_anon_select_site_banners" ON public.site_banners;
CREATE POLICY "allow_anon_select_site_banners" ON public.site_banners FOR SELECT USING (ativo = true);

DROP POLICY IF EXISTS "allow_auth_all_site_banners" ON public.site_banners;
CREATE POLICY "allow_auth_all_site_banners" ON public.site_banners FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- site_depoimentos
ALTER TABLE public.site_depoimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_anon_select_site_depoimentos" ON public.site_depoimentos;
CREATE POLICY "allow_anon_select_site_depoimentos" ON public.site_depoimentos FOR SELECT USING (publicado = true);

DROP POLICY IF EXISTS "allow_auth_all_site_depoimentos" ON public.site_depoimentos;
CREATE POLICY "allow_auth_all_site_depoimentos" ON public.site_depoimentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_anon_select_usuarios" ON public.usuarios;
CREATE POLICY "allow_anon_select_usuarios" ON public.usuarios FOR SELECT USING (ativo = true);

DROP POLICY IF EXISTS "allow_auth_all_usuarios" ON public.usuarios;
CREATE POLICY "allow_auth_all_usuarios" ON public.usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- veiculos (ensure public visibility)
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_anon_select_veiculos" ON public.veiculos;
CREATE POLICY "allow_anon_select_veiculos" ON public.veiculos FOR SELECT USING (exibir_no_site = true AND status = 'disponivel');

-- Seed site_banners
INSERT INTO public.site_banners (id, titulo, imagem_url, texto, botao_texto, botao_link, ativo, ordem)
VALUES 
  (gen_random_uuid(), 'Venda seu carro rápido', 'fotos/fachada-da-loja.webp', 'Avaliação grátis e contrato protegido', 'Ver Estoque', '/estoque', true, 1)
ON CONFLICT DO NOTHING;

-- Seed site_depoimentos
INSERT INTO public.site_depoimentos (id, nome_cliente, texto, estrelas, tipo, publicado)
VALUES 
  (gen_random_uuid(), 'Carlos Henrique', 'Vendi meu carro em menos de uma semana através da consignação. Serviço transparente e muito seguro. Recomendo a Carro e Cia de olhos fechados!', 5, 'Cliente Consignação', true),
  (gen_random_uuid(), 'Mariana Silva', 'Comprei meu primeiro SUV com eles. O atendimento foi excepcional, tiraram todas as minhas dúvidas e o carro estava impecável.', 5, 'Cliente Compra', true),
  (gen_random_uuid(), 'Roberto Mendes', 'A melhor avaliação do mercado na troca do meu veículo. Confio na equipe há mais de 10 anos.', 5, 'Cliente Fiel', true)
ON CONFLICT DO NOTHING;

-- Seed auth user
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

    INSERT INTO public.usuarios (id, email, nome, role, ativo)
    VALUES (new_user_id, 'adriana.araujo@kmzero.com.br', 'Adriana Araújo', 'admin', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
