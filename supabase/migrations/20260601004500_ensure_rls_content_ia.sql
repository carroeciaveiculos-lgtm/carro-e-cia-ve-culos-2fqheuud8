DO $$
BEGIN
  -- ensure policies exist for articles
  DROP POLICY IF EXISTS "allow_auth_all_articles" ON public.articles;
  CREATE POLICY "allow_auth_all_articles" ON public.articles FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- ensure policies exist for pages
  DROP POLICY IF EXISTS "allow_auth_all_pages" ON public.pages;
  CREATE POLICY "allow_auth_all_pages" ON public.pages FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- ensure policies exist for landing_pages
  DROP POLICY IF EXISTS "allow_auth_all_lps" ON public.landing_pages;
  CREATE POLICY "allow_auth_all_lps" ON public.landing_pages FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- ensure policies exist for logs_ia
  DROP POLICY IF EXISTS "allow_auth_all_logs_ia" ON public.logs_ia;
  CREATE POLICY "allow_auth_all_logs_ia" ON public.logs_ia FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;
