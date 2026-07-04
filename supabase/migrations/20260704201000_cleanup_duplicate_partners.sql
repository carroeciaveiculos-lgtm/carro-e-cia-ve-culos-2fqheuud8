DO $$
DECLARE
  page_record RECORD;
  parsed_json jsonb;
  blocks_array jsonb;
  filtered_blocks jsonb;
  first_partners_idx int;
  i int;
  partners_count int;
BEGIN
  FOR page_record IN SELECT id, conteudo FROM public.pages WHERE slug = '/' OR slug = 'home' LOOP
    IF page_record.conteudo IS NULL THEN
      CONTINUE;
    END IF;

    BEGIN
      parsed_json := page_record.conteudo::jsonb;
      blocks_array := parsed_json->'blocks';

      IF blocks_array IS NULL OR jsonb_typeof(blocks_array) != 'array' THEN
        CONTINUE;
      END IF;

      partners_count := 0;
      first_partners_idx := -1;

      FOR i IN 0..jsonb_array_length(blocks_array) - 1 LOOP
        IF blocks_array->i->>'type' = 'partners' THEN
          IF first_partners_idx = -1 THEN
            first_partners_idx := i;
          END IF;
          partners_count := partners_count + 1;
        END IF;
      END LOOP;

      IF partners_count > 1 THEN
        filtered_blocks := '[]'::jsonb;
        FOR i IN 0..jsonb_array_length(blocks_array) - 1 LOOP
          IF blocks_array->i->>'type' = 'partners' AND i != first_partners_idx THEN
            CONTINUE;
          ELSE
            filtered_blocks := filtered_blocks || jsonb_build_array(blocks_array->i);
          END IF;
        END LOOP;

        parsed_json := jsonb_set(parsed_json, '{blocks}', filtered_blocks);
        UPDATE public.pages SET conteudo = parsed_json::text, atualizado_em = NOW() WHERE id = page_record.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;
  END LOOP;
END $$;
