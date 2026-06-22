DO $$
BEGIN
  -- Recreate policy for social_posts to ensure authenticated users can manage posts
  DROP POLICY IF EXISTS "allow_auth_all_social" ON public.social_posts;
  CREATE POLICY "allow_auth_all_social" ON public.social_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- Recreate policy for logs_ia to ensure authenticated users can log AI generations
  DROP POLICY IF EXISTS "allow_auth_all_logs_ia" ON public.logs_ia;
  CREATE POLICY "allow_auth_all_logs_ia" ON public.logs_ia FOR ALL TO authenticated USING (true) WITH CHECK (true);
  
  -- Increase logos-e-imagens bucket limit to 50MB (52428800 bytes) to accommodate high-quality videos/images
  UPDATE storage.buckets
  SET file_size_limit = 52428800
  WHERE id = 'logos-e-imagens';
END $$;
