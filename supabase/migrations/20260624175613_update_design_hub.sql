-- Ensure RLS is enabled for design and administrative tables
ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_depoimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Policies for site_banners
DROP POLICY IF EXISTS "allow_auth_all_site_banners" ON public.site_banners;
CREATE POLICY "allow_auth_all_site_banners" ON public.site_banners
  FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "allow_anon_read_site_banners" ON public.site_banners;
CREATE POLICY "allow_anon_read_site_banners" ON public.site_banners
  FOR SELECT TO anon USING (ativo = true);

-- Policies for site_depoimentos
DROP POLICY IF EXISTS "allow_auth_all_site_depoimentos" ON public.site_depoimentos;
CREATE POLICY "allow_auth_all_site_depoimentos" ON public.site_depoimentos
  FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "allow_anon_read_site_depoimentos" ON public.site_depoimentos;
CREATE POLICY "allow_anon_read_site_depoimentos" ON public.site_depoimentos
  FOR SELECT TO anon USING (publicado = true);

-- Policies for documentos
DROP POLICY IF EXISTS "allow_auth_all_documentos" ON public.documentos;
CREATE POLICY "allow_auth_all_documentos" ON public.documentos
  FOR ALL TO authenticated USING (true);

-- Create storage bucket for site-assets if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for site-assets
DROP POLICY IF EXISTS "Public Access site-assets" ON storage.objects;
CREATE POLICY "Public Access site-assets" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Auth Upload site-assets" ON storage.objects;
CREATE POLICY "Auth Upload site-assets" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Auth Update site-assets" ON storage.objects;
CREATE POLICY "Auth Update site-assets" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Auth Delete site-assets" ON storage.objects;
CREATE POLICY "Auth Delete site-assets" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'site-assets');
