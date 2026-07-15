-- Webmotors mapping tables
CREATE TABLE IF NOT EXISTS public.wm_marcas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_crm TEXT NOT NULL,
  codigo_wm TEXT,
  nome_wm TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wm_modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_marca_wm TEXT,
  nome_crm TEXT NOT NULL,
  codigo_wm TEXT,
  nome_wm TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wm_cores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_crm TEXT NOT NULL,
  codigo_wm TEXT,
  nome_wm TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add requires_review column to veiculos
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS requires_review BOOLEAN DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.wm_marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wm_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wm_cores ENABLE ROW LEVEL SECURITY;

-- RLS policies for wm_marcas
DROP POLICY IF EXISTS "auth_all_wm_marcas" ON public.wm_marcas;
CREATE POLICY "auth_all_wm_marcas" ON public.wm_marcas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS policies for wm_modelos
DROP POLICY IF EXISTS "auth_all_wm_modelos" ON public.wm_modelos;
CREATE POLICY "auth_all_wm_modelos" ON public.wm_modelos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS policies for wm_cores
DROP POLICY IF EXISTS "auth_all_wm_cores" ON public.wm_cores;
CREATE POLICY "auth_all_wm_cores" ON public.wm_cores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed WM catalog data (idempotent)
INSERT INTO public.wm_marcas (nome_crm, codigo_wm, nome_wm) VALUES
  ('Chevrolet', '6', 'Chevrolet'),
  ('Fiat', '7', 'Fiat'),
  ('Ford', '8', 'Ford'),
  ('Honda', '9', 'Honda'),
  ('Hyundai', '10', 'Hyundai'),
  ('Nissan', '11', 'Nissan'),
  ('Renault', '12', 'Renault'),
  ('Toyota', '13', 'Toyota'),
  ('Volkswagen', '14', 'Volkswagen'),
  ('Jeep', '15', 'Jeep')
ON CONFLICT DO NOTHING;

INSERT INTO public.wm_cores (nome_crm, codigo_wm, nome_wm) VALUES
  ('Branco', '1', 'Branco'),
  ('Prata', '2', 'Prata'),
  ('Preto', '3', 'Preto'),
  ('Cinza', '4', 'Cinza'),
  ('Vermelho', '5', 'Vermelho'),
  ('Azul', '6', 'Azul'),
  ('Verde', '7', 'Verde'),
  ('Amarelo', '8', 'Amarelo'),
  ('Marrom', '9', 'Marrom'),
  ('Bege', '10', 'Bege')
ON CONFLICT DO NOTHING;

-- Dashboard RPC function
CREATE OR REPLACE FUNCTION public.get_wm_dashboard(p_loja_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  wm_plat_id UUID;
  total_pub INTEGER;
  errors_7d INTEGER;
  pending_syncs INTEGER;
  leads_7d INTEGER;
BEGIN
  SELECT id INTO wm_plat_id FROM public.plataformas WHERE slug = 'webmotors' LIMIT 1;

  SELECT COUNT(*) INTO total_pub
  FROM public.estoque_publicacoes
  WHERE platform = 'webmotors' AND status IN ('publicado', 'active', 'agendado');

  SELECT COUNT(*) INTO errors_7d
  FROM public.sync_log
  WHERE plataforma_id = wm_plat_id
    AND status = 'erro'
    AND created_at > NOW() - INTERVAL '7 days';

  SELECT COUNT(*) INTO pending_syncs
  FROM public.sync_log
  WHERE plataforma_id = wm_plat_id
    AND status = 'pending';

  SELECT COUNT(*) INTO leads_7d
  FROM public.leads l
  WHERE l.created_at > NOW() - INTERVAL '7 days'
    AND l.veiculo_id IN (
      SELECT veiculo_id FROM public.estoque_publicacoes WHERE platform = 'webmotors'
    );

  RETURN jsonb_build_object(
    'total_published', COALESCE(total_pub, 0),
    'sync_errors_7d', COALESCE(errors_7d, 0),
    'pending_syncs', COALESCE(pending_syncs, 0),
    'leads_7d', COALESCE(leads_7d, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: notify new vehicle via WhatsApp
CREATE OR REPLACE FUNCTION public.notify_new_vehicle_trigger()
RETURNS trigger AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/notify-new-vehicle',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'veiculo_id', NEW.id,
      'marca', NEW.marca,
      'modelo', NEW.modelo,
      'ano_modelo', NEW.ano_modelo,
      'preco_venda', NEW.preco_venda,
      'placa', NEW.placa
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_vehicle ON public.veiculos;
CREATE TRIGGER trigger_notify_new_vehicle
  AFTER INSERT ON public.veiculos
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_vehicle_trigger();

-- Auth seed (idempotent)
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
