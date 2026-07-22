-- Validate and sanitize image URLs in veiculos.fotos for unescaped spaces
-- Also re-checks for parentheses (idempotent with 20260722233000)
-- Ensures all URLs use safe characters (no unescaped spaces or parentheses)

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
                REPLACE(elem, ' ', '%20'),
                '(', '%28'
              ),
              ')', '%29'
            )
          )
        )
        FROM jsonb_array_elements_text(fotos) AS elem
      ),
      updated_at = NOW()
    WHERE id IN (
      SELECT v.id FROM public.veiculos v
      WHERE v.fotos IS NOT NULL
        AND jsonb_typeof(v.fotos) = 'array'
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(v.fotos) AS elem
          WHERE elem LIKE '% %' OR elem LIKE '%(%' OR elem LIKE '%)%'
        )
      LIMIT batch_size
    );

    GET DIAGNOSTICS affected = ROW_COUNT;
    EXIT WHEN affected = 0;
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;

-- Sanitize spaces and parentheses in video_url
UPDATE public.veiculos
SET video_url = REPLACE(REPLACE(REPLACE(video_url, ' ', '%20'), '(', '%28'), ')', '%29'),
    updated_at = NOW()
WHERE video_url IS NOT NULL
  AND (video_url LIKE '% %' OR video_url LIKE '%(%' OR video_url LIKE '%)%');

-- Sanitize spaces and parentheses in videos JSONB array
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
                REPLACE(elem, ' ', '%20'),
                '(', '%28'
              ),
              ')', '%29'
            )
          )
        )
        FROM jsonb_array_elements_text(videos) AS elem
      ),
      updated_at = NOW()
    WHERE id IN (
      SELECT v.id FROM public.veiculos v
      WHERE v.videos IS NOT NULL
        AND jsonb_typeof(v.videos) = 'array'
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(v.videos) AS elem
          WHERE elem LIKE '% %' OR elem LIKE '%(%' OR elem LIKE '%)%'
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
  remaining_fotos INT;
  remaining_videos INT;
  remaining_video_url INT;
BEGIN
  SELECT COUNT(*) INTO remaining_fotos
  FROM public.veiculos v
  WHERE v.fotos IS NOT NULL
    AND jsonb_typeof(v.fotos) = 'array'
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(v.fotos) AS elem
      WHERE elem LIKE '% %' OR elem LIKE '%(%' OR elem LIKE '%)%'
    );

  SELECT COUNT(*) INTO remaining_videos
  FROM public.veiculos v
  WHERE v.videos IS NOT NULL
    AND jsonb_typeof(v.videos) = 'array'
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(v.videos) AS elem
      WHERE elem LIKE '% %' OR elem LIKE '%(%' OR elem LIKE '%)%'
    );

  SELECT COUNT(*) INTO remaining_video_url
  FROM public.veiculos
  WHERE video_url IS NOT NULL
    AND (video_url LIKE '% %' OR video_url LIKE '%(%' OR video_url LIKE '%)%');

  IF remaining_fotos + remaining_videos + remaining_video_url > 0 THEN
    RAISE NOTICE 'WARNING: % fotos, % videos, % video_url still have unsafe characters', remaining_fotos, remaining_videos, remaining_video_url;
  ELSE
    RAISE NOTICE 'SUCCESS: All vehicle image/video URLs sanitized - spaces and parentheses encoded';
  END IF;
END $$;
