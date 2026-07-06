CREATE TABLE IF NOT EXISTS public.agenda_conteudo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tema TEXT NOT NULL,
  palavra_chave_principal TEXT,
  status TEXT NOT NULL DEFAULT 'Agendado' CHECK (status IN ('Agendado', 'Em Produção', 'Em Revisão', 'Publicado')),
  data_programada TIMESTAMPTZ,
  artigo_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agente_interacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_telefone TEXT NOT NULL,
  mensagem_usuario TEXT,
  resposta_agente TEXT,
  contexto_artigo_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agenda_conteudo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agente_interacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_agenda_conteudo" ON public.agenda_conteudo;
CREATE POLICY "authenticated_all_agenda_conteudo" ON public.agenda_conteudo
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_agente_interacoes" ON public.agente_interacoes;
CREATE POLICY "authenticated_all_agente_interacoes" ON public.agente_interacoes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_agenda_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_agenda_conteudo_updated_at ON public.agenda_conteudo;
CREATE TRIGGER update_agenda_conteudo_updated_at
BEFORE UPDATE ON public.agenda_conteudo
FOR EACH ROW EXECUTE FUNCTION public.update_agenda_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.brain_ia_knowledge WHERE titulo = 'Padrão SEO Carro e Cia Motors — Versão 2.0') THEN
    INSERT INTO public.brain_ia_knowledge (titulo, conteudo, tipo)
    VALUES (
      'Padrão SEO Carro e Cia Motors — Versão 2.0',
      'ESTRUTURA OBRIGATÓRIA (10 SEÇÕES): H1 título principal, Seção 1 Introdução (10%), Seção 2 Conceito Profundo (15%), Seção 3 Como Funciona na Prática (15%), Seção 4 Contexto Brasil (20%), Seção 5 Diferenciais Carro e Cia (10%), Seção 6 Comparativos e Tabelas (10%), Seção 7 Passo a Passo/Tutorial (10%), Seção 8 Casos de Uso/Exemplos (5%), Seção 9 CTAs Estratégicos (5%), Seção 10 FAQ (5%). DISTRIBUIÇÃO: 40% Educação, 20% Contexto Brasil, 20% Diferenciação, 20% CTAs+FAQ. TAMANHO: 2500-6000 palavras. HTML SEMÂNTICO: H1 (apenas 1), H2 seções, H3 subtópicos, H4 para FAQ, table/thead/tbody/tr/th/td, ul/li, strong, a para links internos. SEO LOCAL: Mencionar Uberaba min 5x, Minas Gerais min 3x, Triângulo Mineiro. LINKS INTERNOS min 5: /consignacao, /estoque, /financiamento-auto, /seguro-auto, /consorcio-auto, /vender-meu-carro. FAQ: 5-7 perguntas com H4. META DESCRIPTION: 155-160 caracteres com palavra-chave. TABELAS: min 1 tabela comparativa com dados reais. E-E-A-T: Experiência primeira-mão, citar fontes oficiais (FIPE, DENATRAN), tom autoritativo mas acessível.',
      'texto'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.agenda_conteudo) THEN
    INSERT INTO public.agenda_conteudo (tema, palavra_chave_principal, status, data_programada) VALUES
    ('Mercado Automotivo 2026: Tendências e Oportunidades', 'mercado automotivo 2026', 'Agendado', NOW() + INTERVAL '7 days'),
    ('Consignação de Veículos: O Guia Definitivo', 'consignação de veículos', 'Agendado', NOW() + INTERVAL '14 days'),
    ('Trade-In: Como Trocar Seu Carro com Vantagem', 'troca de carro', 'Agendado', NOW() + INTERVAL '21 days');
  END IF;
END $$;
