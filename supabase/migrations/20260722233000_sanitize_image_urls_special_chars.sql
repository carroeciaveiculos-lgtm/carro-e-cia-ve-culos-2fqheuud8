-- Sanitize image URLs in veiculos.fotos that contain parentheses
-- Parentheses in URLs cause "Failed to fetch" errors in browsers
-- Replace ( with %28 and ) with %29 in all foto URL strings

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
                '(',
                '%28'
              ),
              ')',
              '%29'
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
          fotos::text LIKE '%(%'
          OR fotos::text LIKE '%)%'
        )
      LIMIT batch_size
    );

    GET DIAGNOSTICS affected = ROW_COUNT;
    EXIT WHEN affected = 0;
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;

-- Also sanitize video_url and qrcode_url columns if they contain parentheses
UPDATE public.veiculos
SET video_url = REPLACE(REPLACE(video_url, '(', '%28'), ')', '%29'),
    updated_at = NOW()
WHERE video_url IS NOT NULL
  AND (video_url LIKE '%(%' OR video_url LIKE '%)%');

-- Sanitize URLs in the videos JSONB array as well
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
                '(',
                '%28'
              ),
              ')',
              '%29'
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
          videos::text LIKE '%(%'
          OR videos::text LIKE '%)%'
        )
      LIMIT batch_size
    );

    GET DIAGNOSTICS affected = ROW_COUNT;
    EXIT WHEN affected = 0;
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;

-- Verification
DO $$
DECLARE
  remaining_count INT;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM public.veiculos
  WHERE fotos IS NOT NULL
    AND jsonb_typeof(fotos) = 'array'
    AND (fotos::text LIKE '%(%' OR fotos::text LIKE '%)%');
  
  IF remaining_count > 0 THEN
    RAISE NOTICE 'WARNING: % vehicles still have parentheses in fotos URLs', remaining_count;
  ELSE
    RAISE NOTICE 'SUCCESS: All vehicle foto URLs sanitized - parentheses encoded';
  END IF;
END $$;
