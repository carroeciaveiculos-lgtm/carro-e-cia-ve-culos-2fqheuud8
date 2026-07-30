CREATE TABLE IF NOT EXISTS public.r2_migration_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(bucket, file_path)
);

CREATE INDEX IF NOT EXISTS idx_r2_progress_bucket ON public.r2_migration_progress(bucket);
CREATE INDEX IF NOT EXISTS idx_r2_progress_status ON public.r2_migration_progress(status);

ALTER TABLE public.r2_migration_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "r2_progress_auth_all" ON public.r2_migration_progress;
CREATE POLICY "r2_progress_auth_all" ON public.r2_migration_progress
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "r2_progress_service_all" ON public.r2_migration_progress;
CREATE POLICY "r2_progress_service_all" ON public.r2_migration_progress
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.system_directives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_directives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "directives_auth_all" ON public.system_directives;
CREATE POLICY "directives_auth_all" ON public.system_directives
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_directive_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_directive_timestamp ON public.system_directives;
CREATE TRIGGER trigger_directive_timestamp
  BEFORE UPDATE ON public.system_directives
  FOR EACH ROW EXECUTE FUNCTION public.update_directive_timestamp();

CREATE OR REPLACE FUNCTION public.replace_storage_url(p_bucket TEXT, p_file_path TEXT)
RETURNS void AS $$
DECLARE
  v_old_1 TEXT;
  v_old_2 TEXT;
  v_new TEXT;
