-- Setup initial site_configuracoes for branding and scripts
INSERT INTO public.site_configuracoes (chave, valor)
VALUES 
  ('branding', '{"logo_url": "", "favicon_url": "", "primary_color": "#CC0000", "secondary_color": "#1A1A1A"}'::jsonb),
  ('scripts_seo', '{"ga_id": "", "gtm_id": "", "facebook_pixel_id": "", "custom_head": "", "custom_body": ""}'::jsonb)
ON CONFLICT (chave) DO NOTHING;

-- Create table for Phase 2: Media Center (media_assets)
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for Media Center
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_media_select" ON public.media_assets;
CREATE POLICY "allow_all_media_select" ON public.media_assets 
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "allow_auth_media_all" ON public.media_assets;
CREATE POLICY "allow_auth_media_all" ON public.media_assets 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger to update updated_at for media_assets
CREATE OR REPLACE FUNCTION public.update_media_assets_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_media_assets_updated_at ON public.media_assets;
CREATE TRIGGER update_media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_media_assets_updated_at();
