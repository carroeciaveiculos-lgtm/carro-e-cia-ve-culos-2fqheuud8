-- Migração para tabelas de Blog e LPs (CMS e CRM)

-- Tabela de Blog Posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT,
    meta_description TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    author TEXT DEFAULT 'Carro e Cia Veículos',
    read_time TEXT DEFAULT '5 min',
    tags TEXT[] DEFAULT '{}',
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Blog
DROP POLICY IF EXISTS "allow_public_read_blog" ON public.blog_posts;
CREATE POLICY "allow_public_read_blog" ON public.blog_posts FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "allow_auth_all_blog" ON public.blog_posts;
CREATE POLICY "allow_auth_all_blog" ON public.blog_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed inicial de Posts do Blog (Baseados na solicitação do Cliente)
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.blog_posts) THEN
    INSERT INTO public.blog_posts (title, slug, category, meta_description, content, tags, image_url, read_time)
    VALUES 
    (
      'Financiamento de Veículo Consignado: O Guia Completo Para Pagar Menos Juros', 
      'financiamento-veiculo-consignado-guia-completo', 
      'Financiamento e Consignado', 
      'Entenda como o financiamento de veículo consignado funciona, quem tem direito, como simular e por que essa é a opção mais inteligente para quem quer pagar menos juros.',
      '<p>Aqui está uma verdade que os bancos preferem que você não saiba: a diferença entre o financiamento convencional e o consignado pode representar milhares de reais no bolso — ou fora dele. E a maioria das pessoas que tem direito ao consignado nunca usou. Por quê? Simples: ninguém explicou direito.</p><h2>O que é Financiamento de Veículo Consignado?</h2><p>O financiamento consignado é uma linha de crédito em que as parcelas são descontadas diretamente da sua folha de pagamento ou benefício previdenciário. Isso elimina o risco de inadimplência para o banco — e esse menor risco se traduz em taxas de juros muito menores para você.</p><h3>Quem Tem Direito ao Financiamento Consignado?</h3><ul><li>Servidores públicos federais, estaduais e municipais</li><li>Militares e forças armadas</li><li>Aposentados e pensionistas do INSS</li></ul>',
      ARRAY['consignado', 'financiamento', 'INSS', 'servidor público'],
      'https://img.usecurling.com/p/800/400?q=finance',
      '6 min'
    ),
    (
      'Como Vender Meu Carro Rápido: 7 Estratégias Que Realmente Funcionam', 
      'como-vender-meu-carro-rapido', 
      'Venda de Veículos', 
      'Quer vender seu carro rápido e pelo melhor preço? Veja 7 estratégias comprovadas e descubra por que a consignação pode ser o caminho mais inteligente para você.',
      '<p>A grande mentira do mercado automotivo particular é que vender carro é simples. "Coloca no OLX e vende logo." Quem já tentou sabe que a realidade é bem diferente: semanas de mensagens respondidas, propostas ridículas e nenhuma venda. Mas existe um caminho mais inteligente.</p><h2>7 Estratégias Para Vender Seu Carro Mais Rápido</h2><p>1. Pesquise o preço real de mercado (não só a FIPE)<br>2. Invista em fotos de qualidade<br>3. Escreva um anúncio completo e honesto<br>4. Anuncie em múltiplos canais<br>5. Considere a consignação — seriamente</p><h2>A Opção Que Poucos Consideram: Consignação Profissional</h2><p>Na Carro e Cia Veículos, temos um processo de consignação estruturado, transparente e seguro. Seu veículo entra no nosso estoque com contrato claro, prazo definido e valor acordado. A gente vende — você recebe.</p>',
      ARRAY['vender carro', 'consignação', 'anunciar carro'],
      'https://img.usecurling.com/p/800/400?q=car%20sale',
      '6 min'
    ),
    (
      'Carros Seminovos em Uberaba MG: O Guia Completo Para Comprar com Segurança', 
      'carros-seminovos-uberaba-mg-guia-completo', 
      'Compra de Veículos', 
      'Guia completo para comprar carros seminovos em Uberaba MG com segurança. O que verificar, como financiar, onde comprar e como evitar os golpes mais comuns.',
      '<p>Comprar um carro seminovo em Uberaba deveria ser simples. Mas o mercado de usados é cheio de armadilhas para quem não sabe o que está procurando: hodômetros adulterados, histórico de sinistros escondido, documentação irregular.</p><h2>O Que Verificar Antes de Comprar um Carro Seminovo</h2><p>1. Histórico do veículo no RENAVAM<br>2. Hodômetro — como identificar adulteração<br>3. Documentação completa<br>4. Vistoria mecânica independente</p><h2>Por que Comprar Carros Seminovos na Carro e Cia Veículos?</h2><p>Com mais de 20 anos no mercado de Uberaba, a Carro e Cia construiu reputação em cima de transparência, qualidade e suporte total.</p>',
      ARRAY['seminovos', 'carros usados', 'Uberaba', 'comprar carro'],
      'https://img.usecurling.com/p/800/400?q=dealership',
      '7 min'
    ),
    (
      'Como Avaliar Meu Veículo Para Venda: Não Perca Dinheiro Por Ignorar Isso',
      'como-avaliar-meu-veiculo-para-venda',
      'Venda de Veículos',
      'Saiba como fazer a avaliação correta do seu veículo antes de vender. Evite os erros mais comuns que fazem proprietários perderem dinheiro na negociação.',
      '<p>A avaliação mal feita não é só uma questão de preço — é uma questão de deixar milhares de reais na mesa. Saiba como usar a Tabela FIPE corretamente e os fatores que valorizam o seu carro no mercado de Uberaba.</p><h2>Fatores que Aumentam o Valor</h2><p>Revisões em dia, único dono e quilometragem abaixo da média.</p>',
      ARRAY['avaliação', 'vender carro', 'tabela FIPE'],
      'https://img.usecurling.com/p/800/400?q=inspection',
      '5 min'
    );
  END IF;
END $do$;

-- Tabela de Landing Pages para CMS Dinâmico
CREATE TABLE IF NOT EXISTS public.landing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    meta_description TEXT,
    content JSONB DEFAULT '{}',
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS nas Landing Pages
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_read_lps" ON public.landing_pages;
CREATE POLICY "allow_public_read_lps" ON public.landing_pages FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "allow_auth_all_lps" ON public.landing_pages;
CREATE POLICY "allow_auth_all_lps" ON public.landing_pages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Funções e Triggers para automação do updated_at
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $trigger$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$trigger$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS update_landing_pages_updated_at ON public.landing_pages;
CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
