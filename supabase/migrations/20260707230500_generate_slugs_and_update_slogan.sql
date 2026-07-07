-- Generate slugs for existing vehicles based on Brand-Model-Year
DO $$
DECLARE
  v_record RECORD;
  v_base TEXT;
  v_slug TEXT;
  v_counter INTEGER;
BEGIN
  FOR v_record IN SELECT id, marca, modelo, ano_fabricacao FROM veiculos WHERE slug IS NULL OR slug = '' LOOP
    v_base := lower(COALESCE(v_record.marca, '') || '-' || COALESCE(v_record.modelo, '') || '-' || COALESCE(v_record.ano_fabricacao::TEXT, ''));
    v_base := translate(v_base,
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ ',
      'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC-');
    v_base := regexp_replace(v_base, '[^a-z0-9-]', '-', 'g');
    v_base := regexp_replace(v_base, '-+', '-', 'g');
    v_base := trim(both '-' from v_base);
    v_base := trim(both '-' from v_base);

    IF v_base = '' OR v_base = '-' THEN
      v_base := lower(regexp_replace(v_record.id::TEXT, '[^a-z0-9]', '-', 'g'));
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

-- Add unique index on slug (partial, only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS veiculos_slug_unique_idx ON veiculos (slug) WHERE slug IS NOT NULL;

-- Create function to auto-generate slug for new/updated vehicles
CREATE OR REPLACE FUNCTION public.generate_vehicle_slug()
RETURNS trigger AS $$
DECLARE
  v_base TEXT;
  v_slug TEXT;
  v_counter INTEGER;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    v_base := lower(COALESCE(NEW.marca, '') || '-' || COALESCE(NEW.modelo, '') || '-' || COALESCE(NEW.ano_fabricacao::TEXT, ''));
    v_base := translate(v_base,
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ ',
      'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC-');
    v_base := regexp_replace(v_base, '[^a-z0-9-]', '-', 'g');
    v_base := regexp_replace(v_base, '-+', '-', 'g');
    v_base := trim(both '-' from v_base);

    IF v_base = '' OR v_base = '-' THEN
      v_base := lower(regexp_replace(NEW.id::TEXT, '[^a-z0-9]', '-', 'g'));
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

-- Create trigger for auto-generating slugs
DROP TRIGGER IF EXISTS trigger_generate_vehicle_slug ON veiculos;
CREATE TRIGGER trigger_generate_vehicle_slug
  BEFORE INSERT OR UPDATE OF marca, modelo, ano_fabricacao ON veiculos
  FOR EACH ROW EXECUTE FUNCTION public.generate_vehicle_slug();

-- Update slogan from "Venda seu carro rápido e seguro" to "Venda ou Compre seu carro rápido e seguro"
UPDATE public.mensagens_template
SET conteudo = REPLACE(conteudo, 'Venda seu carro rápido e seguro', 'Venda ou Compre seu carro rápido e seguro')
WHERE conteudo ILIKE '%Venda seu carro rápido e seguro%';

UPDATE public.whatsapp_templates
SET corpo = REPLACE(corpo, 'Venda seu carro rápido e seguro', 'Venda ou Compre seu carro rápido e seguro')
WHERE corpo ILIKE '%Venda seu carro rápido e seguro%';

UPDATE public.site_configuracoes
SET valor = REPLACE(valor::text, 'Venda seu carro rápido e seguro', 'Venda ou Compre seu carro rápido e seguro')::jsonb
WHERE valor::text ILIKE '%Venda seu carro rápido e seguro%';

UPDATE public.pages
SET meta_description = REPLACE(meta_description, 'Venda seu carro rápido e seguro', 'Venda ou Compre seu carro rápido e seguro')
WHERE meta_description ILIKE '%Venda seu carro rápido e seguro%';

UPDATE public.blog_posts
SET meta_description = REPLACE(meta_description, 'Venda seu carro rápido e seguro', 'Venda ou Compre seu carro rápido e seguro')
WHERE meta_description ILIKE '%Venda seu carro rápido e seguro%';

UPDATE public.articles
SET meta_description = REPLACE(meta_description, 'Venda seu carro rápido e seguro', 'Venda ou Compre seu carro rápido e seguro')
WHERE meta_description ILIKE '%Venda seu carro rápido e seguro%';

UPDATE public.site_banners
SET texto = REPLACE(texto, 'Venda seu carro rápido e seguro', 'Venda ou Compre seu carro rápido e seguro')
WHERE texto ILIKE '%Venda seu carro rápido e seguro%';

-- Also update any remaining old slogan variants
UPDATE public.mensagens_template
SET conteudo = REPLACE(conteudo, 'Você tem um carro para vender. Nós temos os compradores.', 'Venda ou Compre seu carro rápido e seguro.')
WHERE conteudo ILIKE '%Você tem um carro para vender%';

UPDATE public.whatsapp_templates
SET corpo = REPLACE(corpo, 'Você tem um carro para vender. Nós temos os compradores.', 'Venda ou Compre seu carro rápido e seguro.')
WHERE corpo ILIKE '%Você tem um carro para vender%';