BEGIN
  v_old_1 := 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/' || p_bucket || '/' || p_file_path;
  v_old_2 := 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/' || p_bucket || '/' || p_file_path;
  v_new := 'https://imagens.carroeciamotors.com.br/' || p_bucket || '/' || p_file_path;

  UPDATE public.veiculos SET video_url = REPLACE(REPLACE(video_url, v_old_1, v_new), v_old_2, v_new) WHERE video_url IS NOT NULL AND (video_url LIKE '%' || v_old_1 || '%' OR video_url LIKE '%' || v_old_2 || '%');
  UPDATE public.veiculos SET qrcode_url = REPLACE(REPLACE(qrcode_url, v_old_1, v_new), v_old_2, v_new) WHERE qrcode_url IS NOT NULL AND (qrcode_url LIKE '%' || v_old_1 || '%' OR qrcode_url LIKE '%' || v_old_2 || '%');
  UPDATE public.veiculos SET fotos = REPLACE(REPLACE(fotos::text, v_old_1, v_new), v_old_2, v_new)::jsonb WHERE fotos IS NOT NULL AND (fotos::text LIKE '%' || v_old_1 || '%' OR fotos::text LIKE '%' || v_old_2 || '%');
  UPDATE public.veiculos SET videos = REPLACE(REPLACE(videos::text, v_old_1, v_new), v_old_2, v_new)::jsonb WHERE videos IS NOT NULL AND (videos::text LIKE '%' || v_old_1 || '%' OR videos::text LIKE '%' || v_old_2 || '%');
  UPDATE public.site_banners SET imagem_url = REPLACE(REPLACE(imagem_url, v_old_1, v_new), v_old_2, v_new) WHERE imagem_url IS NOT NULL AND (imagem_url LIKE '%' || v_old_1 || '%' OR imagem_url LIKE '%' || v_old_2 || '%');
  UPDATE public.media_assets SET file_path = REPLACE(REPLACE(file_path, v_old_1, v_new), v_old_2, v_new) WHERE file_path IS NOT NULL AND (file_path LIKE '%' || v_old_1 || '%' OR file_path LIKE '%' || v_old_2 || '%');
  UPDATE public.usuarios SET foto_url = REPLACE(REPLACE(foto_url, v_old_1, v_new), v_old_2, v_new) WHERE foto_url IS NOT NULL AND (foto_url LIKE '%' || v_old_1 || '%' OR foto_url LIKE '%' || v_old_2 || '%');
  UPDATE public.blog_posts SET image_url = REPLACE(REPLACE(image_url, v_old_1, v_new), v_old_2, v_new) WHERE image_url IS NOT NULL AND (image_url LIKE '%' || v_old_1 || '%' OR image_url LIKE '%' || v_old_2 || '%');
  UPDATE public.articles SET imagem_destaque_url = REPLACE(REPLACE(imagem_destaque_url, v_old_1, v_new), v_old_2, v_new) WHERE imagem_destaque_url IS NOT NULL AND (imagem_destaque_url LIKE '%' || v_old_1 || '%' OR imagem_destaque_url LIKE '%' || v_old_2 || '%');
  UPDATE public.articles SET og_image_url = REPLACE(REPLACE(og_image_url, v_old_1, v_new), v_old_2, v_new) WHERE og_image_url IS NOT NULL AND (og_image_url LIKE '%' || v_old_1 || '%' OR og_image_url LIKE '%' || v_old_2 || '%');
  UPDATE public.pages SET imagem_destaque_url = REPLACE(REPLACE(imagem_destaque_url, v_old_1, v_new), v_old_2, v_new), atualizado_em = NOW() WHERE imagem_destaque_url IS NOT NULL AND (imagem_destaque_url LIKE '%' || v_old_1 || '%' OR imagem_destaque_url LIKE '%' || v_old_2 || '%');
  UPDATE public.pages SET og_image_url = REPLACE(REPLACE(og_image_url, v_old_1, v_new), v_old_2, v_new), atualizado_em = NOW() WHERE og_image_url IS NOT NULL AND (og_image_url LIKE '%' || v_old_1 || '%' OR og_image_url LIKE '%' || v_old_2 || '%');
  UPDATE public.social_posts SET imagem = REPLACE(REPLACE(imagem, v_old_1, v_new), v_old_2, v_new) WHERE imagem IS NOT NULL AND (imagem LIKE '%' || v_old_1 || '%' OR imagem LIKE '%' || v_old_2 || '%');
  UPDATE public.contratos_consignacao SET pdf_url = REPLACE(REPLACE(pdf_url, v_old_1, v_new), v_old_2, v_new) WHERE pdf_url IS NOT NULL AND (pdf_url LIKE '%' || v_old_1 || '%' OR pdf_url LIKE '%' || v_old_2 || '%');
  UPDATE public.contratos_consignacao SET pdf_assinado_url = REPLACE(REPLACE(pdf_assinado_url, v_old_1, v_new), v_old_2, v_new) WHERE pdf_assinado_url IS NOT NULL AND (pdf_assinado_url LIKE '%' || v_old_1 || '%' OR pdf_assinado_url LIKE '%' || v_old_2 || '%');
  UPDATE public.documentos SET url_documento = REPLACE(REPLACE(url_documento, v_old_1, v_new), v_old_2, v_new) WHERE url_documento IS NOT NULL AND (url_documento LIKE '%' || v_old_1 || '%' OR url_documento LIKE '%' || v_old_2 || '%');
  UPDATE public.despesas SET comprovante_url = REPLACE(REPLACE(comprovante_url, v_old_1, v_new), v_old_2, v_new) WHERE comprovante_url IS NOT NULL AND (comprovante_url LIKE '%' || v_old_1 || '%' OR comprovante_url LIKE '%' || v_old_2 || '%');
  UPDATE public.notas_fiscais SET pdf_url = REPLACE(REPLACE(pdf_url, v_old_1, v_new), v_old_2, v_new) WHERE pdf_url IS NOT NULL AND (pdf_url LIKE '%' || v_old_1 || '%' OR pdf_url LIKE '%' || v_old_2 || '%');
  UPDATE public.site_depoimentos SET foto_url = REPLACE(REPLACE(foto_url, v_old_1, v_new), v_old_2, v_new) WHERE foto_url IS NOT NULL AND (foto_url LIKE '%' || v_old_1 || '%' OR foto_url LIKE '%' || v_old_2 || '%');
  UPDATE public.financeiras SET logo_url = REPLACE(REPLACE(logo_url, v_old_1, v_new), v_old_2, v_new) WHERE logo_url IS NOT NULL AND (logo_url LIKE '%' || v_old_1 || '%' OR logo_url LIKE '%' || v_old_2 || '%');
  UPDATE public.landing_pages SET content = REPLACE(REPLACE(content::text, v_old_1, v_new), v_old_2, v_new)::jsonb WHERE content IS NOT NULL AND (content::text LIKE '%' || v_old_1 || '%' OR content::text LIKE '%' || v_old_2 || '%');
  UPDATE public.site_configuracoes SET valor = REPLACE(REPLACE(valor::text, v_old_1, v_new), v_old_2, v_new)::jsonb WHERE valor IS NOT NULL AND (valor::text LIKE '%' || v_old_1 || '%' OR valor::text LIKE '%' || v_old_2 || '%');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

INSERT INTO public.site_configuracoes (chave, valor)
VALUES ('auto_migrate_secret', to_jsonb('CHANGE_ME'::text))
ON CONFLICT (chave) DO NOTHING;

DO $$
BEGIN
  PERFORM cron.unschedule('migrar-storage-r2');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('auto-migrate-r2-every-30min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.schedule(
    'auto-migrate-r2-every-30min',
    '*/30 * * * *',
    $cron$SELECT net.http_get(url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/auto-migrate-r2?secret=' || (SELECT valor #>> '{}' FROM public.site_configuracoes WHERE chave = 'auto_migrate_secret'), headers := '{"Content-Type": "application/json"}'::jsonb)$cron$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not schedule cron job: %', SQLERRM;
END $$;
