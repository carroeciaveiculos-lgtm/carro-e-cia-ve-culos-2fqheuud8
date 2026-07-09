CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.slugify(input_text text)
RETURNS text AS $$
BEGIN
  RETURN trim(both '-' from
    regexp_replace(
      regexp_replace(
        lower(unaccent(input_text)),
        '[^a-z0-9]+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.generate_vehicle_slug()
RETURNS trigger AS $$
DECLARE
  v_base text;
  v_slug text;
  v_counter integer;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    v_base := slugify(
      COALESCE(NEW.marca, '') || '-' ||
      COALESCE(NEW.modelo, '') || '-' ||
      COALESCE(NEW.versao, '') || '-' ||
      COALESCE(NEW.ano_modelo::text, '')
    );

    IF v_base = '' OR v_base = '-' THEN
      v_base := lower(regexp_replace(NEW.id::text, '[^a-z0-9]', '-', 'g'));
    END IF;

    v_slug := v_base;
    v_counter := 0;

    WHILE EXISTS (SELECT 1 FROM veiculos WHERE slug = v_slug AND id != NEW.id) LOOP
      v_counter := v_counter + 1;
      v_slug := v_base || '-' || v_counter;
    END LOOP;

    NEW.slug := v_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_vehicle_slug ON veiculos;
CREATE TRIGGER trigger_generate_vehicle_slug
  BEFORE INSERT OR UPDATE OF marca, modelo, versao, ano_modelo ON veiculos
  FOR EACH ROW EXECUTE FUNCTION public.generate_vehicle_slug();

DO $$
DECLARE
  v_record RECORD;
  v_base text;
  v_slug text;
  v_counter integer;
BEGIN
  FOR v_record IN
    SELECT id, marca, modelo, versao, ano_modelo
    FROM veiculos
    WHERE slug IS NULL OR slug = ''
  LOOP
    v_base := slugify(
      COALESCE(v_record.marca, '') || '-' ||
      COALESCE(v_record.modelo, '') || '-' ||
      COALESCE(v_record.versao, '') || '-' ||
      COALESCE(v_record.ano_modelo::text, '')
    );

    IF v_base = '' OR v_base = '-' THEN
      v_base := lower(regexp_replace(v_record.id::text, '[^a-z0-9]', '-', 'g'));
    END IF;

    v_slug := v_base;
    v_counter := 0;

    WHILE EXISTS (SELECT 1 FROM veiculos WHERE slug = v_slug AND id != v_record.id) LOOP
      v_counter := v_counter + 1;
      v_slug := v_base || '-' || v_counter;
    END LOOP;

    UPDATE veiculos SET slug = v_slug WHERE id = v_record.id;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.notify_vehicle_sold_capi()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'Vendido' AND (OLD.status IS DISTINCT FROM 'Vendido') THEN
    PERFORM net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/meta-capi-postback',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'vehicle_id', NEW.id,
        'marca', NEW.marca,
        'modelo', NEW.modelo,
        'versao', NEW.versao,
        'ano_modelo', NEW.ano_modelo,
        'preco_venda', NEW.preco_venda,
        'status', NEW.status,
        'slug', NEW.slug
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_vehicle_sold ON veiculos;
CREATE TRIGGER trigger_notify_vehicle_sold
  AFTER INSERT OR UPDATE OF status ON veiculos
  FOR EACH ROW EXECUTE FUNCTION public.notify_vehicle_sold_capi();
