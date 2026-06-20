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
      NULL,
      '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, nivel)
    VALUES (new_user_id, 'adriana.araujo@kmzero.com.br', 'Adriana Araújo', 'admin', 'admin')
    ON CONFLICT (email) DO NOTHING;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.block_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text NOT NULL,
  conteudo jsonb NOT NULL,
  preview_url text,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE public.block_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_block_templates" ON public.block_templates;
CREATE POLICY "authenticated_select_block_templates" ON public.block_templates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_block_templates" ON public.block_templates;
CREATE POLICY "authenticated_insert_block_templates" ON public.block_templates FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_block_templates" ON public.block_templates;
CREATE POLICY "authenticated_update_block_templates" ON public.block_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_block_templates" ON public.block_templates;
CREATE POLICY "authenticated_delete_block_templates" ON public.block_templates FOR DELETE TO authenticated USING (true);

INSERT INTO public.block_templates (id, nome, categoria, conteudo)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Cards de Veículos', 'Layout', '{"type": "grid", "style": {"gridTemplateColumns": "repeat(3, 1fr)", "gap": "1rem"}, "children": [{"id": "b1", "type": "image", "data": {"url": "https://img.usecurling.com/p/400/300?q=car"}}, {"id": "b2", "type": "image", "data": {"url": "https://img.usecurling.com/p/400/300?q=suv"}}, {"id": "b3", "type": "image", "data": {"url": "https://img.usecurling.com/p/400/300?q=truck"}}]}'::jsonb),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Galeria de Fotos', 'Galeria', '{"type": "gallery", "data": {"images": ["https://img.usecurling.com/p/600/400?q=cars&seed=1", "https://img.usecurling.com/p/600/400?q=cars&seed=2", "https://img.usecurling.com/p/600/400?q=cars&seed=3"]}}'::jsonb),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'CTA de Contato', 'Vendas', '{"type": "flex", "style": {"flexDirection": "column", "alignItems": "center", "gap": "1rem", "backgroundColor": "#f8fafc", "padding": "2rem"}, "children": [{"id": "c1", "type": "text", "data": {"html": "<h2 style=\"text-align:center\">Ficou interessado?</h2><p style=\"text-align:center\">Entre em contato agora mesmo!</p>"}}, {"id": "c2", "type": "hero", "data": {"title": "Fale com um consultor", "cta_text": "Chamar no WhatsApp", "image_url": ""}}]}'::jsonb)
ON CONFLICT (id) DO NOTHING;
