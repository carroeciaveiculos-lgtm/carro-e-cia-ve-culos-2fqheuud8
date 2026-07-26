-- Migrate ALL remaining Supabase Storage public URLs to Cloudflare R2
-- Covers: veiculos (fotos, video_url, videos), media_assets (file_path),
-- site_banners (imagem_url), and any other table with Supabase Storage URLs
-- Also covers the render/image path variant

-- ============================================================
-- 1. veiculos.fotos (JSONB array of strings)
-- ============================================================
DO $$
DECLARE
  batch_size INT := 500;
  affected INT;
BEGIN
  LOOP
    UPDATE public.veiculos
    SET
      fotos = (
        SELECT jsonb_agg(
          to_jsonb(
            REPLACE(
              REPLACE(
                elem,
                'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
                'https://imagens.carroeciamotors.com.br/'
              ),
              'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
              'https://imagens.carroeciamotors.com.br/'
            )
          )
        )
        FROM jsonb_array_elements_text(fotos) AS elem
      ),
      updated_at = NOW()
    WHERE id IN (
      SELECT id FROM public.veiculos
      WHERE fotos IS NOT NULL
        AND jsonb_typeof(fotos) = 'array'
        AND (
          fotos::text LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
          OR fotos::text LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
        )
      LIMIT batch_size
    );
    GET DIAGNOSTICS affected = ROW_COUNT;
    EXIT WHEN affected = 0;
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;

