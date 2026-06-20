DO $$
BEGIN
  -- articles
  DROP POLICY IF EXISTS "allow_auth_all_articles" ON public.articles;
  CREATE POLICY "allow_auth_all_articles" ON public.articles
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- pages
  DROP POLICY IF EXISTS "allow_auth_all_pages" ON public.pages;
  CREATE POLICY "allow_auth_all_pages" ON public.pages
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- article_versions
  DROP POLICY IF EXISTS "allow_auth_all_article_versions" ON public.article_versions;
  CREATE POLICY "allow_auth_all_article_versions" ON public.article_versions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- pages_versions
  DROP POLICY IF EXISTS "allow_auth_all_pages_versions" ON public.pages_versions;
  CREATE POLICY "allow_auth_all_pages_versions" ON public.pages_versions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;
