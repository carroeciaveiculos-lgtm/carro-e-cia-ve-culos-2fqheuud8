CREATE TABLE IF NOT EXISTS public.autonomia_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rule TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.autonomia_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.autonomia_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomia_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "autonomia_config_select" ON public.autonomia_config;
CREATE POLICY "autonomia_config_select" ON public.autonomia_config
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "autonomia_config_insert" ON public.autonomia_config;
CREATE POLICY "autonomia_config_insert" ON public.autonomia_config
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "autonomia_config_update" ON public.autonomia_config;
CREATE POLICY "autonomia_config_update" ON public.autonomia_config
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "autonomia_log_select" ON public.autonomia_log;
CREATE POLICY "autonomia_log_select" ON public.autonomia_log
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "autonomia_log_insert" ON public.autonomia_log;
CREATE POLICY "autonomia_log_insert" ON public.autonomia_log
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_autonomia_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_autonomia_config_timestamp ON public.autonomia_config;
CREATE TRIGGER trigger_autonomia_config_timestamp
  BEFORE UPDATE ON public.autonomia_config
  FOR EACH ROW EXECUTE FUNCTION public.update_autonomia_timestamp();

INSERT INTO public.autonomia_config (slug, label, enabled) VALUES
  ('ml_auto_publish', 'Publicar automaticamente no ML após validação', false),
  ('wm_auto_publish', 'Publicar automaticamente na WM após validação', false),
  ('auto_generate_description', 'Gerar descrição automaticamente para veículos sem descrição', true),
  ('reengage_leads_24h', 'Re-engajar leads após 24h sem resposta', false),
  ('unpublish_on_sold', 'Despublicar de todos os portais ao marcar Vendido', true),
  ('alert_missing_fields', 'Avisar quando campos obrigatórios estiverem faltando', true),
  ('alert_quota_limit', 'Avisar quando cota de anúncios estiver próxima do limite', true),
  ('alert_sync_failure', 'Avisar quando sync falhar', true),
  ('log_audit_actions', 'Registrar toda ação automática com data hora e detalhe', true)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS wm_ipva_pago BOOLEAN;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS wm_licenciado BOOLEAN;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS wm_garantia_fabrica BOOLEAN;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS wm_unico_dono BOOLEAN;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS wm_blindado BOOLEAN;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS wm_kit_gas BOOLEAN;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS wm_adaptado_deficiente BOOLEAN;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS wm_veiculo_troca BOOLEAN;

INSERT INTO public.ai_prompts_config (slug, name, prompt_text, description, default_prompt) VALUES
  ('gerar_conteudo', 'Gerador de Descricoes', 'Voce e um especialista em marketing automotivo. Gere uma descricao detalhada e atrativa para o veiculo informado, destacando seus diferenciais, caracteristicas tecnicas e beneficios para o comprador. Use linguagem persuasiva mas honesta.', 'Gera descricoes automaticas de veiculos', 'Voce e um especialista em marketing automotivo. Gere uma descricao detalhada e atrativa para o veiculo informado, destacando seus diferenciais, caracteristicas tecnicas e beneficios para o comprador. Use linguagem persuasiva mas honesta.'),
  ('ai_sdr', 'SDR Inteligente', 'Voce e um SDR especializado em vendas automotivas. Atenda leads qualificando-os, respondendo perguntas sobre veiculos e agendando visitas. Seja cordial, objetivo e sempre busque avancar a conversa.', 'Atende e qualifica leads automaticamente via WhatsApp', 'Voce e um SDR especializado em vendas automotivas. Atenda leads qualificando-os, respondendo perguntas sobre veiculos e agendando visitas. Seja cordial, objetivo e sempre busque avancar a conversa.'),
  ('ai_assistant', 'Assistente IA', 'Voce e um assistente virtual da Carro e Cia Veiculos. Ajude os clientes com duvidas sobre veiculos, financiamento, consignacao e servicos.', 'Assistente virtual geral para atendimento ao cliente', 'Voce e um assistente virtual da Carro e Cia Veiculos. Ajude os clientes com duvidas sobre veiculos, financiamento, consignacao e servicos.'),
  ('gerar_conteudo_social', 'Conteudo Social', 'Voce e um social media especializado no mercado automotivo. Crie posts engajadores para Instagram e Facebook sobre veiculos do estoque, promocoes e dicas.', 'Gera conteudo para redes sociais', 'Voce e um social media especializado no mercado automotivo. Crie posts engajadores para Instagram e Facebook sobre veiculos do estoque, promocoes e dicas.'),
  ('ad_copy_generator', 'Gerador de Anuncios', 'Voce e um copywriter especializado em anuncios automotivos. Crie textos de anuncios otimizados para conversao, com titulos chamativos e CTAs claros.', 'Gera textos de anuncios para campanhas pagas', 'Voce e um copywriter especializado em anuncios automotivos. Crie textos de anuncios otimizados para conversao, com titulos chamativos e CTAs claros.')
ON CONFLICT (slug) DO NOTHING;

DROP POLICY IF EXISTS "ai_prompts_config_select" ON public.ai_prompts_config;
CREATE POLICY "ai_prompts_config_select" ON public.ai_prompts_config
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "ai_prompts_config_update" ON public.ai_prompts_config;
CREATE POLICY "ai_prompts_config_update" ON public.ai_prompts_config
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "ai_prompts_config_insert" ON public.ai_prompts_config;
CREATE POLICY "ai_prompts_config_insert" ON public.ai_prompts_config
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "wm_marcas_select" ON public.wm_marcas;
CREATE POLICY "wm_marcas_select" ON public.wm_marcas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "wm_modelos_select" ON public.wm_modelos;
CREATE POLICY "wm_modelos_select" ON public.wm_modelos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "wm_cores_select" ON public.wm_cores;
CREATE POLICY "wm_cores_select" ON public.wm_cores FOR SELECT TO authenticated USING (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
      'adriana.araujo@kmzero.com.br', crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Adriana Araujo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;
END $$;
