-- 1. Restauração e Trava da tabela configuracoes_api
-- O "apagão" ocorreu porque o RLS (Row Level Security) estava habilitado, mas não havia política de acesso definida, ocultando os dados.
DROP POLICY IF EXISTS "allow_auth_all_configuracoes_api" ON public.configuracoes_api;
CREATE POLICY "allow_auth_all_configuracoes_api" ON public.configuracoes_api 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DO $$
BEGIN
  -- Inserir as configurações padrão e a nova integração do Brevo
  INSERT INTO public.configuracoes_api (id, portal, ativo) VALUES
    (gen_random_uuid(), 'Webmotors', false),
    (gen_random_uuid(), 'iCarros', false),
    (gen_random_uuid(), 'OLX', false),
    (gen_random_uuid(), 'Mercado Livre', false),
    (gen_random_uuid(), 'Brevo', false)
  ON CONFLICT (portal) DO NOTHING;
END $$;

-- 2. Adição de novos campos táticos no funil de Leads
DO $$
BEGIN
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS carro_marca TEXT;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS carro_km TEXT;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS unico_dono BOOLEAN DEFAULT false;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS valor_veiculo NUMERIC;
END $$;
