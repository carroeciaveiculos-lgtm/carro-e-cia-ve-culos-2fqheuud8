-- Migrate character varying to text to avoid length limits
ALTER TABLE public.articles
  ALTER COLUMN meta_description TYPE TEXT USING meta_description::TEXT,
  ALTER COLUMN resumo TYPE TEXT USING resumo::TEXT,
  ALTER COLUMN slug TYPE TEXT USING slug::TEXT,
  ALTER COLUMN titulo TYPE TEXT USING titulo::TEXT;

ALTER TABLE public.article_versions
  ALTER COLUMN meta_description TYPE TEXT USING meta_description::TEXT,
  ALTER COLUMN resumo TYPE TEXT USING resumo::TEXT,
  ALTER COLUMN slug TYPE TEXT USING slug::TEXT,
  ALTER COLUMN titulo TYPE TEXT USING titulo::TEXT;

ALTER TABLE public.pages
  ALTER COLUMN meta_description TYPE TEXT USING meta_description::TEXT;

ALTER TABLE public.pages_versions
  ALTER COLUMN meta_description TYPE TEXT USING meta_description::TEXT;

-- Seed Brain IA settings
INSERT INTO public.site_configuracoes (chave, valor)
VALUES (
  'brain_ia_settings',
  '{"base_conhecimento": "", "diretrizes_marca": "", "glossario": ""}'::jsonb
) ON CONFLICT (chave) DO NOTHING;
