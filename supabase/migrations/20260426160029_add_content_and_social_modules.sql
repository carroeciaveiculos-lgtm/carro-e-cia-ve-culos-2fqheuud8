-- CREATE TABLES
CREATE TABLE IF NOT EXISTS public.social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    redes JSONB NOT NULL,
    texto TEXT,
    imagem TEXT,
    data_agendamento TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Agendado',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    meta_title VARCHAR(55),
    meta_description VARCHAR(160),
    h1_pagina VARCHAR(60),
    palavras_chave_principais JSONB,
    canonical_url TEXT,
    og_title VARCHAR(55),
    og_description VARCHAR(160),
    og_image_url TEXT,
    schema_markup VARCHAR(50),
    indice_google BOOLEAN DEFAULT true,
    robots_meta VARCHAR(100) DEFAULT 'index, follow',
    conteudo TEXT,
    imagem_destaque_url TEXT,
    template VARCHAR(50),
    ordem_menu INTEGER,
    visibilidade VARCHAR(20) DEFAULT 'Pública',
    status_publicacao VARCHAR(20) DEFAULT 'Rascunho',
    data_agendamento TIMESTAMP WITH TIME ZONE,
    descricao_interna VARCHAR(200),
    autor_id UUID REFERENCES auth.users(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    categoria VARCHAR(50),
    tags JSONB,
    resumo VARCHAR(160),
    meta_title VARCHAR(55),
    meta_description VARCHAR(160),
    h1_artigo VARCHAR(60),
    palavras_chave_principais JSONB,
    palavras_chave_secundarias JSONB,
    canonical_url TEXT,
    og_title VARCHAR(55),
    og_description VARCHAR(160),
    og_image_url TEXT,
    schema_markup VARCHAR(50),
    indice_google BOOLEAN DEFAULT true,
    robots_meta VARCHAR(100) DEFAULT 'index, follow',
    conteudo TEXT,
    imagem_destaque_url TEXT,
    tempo_leitura INTEGER,
    categoria_secundaria VARCHAR(50),
    autor_convidado VARCHAR(255),
    url_fonte_externa TEXT,
    artigo_pillar BOOLEAN DEFAULT false,
    artigos_relacionados JSONB,
    proximo_artigo_sugerido UUID,
    permitir_comentarios BOOLEAN DEFAULT false,
    destaque BOOLEAN DEFAULT false,
    status_publicacao VARCHAR(20) DEFAULT 'Rascunho',
    data_agendamento TIMESTAMP WITH TIME ZONE,
    seo_score INTEGER DEFAULT 0,
    autor_id UUID REFERENCES auth.users(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pages_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  titulo VARCHAR(100),
  slug VARCHAR(100),
  meta_title VARCHAR(55),
  meta_description VARCHAR(160),
  h1_pagina VARCHAR(60),
  palavras_chave_principais JSONB,
  canonical_url TEXT,
  og_title VARCHAR(55),
  og_description VARCHAR(160),
  og_image_url TEXT,
  schema_markup VARCHAR(50),
  indice_google BOOLEAN,
  robots_meta VARCHAR(100),
  conteudo TEXT,
  imagem_destaque_url TEXT,
  template VARCHAR(50),
  ordem_menu INTEGER,
  visibilidade VARCHAR(20),
  status_publicacao VARCHAR(20),
  data_agendamento TIMESTAMP WITH TIME ZONE,
  descricao_interna VARCHAR(200),
  autor_id UUID REFERENCES auth.users(id),
  acao VARCHAR(50),
  resumo_mudancas JSONB,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pages_versions_page_id ON public.pages_versions(page_id);
CREATE INDEX IF NOT EXISTS idx_pages_versions_criado_em ON public.pages_versions(criado_em DESC);

CREATE TABLE IF NOT EXISTS public.article_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  titulo VARCHAR(100),
  slug VARCHAR(100),
  categoria VARCHAR(50),
  tags JSONB,
  resumo VARCHAR(160),
  meta_title VARCHAR(55),
  meta_description VARCHAR(160),
  h1_artigo VARCHAR(60),
  palavras_chave_principais JSONB,
  palavras_chave_secundarias JSONB,
  canonical_url TEXT,
  og_title VARCHAR(55),
  og_description VARCHAR(160),
  og_image_url TEXT,
  schema_markup VARCHAR(50),
  indice_google BOOLEAN,
  robots_meta VARCHAR(100),
  conteudo TEXT,
  imagem_destaque_url TEXT,
  tempo_leitura INTEGER,
  categoria_secundaria VARCHAR(50),
  autor_convidado VARCHAR(255),
  url_fonte_externa TEXT,
  artigo_pillar BOOLEAN,
  artigos_relacionados JSONB,
  proximo_artigo_sugerido UUID,
  permitir_comentarios BOOLEAN,
  destaque BOOLEAN,
  status_publicacao VARCHAR(20),
  data_agendamento TIMESTAMP WITH TIME ZONE,
  seo_score INTEGER,
  autor_id UUID REFERENCES auth.users(id),
  acao VARCHAR(50),
  resumo_mudancas JSONB,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_article_versions_article_id ON public.article_versions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_versions_criado_em ON public.article_versions(criado_em DESC);

CREATE TABLE IF NOT EXISTS public.keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    palavra_chave VARCHAR(100) UNIQUE,
    categoria VARCHAR(50),
    volume_busca INTEGER,
    dificuldade VARCHAR(20),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chatbot_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES auth.users(id),
    tipo_editor VARCHAR(20),
    editor_id UUID,
    pergunta TEXT,
    resposta TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TRIGGERS & FUNCTIONS
DO $$
BEGIN
  -- RLS POLICIES
  DROP POLICY IF EXISTS "allow_auth_all_social" ON public.social_posts;
  CREATE POLICY "allow_auth_all_social" ON public.social_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
  ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_auth_all_pages" ON public.pages;
  CREATE POLICY "allow_auth_all_pages" ON public.pages FOR ALL TO authenticated USING (true) WITH CHECK (true);
  ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_auth_all_articles" ON public.articles;
  CREATE POLICY "allow_auth_all_articles" ON public.articles FOR ALL TO authenticated USING (true) WITH CHECK (true);
  ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "allow_auth_all_pages_versions" ON public.pages_versions;
  CREATE POLICY "allow_auth_all_pages_versions" ON public.pages_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);
  ALTER TABLE public.pages_versions ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_auth_all_article_versions" ON public.article_versions;
  CREATE POLICY "allow_auth_all_article_versions" ON public.article_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);
  ALTER TABLE public.article_versions ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_auth_all_keywords" ON public.keywords;
  CREATE POLICY "allow_auth_all_keywords" ON public.keywords FOR ALL TO authenticated USING (true) WITH CHECK (true);
  ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_auth_all_chatbot_history" ON public.chatbot_history;
  CREATE POLICY "allow_auth_all_chatbot_history" ON public.chatbot_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
  ALTER TABLE public.chatbot_history ENABLE ROW LEVEL SECURITY;
