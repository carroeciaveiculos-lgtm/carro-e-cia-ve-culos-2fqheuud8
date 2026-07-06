DO $$
DECLARE
  page_record RECORD;
  parsed_json jsonb;
  blocks_array jsonb;
  filtered_blocks jsonb;
  i int;
  has_partners boolean;
BEGIN
  -- Remove partners blocks from pages table (home page and any other page that has them)
  FOR page_record IN SELECT id, conteudo FROM public.pages WHERE conteudo IS NOT NULL LOOP
    BEGIN
      parsed_json := page_record.conteudo::jsonb;
      blocks_array := parsed_json->'blocks';

      IF blocks_array IS NULL OR jsonb_typeof(blocks_array) != 'array' THEN
        CONTINUE;
      END IF;

      has_partners := false;
      FOR i IN 0..jsonb_array_length(blocks_array) - 1 LOOP
        IF blocks_array->i->>'type' = 'partners' THEN
          has_partners := true;
          EXIT;
        END IF;
      END LOOP;

      IF has_partners THEN
        filtered_blocks := '[]'::jsonb;
        FOR i IN 0..jsonb_array_length(blocks_array) - 1 LOOP
          IF blocks_array->i->>'type' != 'partners' THEN
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

  -- Also clean landing_pages table if it has partners blocks in content
  FOR page_record IN SELECT id, content FROM public.landing_pages WHERE content IS NOT NULL LOOP
    BEGIN
      parsed_json := page_record.content::jsonb;

      IF jsonb_typeof(parsed_json) = 'object' THEN
        blocks_array := parsed_json->'blocks';
      ELSIF jsonb_typeof(parsed_json) = 'array' THEN
        blocks_array := parsed_json;
      ELSE
        CONTINUE;
      END IF;

      IF blocks_array IS NULL OR jsonb_typeof(blocks_array) != 'array' THEN
        CONTINUE;
      END IF;

      has_partners := false;
      FOR i IN 0..jsonb_array_length(blocks_array) - 1 LOOP
        IF blocks_array->i->>'type' = 'partners' THEN
          has_partners := true;
          EXIT;
        END IF;
      END LOOP;

      IF has_partners THEN
        filtered_blocks := '[]'::jsonb;
        FOR i IN 0..jsonb_array_length(blocks_array) - 1 LOOP
          IF blocks_array->i->>'type' != 'partners' THEN
            filtered_blocks := filtered_blocks || jsonb_build_array(blocks_array->i);
          END IF;
        END LOOP;

        IF jsonb_typeof(parsed_json) = 'object' THEN
          parsed_json := jsonb_set(parsed_json, '{blocks}', filtered_blocks);
          UPDATE public.landing_pages SET content = parsed_json, updated_at = NOW() WHERE id = page_record.id;
        ELSE
          UPDATE public.landing_pages SET content = filtered_blocks, updated_at = NOW() WHERE id = page_record.id;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;
  END LOOP;

  -- Clean site_configuracoes if partners section exists in any config value
  FOR page_record IN SELECT id, chave, valor FROM public.site_configuracoes WHERE valor IS NOT NULL LOOP
    BEGIN
      parsed_json := page_record.valor::jsonb;

      IF jsonb_typeof(parsed_json) = 'object' AND parsed_json ? 'blocks' THEN
        blocks_array := parsed_json->'blocks';

        IF blocks_array IS NULL OR jsonb_typeof(blocks_array) != 'array' THEN
          CONTINUE;
        END IF;

        has_partners := false;
        FOR i IN 0..jsonb_array_length(blocks_array) - 1 LOOP
          IF blocks_array->i->>'type' = 'partners' THEN
            has_partners := true;
            EXIT;
          END IF;
        END LOOP;

        IF has_partners THEN
          filtered_blocks := '[]'::jsonb;
          FOR i IN 0..jsonb_array_length(blocks_array) - 1 LOOP
            IF blocks_array->i->>'type' != 'partners' THEN
              filtered_blocks := filtered_blocks || jsonb_build_array(blocks_array->i);
            END IF;
          END LOOP;

          parsed_json := jsonb_set(parsed_json, '{blocks}', filtered_blocks);
          UPDATE public.site_configuracoes SET valor = parsed_json, updated_at = NOW() WHERE id = page_record.id;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;
  END LOOP;
END $$;
