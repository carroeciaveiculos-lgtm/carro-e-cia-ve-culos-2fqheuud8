-- Migrate vehicle image URLs from Supabase Storage to Cloudflare R2
-- Replaces Supabase Storage public URL base with R2 custom domain
-- in the fotos JSONB array of the veiculos table

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
            split_part(
              REPLACE(
                REPLACE(
                  elem,
                  'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/render/image/public/',
                  'https://imagens.carroeciamotors.com.br/'
                ),
                'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/',
                'https://imagens.carroeciamotors.com.br/'
              ),
              '?',
              1
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

-- Verification: check for remaining old URLs
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
    RAISE NOTICE 'WARNING: % vehicles still have old Supabase Storage URLs', remaining_count;
  ELSE
    RAISE NOTICE 'SUCCESS: All vehicle image URLs migrated to R2 custom domain';
  END IF;
END $$;
