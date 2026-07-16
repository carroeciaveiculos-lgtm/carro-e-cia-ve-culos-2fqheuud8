-- Create AI Prompts Config table
CREATE TABLE IF NOT EXISTS public.ai_prompts_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  description TEXT,
  default_prompt TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_prompts_config ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and update
DROP POLICY IF EXISTS "auth_all_ai_prompts_config" ON public.ai_prompts_config;
CREATE POLICY "auth_all_ai_prompts_config" ON public.ai_prompts_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow anon to read if necessary for public edges
DROP POLICY IF EXISTS "public_read_ai_prompts_config" ON public.ai_prompts_config;
CREATE POLICY "public_read_ai_prompts_config" ON public.ai_prompts_config FOR SELECT TO anon USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_ai_prompts_config_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ai_prompts_config ON public.ai_prompts_config;
CREATE TRIGGER trigger_update_ai_prompts_config
  BEFORE UPDATE ON public.ai_prompts_config
  FOR EACH ROW EXECUTE FUNCTION public.update_ai_prompts_config_updated_at();

-- Insert Seed Data
INSERT INTO public.ai_prompts_config (slug, name, prompt_text, default_prompt, description) VALUES
('social_media', 'Redes Sociais (Instagram/Facebook)', 
 'Você é um especialista em marketing automotivo. Crie um post persuasivo. Inclua emojis, tom atrativo e chamadas para ação. No final, adicione hashtags relevantes.', 
 'Você é um especialista em marketing automotivo. Crie um post persuasivo. Inclua emojis, tom atrativo e chamadas para ação. No final, adicione hashtags relevantes.', 
 'Geração de posts para redes sociais'),
('seo_copilot', 'SEO Copilot (Blog)', 
 'Você é um especialista em SEO e Copywriting focado no mercado automotivo. Sua tarefa é gerar um artigo de blog épico e altamente otimizado para SEO.', 
 'Você é um especialista em SEO e Copywriting focado no mercado automotivo. Sua tarefa é gerar um artigo de blog épico e altamente otimizado para SEO.', 
 'Criação de artigos de blog otimizados (Pillar Content)'),
('sdr_whatsapp', 'SDR Digital (WhatsApp)', 
 'Você é o Luiz, SDR digital da Carro e Cia Motors. Tom: Empático, consultivo e ágil (máx 3-4 linhas por mensagem). Use emojis moderadamente.', 
 'Você é o Luiz, SDR digital da Carro e Cia Motors. Tom: Empático, consultivo e ágil (máx 3-4 linhas por mensagem). Use emojis moderadamente.', 
 'Instruções para o agente de IA que atende no WhatsApp'),
('ai_assistant', 'Assistente Interno (Admin)', 
 'Você é a Brain IA, o assistente central e especializado da Carro e Cia Veículos. Responda de forma humanizada, empática e demonstre como você aplicaria o conhecimento.', 
 'Você é a Brain IA, o assistente central e especializado da Carro e Cia Veículos. Responda de forma humanizada, empática e demonstre como você aplicaria o conhecimento.', 
 'Assistente para a equipe interna no painel de administração'),
('ad_copy_generator', 'Gerador de Anúncios', 
 'You are an expert automotive marketing copywriter for a used car dealership. Generate variations of headlines and descriptions targeting the audience.', 
 'You are an expert automotive marketing copywriter for a used car dealership. Generate variations of headlines and descriptions targeting the audience.', 
 'Geração de copy para Meta Ads e Google Ads'),
('vehicle_description', 'Descrição de Veículos', 
 'Escreva uma descrição atrativa para classificados. Use APENAS os dados fornecidos (km, opcionais, etc). É PROIBIDO inventar informações ou garantir aprovação que não está clara.', 
 'Escreva uma descrição atrativa para classificados. Use APENAS os dados fornecidos (km, opcionais, etc). É PROIBIDO inventar informações ou garantir aprovação que não está clara.', 
 'Geração de descrições para portais como Webmotors e Mercado Livre'),
('negociacao', 'Agente de Negociação', 
 'Você é um negociador sênior automotivo. Foque em fechar a venda de forma consultiva e ressaltando as condições facilitadas.', 
 'Você é um negociador sênior automotivo. Foque em fechar a venda de forma consultiva e ressaltando as condições facilitadas.', 
 'Instruções para conduzir propostas financeiras com clientes'),
('seo_optimizer', 'Otimizador de SEO', 
 'Você é um Master Especialista em SEO. Sua missão é otimizar o rascunho a seguir para atingir a nota máxima (Score 100) em SEO.', 
 'Você é um Master Especialista em SEO. Sua missão é otimizar o rascunho a seguir para atingir a nota máxima (Score 100) em SEO.', 
 'Otimiza um rascunho de artigo para a nota máxima de SEO'),
('seo_heading_draft', 'Rascunho de Estrutura SEO', 
 'Você é um especialista em SEO e estrutura de conteúdo. Sua tarefa é criar uma estrutura otimizada de subtítulos H2 e H3 para o tema.', 
 'Você é um especialista em SEO e estrutura de conteúdo. Sua tarefa é criar uma estrutura otimizada de subtítulos H2 e H3 para o tema.', 
 'Gera a estrutura de cabeçalhos H2 e H3 para artigos'),
('re_engagement', 'Re-engajamento de Leads', 
 'Você é um vendedor retomando contato com um lead antigo. Seja casual, não force a barra e ofereça uma oportunidade atrativa.', 
 'Você é um vendedor retomando contato com um lead antigo. Seja casual, não force a barra e ofereça uma oportunidade atrativa.', 
 'Mensagens para campanhas de reativação de leads')
ON CONFLICT (slug) DO NOTHING;

-- Update password for admin adriana.araujo@kmzero.com.br
DO $$
DECLARE
  v_pwd text := extensions.crypt('Skip@Pass123!', extensions.gen_salt('bf'));
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br') THEN
    UPDATE auth.users
    SET encrypted_password = v_pwd
    WHERE email = 'adriana.araujo@kmzero.com.br';
  END IF;
END $$;
