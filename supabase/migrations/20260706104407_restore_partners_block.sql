DO $$
DECLARE
  page_record RECORD;
  parsed_json jsonb;
  blocks_array jsonb;
  has_partners boolean;
  partners_block jsonb;
  insert_idx int;
  i int;
  features_idx int;
BEGIN
  -- Restore the partners block in the home page content JSON (pages table)
  FOR page_record IN SELECT id, conteudo FROM public.pages WHERE slug = '/' OR slug = 'home' LOOP
    IF page_record.conteudo IS NULL THEN
      CONTINUE;
    END IF;

    BEGIN
      parsed_json := page_record.conteudo::jsonb;
      blocks_array := parsed_json->'blocks';

      IF blocks_array IS NULL OR jsonb_typeof(blocks_array) != 'array' THEN
        -- If conteudo has no blocks array, create one with the partners block included
        parsed_json := jsonb_build_object(
          'blocks',
          jsonb_build_array(
            jsonb_build_object('type', 'home-hero'),
            jsonb_build_object('type', 'home-info'),
            jsonb_build_object('type', 'home-features'),
            jsonb_build_object('type', 'partners'),
            jsonb_build_object('type', 'home-social'),
            jsonb_build_object('type', 'home-faq')
          )
        );
        UPDATE public.pages SET conteudo = parsed_json::text, atualizado_em = NOW() WHERE id = page_record.id;
        CONTINUE;
      END IF;

      -- Check if partners block already exists
      has_partners := false;
      FOR i IN 0..jsonb_array_length(blocks_array) - 1 LOOP
        IF blocks_array->i->>'type' = 'partners' THEN
          has_partners := true;
          EXIT;
        END IF;
      END LOOP;

      IF NOT has_partners THEN
        -- Find the index of home-features block to insert partners after it
        features_idx := -1;
        FOR i IN 0..jsonb_array_length(blocks_array) - 1 LOOP
          IF blocks_array->i->>'type' = 'home-features' THEN
            features_idx := i;
            EXIT;
          END IF;
        END LOOP;

        partners_block := jsonb_build_object('type', 'partners');

        -- Build new blocks array with partners inserted after home-features (or at end if not found)
        DECLARE
          new_blocks jsonb := '[]'::jsonb;
        BEGIN
          FOR i IN 0..jsonb_array_length(blocks_array) - 1 LOOP
            new_blocks := new_blocks || jsonb_build_array(blocks_array->i);
            IF i = features_idx THEN
              new_blocks := new_blocks || jsonb_build_array(partners_block);
            END IF;
          END LOOP;

          -- If home-features was not found, append partners at the end
          IF features_idx = -1 THEN
            new_blocks := new_blocks || jsonb_build_array(partners_block);
          END IF;

          parsed_json := jsonb_set(parsed_json, '{blocks}', new_blocks);
          UPDATE public.pages SET conteudo = parsed_json::text, atualizado_em = NOW() WHERE id = page_record.id;
        END;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;
  END LOOP;
END $$;
