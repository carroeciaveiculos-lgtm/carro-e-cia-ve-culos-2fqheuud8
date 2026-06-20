DO $migration$
BEGIN
  -- Alter columns for public.articles to TEXT to support long AI-generated content
  ALTER TABLE IF EXISTS public.articles ALTER COLUMN titulo TYPE TEXT;
  ALTER TABLE IF EXISTS public.articles ALTER COLUMN slug TYPE TEXT;
  ALTER TABLE IF EXISTS public.articles ALTER COLUMN meta_title TYPE TEXT;
  ALTER TABLE IF EXISTS public.articles ALTER COLUMN h1_artigo TYPE TEXT;

  -- Alter columns for public.article_versions to maintain consistency
  ALTER TABLE IF EXISTS public.article_versions ALTER COLUMN titulo TYPE TEXT;
  ALTER TABLE IF EXISTS public.article_versions ALTER COLUMN slug TYPE TEXT;
  ALTER TABLE IF EXISTS public.article_versions ALTER COLUMN meta_title TYPE TEXT;
  ALTER TABLE IF EXISTS public.article_versions ALTER COLUMN h1_artigo TYPE TEXT;

  -- Apply the same changes to pages and pages_versions to ensure consistency
  ALTER TABLE IF EXISTS public.pages ALTER COLUMN titulo TYPE TEXT;
  ALTER TABLE IF EXISTS public.pages ALTER COLUMN slug TYPE TEXT;
  ALTER TABLE IF EXISTS public.pages ALTER COLUMN meta_title TYPE TEXT;
  ALTER TABLE IF EXISTS public.pages ALTER COLUMN h1_pagina TYPE TEXT;

  -- Alter columns for public.pages_versions
  ALTER TABLE IF EXISTS public.pages_versions ALTER COLUMN titulo TYPE TEXT;
  ALTER TABLE IF EXISTS public.pages_versions ALTER COLUMN slug TYPE TEXT;
  ALTER TABLE IF EXISTS public.pages_versions ALTER COLUMN meta_title TYPE TEXT;
  ALTER TABLE IF EXISTS public.pages_versions ALTER COLUMN h1_pagina TYPE TEXT;
END $migration$;