-- ============================================================
-- 2. veiculos.video_url (TEXT)
-- ============================================================
UPDATE public.veiculos
SET video_url = REPLACE(
    REPLACE(
      video_url,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  ),
  updated_at = NOW()
WHERE video_url IS NOT NULL
  AND (
    video_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR video_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

-- ============================================================
-- 3. veiculos.videos (JSONB array of strings)
-- ============================================================
DO $$
DECLARE
  batch_size INT := 500;
  affected INT;
BEGIN
  LOOP
    UPDATE public.veiculos
    SET
      videos = (
        SELECT jsonb_agg(
          to_jsonb(
            REPLACE(
              REPLACE(
                elem,
                'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
                'https://imagens.carroeciamotors.com.br/'
              ),
              'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
              'https://imagens.carroeciamotors.com.br/'
            )
          )
        )
        FROM jsonb_array_elements_text(videos) AS elem
      ),
      updated_at = NOW()
    WHERE id IN (
      SELECT id FROM public.veiculos
      WHERE videos IS NOT NULL
        AND jsonb_typeof(videos) = 'array'
        AND (
          videos::text LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
          OR videos::text LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
        )
      LIMIT batch_size
    );
    GET DIAGNOSTICS affected = ROW_COUNT;
    EXIT WHEN affected = 0;
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;

-- ============================================================
-- 4. media_assets.file_path (TEXT)
-- ============================================================
UPDATE public.media_assets
SET file_path = REPLACE(
    REPLACE(
      file_path,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  ),
  updated_at = NOW()
WHERE file_path IS NOT NULL
  AND (
    file_path LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR file_path LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

-- ============================================================
-- 5. site_banners.imagem_url (TEXT)
-- ============================================================
UPDATE public.site_banners
SET imagem_url = REPLACE(
    REPLACE(
      imagem_url,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  )
WHERE imagem_url IS NOT NULL
  AND (
    imagem_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR imagem_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

-- ============================================================
-- 6. financeiras.logo_url (TEXT)
-- ============================================================
UPDATE public.financeiras
SET logo_url = REPLACE(
    REPLACE(
      logo_url,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  )
WHERE logo_url IS NOT NULL
  AND (
    logo_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR logo_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

-- ============================================================
-- 7. site_depoimentos.foto_url (TEXT)
-- ============================================================
UPDATE public.site_depoimentos
SET foto_url = REPLACE(
    REPLACE(
      foto_url,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  )
WHERE foto_url IS NOT NULL
  AND (
    foto_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR foto_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

-- ============================================================
-- 8. usuarios.foto_url (TEXT)
-- ============================================================
UPDATE public.usuarios
SET foto_url = REPLACE(
    REPLACE(
      foto_url,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  )
WHERE foto_url IS NOT NULL
  AND (
    foto_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR foto_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

-- ============================================================
-- 9. blog_posts.image_url (TEXT)
-- ============================================================
UPDATE public.blog_posts
SET image_url = REPLACE(
    REPLACE(
      image_url,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  )
WHERE image_url IS NOT NULL
  AND (
    image_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR image_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

-- ============================================================
-- 10. articles.imagem_destaque_url (TEXT)
-- ============================================================
UPDATE public.articles
SET imagem_destaque_url = REPLACE(
    REPLACE(
      imagem_destaque_url,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  )
WHERE imagem_destaque_url IS NOT NULL
  AND (
    imagem_destaque_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR imagem_destaque_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

-- ============================================================
-- 11. articles.og_image_url (TEXT)
-- ============================================================
UPDATE public.articles
SET og_image_url = REPLACE(
    REPLACE(
      og_image_url,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  )
WHERE og_image_url IS NOT NULL
  AND (
    og_image_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR og_image_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

-- ============================================================
-- 12. pages.imagem_destaque_url (TEXT)
-- ============================================================
UPDATE public.pages
SET imagem_destaque_url = REPLACE(
    REPLACE(
      imagem_destaque_url,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  ),
  atualizado_em = NOW()
WHERE imagem_destaque_url IS NOT NULL
  AND (
    imagem_destaque_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR imagem_destaque_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

-- ============================================================
-- 13. pages.og_image_url (TEXT)
-- ============================================================
UPDATE public.pages
SET og_image_url = REPLACE(
    REPLACE(
      og_image_url,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  ),
  atualizado_em = NOW()
WHERE og_image_url IS NOT NULL
  AND (
    og_image_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR og_image_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

-- ============================================================
-- 14. social_posts.imagem (TEXT)
-- ============================================================
UPDATE public.social_posts
SET imagem = REPLACE(
    REPLACE(
      imagem,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  )
WHERE imagem IS NOT NULL
  AND (
    imagem LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR imagem LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

-- ============================================================
-- 15. contratos_consignacao.pdf_url / pdf_assinado_url (TEXT)
-- ============================================================
UPDATE public.contratos_consignacao
SET pdf_url = REPLACE(
    REPLACE(
      pdf_url,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  )
WHERE pdf_url IS NOT NULL
  AND (
    pdf_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR pdf_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

UPDATE public.contratos_consignacao
SET pdf_assinado_url = REPLACE(
    REPLACE(
      pdf_assinado_url,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  )
WHERE pdf_assinado_url IS NOT NULL
  AND (
    pdf_assinado_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR pdf_assinado_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

-- ============================================================
-- 16. documentos.url_documento (TEXT)
-- ============================================================
UPDATE public.documentos
SET url_documento = REPLACE(
    REPLACE(
      url_documento,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  )
WHERE url_documento IS NOT NULL
  AND (
    url_documento LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR url_documento LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

-- ============================================================
-- 17. despesas.comprovante_url (TEXT)
-- ============================================================
UPDATE public.despesas
SET comprovante_url = REPLACE(
    REPLACE(
      comprovante_url,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  )
WHERE comprovante_url IS NOT NULL
  AND (
    comprovante_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR comprovante_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

-- ============================================================
-- 18. notas_fiscais.pdf_url (TEXT)
-- ============================================================
UPDATE public.notas_fiscais
SET pdf_url = REPLACE(
    REPLACE(
      pdf_url,
      'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
      'https://imagens.carroeciamotors.com.br/'
    ),
    'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
    'https://imagens.carroeciamotors.com.br/'
  )
WHERE pdf_url IS NOT NULL
  AND (
    pdf_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
    OR pdf_url LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
  );

-- ============================================================
-- VERIFICATION
-- ============================================================
DO $$
DECLARE
  remaining_count INT;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM public.veiculos
  WHERE fotos IS NOT NULL
    AND jsonb_typeof(fotos) = 'array'
    AND (
      fotos::text LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/%'
      OR fotos::text LIKE '%htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/%'
    );

  IF remaining_count > 0 THEN
    RAISE NOTICE 'WARNING: % vehicles still have old Supabase Storage URLs in fotos', remaining_count;
  ELSE
    RAISE NOTICE 'SUCCESS: All vehicle foto URLs migrated to R2';
  END IF;
END $$;