END $$;

CREATE OR REPLACE FUNCTION public.trigger_pages_version_insert() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.pages_versions (
    page_id, titulo, slug, meta_title, meta_description, h1_pagina,
    palavras_chave_principais, canonical_url, og_title, og_description,
    og_image_url, schema_markup, indice_google, robots_meta, conteudo,
    imagem_destaque_url, template, ordem_menu, visibilidade, status_publicacao,
    data_agendamento, descricao_interna, autor_id, acao, criado_em
  ) VALUES (
    NEW.id, NEW.titulo, NEW.slug, NEW.meta_title, NEW.meta_description, NEW.h1_pagina,
    NEW.palavras_chave_principais, NEW.canonical_url, NEW.og_title, NEW.og_description,
    NEW.og_image_url, NEW.schema_markup, NEW.indice_google, NEW.robots_meta, NEW.conteudo,
    NEW.imagem_destaque_url, NEW.template, NEW.ordem_menu, NEW.visibilidade, NEW.status_publicacao,
    NEW.data_agendamento, NEW.descricao_interna, NEW.autor_id, 
    CASE WHEN TG_OP = 'INSERT' THEN 'Criado' ELSE 'Editado' END, now()
  );
  
  -- Cleanup old versions (keep last 50)
  DELETE FROM public.pages_versions
  WHERE page_id = NEW.id
  AND id NOT IN (
    SELECT id FROM public.pages_versions WHERE page_id = NEW.id ORDER BY criado_em DESC LIMIT 50
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_pages_version_insert ON public.pages;
CREATE TRIGGER on_pages_version_insert
  AFTER INSERT OR UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.trigger_pages_version_insert();


CREATE OR REPLACE FUNCTION public.trigger_articles_version_insert() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.article_versions (
    article_id, titulo, slug, categoria, tags, resumo, meta_title, meta_description,
    h1_artigo, palavras_chave_principais, palavras_chave_secundarias, canonical_url,
    og_title, og_description, og_image_url, schema_markup, indice_google, robots_meta,
    conteudo, imagem_destaque_url, tempo_leitura, categoria_secundaria, autor_convidado,
    url_fonte_externa, artigo_pillar, artigos_relacionados, proximo_artigo_sugerido,
    permitir_comentarios, destaque, status_publicacao, data_agendamento, seo_score,
    autor_id, acao, criado_em
  ) VALUES (
    NEW.id, NEW.titulo, NEW.slug, NEW.categoria, NEW.tags, NEW.resumo, NEW.meta_title, NEW.meta_description,
    NEW.h1_artigo, NEW.palavras_chave_principais, NEW.palavras_chave_secundarias, NEW.canonical_url,
    NEW.og_title, NEW.og_description, NEW.og_image_url, NEW.schema_markup, NEW.indice_google, NEW.robots_meta,
    NEW.conteudo, NEW.imagem_destaque_url, NEW.tempo_leitura, NEW.categoria_secundaria, NEW.autor_convidado,
    NEW.url_fonte_externa, NEW.artigo_pillar, NEW.artigos_relacionados, NEW.proximo_artigo_sugerido,
    NEW.permitir_comentarios, NEW.destaque, NEW.status_publicacao, NEW.data_agendamento, NEW.seo_score,
    NEW.autor_id, 
    CASE WHEN TG_OP = 'INSERT' THEN 'Criado' ELSE 'Editado' END, now()
  );
  
  -- Cleanup old versions
  DELETE FROM public.article_versions
  WHERE article_id = NEW.id
  AND id NOT IN (
    SELECT id FROM public.article_versions WHERE article_id = NEW.id ORDER BY criado_em DESC LIMIT 50
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_articles_version_insert ON public.articles;
CREATE TRIGGER on_articles_version_insert
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_articles_version_insert();

-- Seed Keywords
INSERT INTO public.keywords (palavra_chave, categoria, volume_busca, dificuldade) VALUES 
('consignação de veículos', 'Consignação', 5000, 'Média'),
('vender carro usado', 'Venda', 12000, 'Alta'),
('comprar carro seminovo', 'Compra', 8000, 'Média'),
('segurança na compra de carro', 'Segurança', 2000, 'Baixa'),
('documentação para transferir veículo', 'Documentação', 4000, 'Média')
ON CONFLICT (palavra_chave) DO NOTHING;
