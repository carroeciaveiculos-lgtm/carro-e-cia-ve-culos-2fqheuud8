-- Adicionando colunas de IA na tabela blog_posts
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS keyword TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS url_path TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS image_prompt TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS ia_confidence TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS ia_generated BOOLEAN DEFAULT false;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS requires_review BOOLEAN DEFAULT true;

-- Adicionando colunas de IA na tabela articles
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS keyword TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS url_path TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS image_prompt TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS ia_confidence TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS ia_generated BOOLEAN DEFAULT false;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS requires_review BOOLEAN DEFAULT true;

-- Adicionando colunas de IA na tabela pages
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS keyword TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS url_path TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS image_prompt TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS ia_confidence TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS ia_generated BOOLEAN DEFAULT false;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS requires_review BOOLEAN DEFAULT true;

-- Criação da tabela de Logs de IA
CREATE TABLE IF NOT EXISTS public.logs_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    acao TEXT NOT NULL,
    provider TEXT NOT NULL,
    modelo TEXT NOT NULL,
    tokens_input INTEGER,
    tokens_output INTEGER,
    status TEXT NOT NULL,
    alertas JSONB,
    certeza_reportada TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS da tabela logs_ia
ALTER TABLE public.logs_ia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_auth_all_logs_ia" ON public.logs_ia;
CREATE POLICY "allow_auth_all_logs_ia" ON public.logs_ia 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Configurando o Bucket 'imagens'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('imagens', 'imagens', true) 
ON CONFLICT (id) DO NOTHING;

-- Policies para o bucket imagens
DROP POLICY IF EXISTS "Public read access imagens" ON storage.objects;
CREATE POLICY "Public read access imagens" ON storage.objects 
  FOR SELECT USING (bucket_id = 'imagens');

DROP POLICY IF EXISTS "Auth write access imagens" ON storage.objects;
CREATE POLICY "Auth write access imagens" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'imagens');

DROP POLICY IF EXISTS "Auth update access imagens" ON storage.objects;
CREATE POLICY "Auth update access imagens" ON storage.objects 
  FOR UPDATE TO authenticated USING (bucket_id = 'imagens') WITH CHECK (bucket_id = 'imagens');

DROP POLICY IF EXISTS "Auth delete access imagens" ON storage.objects;
CREATE POLICY "Auth delete access imagens" ON storage.objects 
  FOR DELETE TO authenticated USING (bucket_id = 'imagens');
