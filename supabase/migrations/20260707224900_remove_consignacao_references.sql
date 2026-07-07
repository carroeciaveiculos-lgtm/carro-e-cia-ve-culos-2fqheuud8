-- Remove all remaining "consignação" references from templates and replace with updated branding
-- Company name: "Carro e Cia Veículos" | Slogan: "Venda seu carro rápido e seguro"

-- Update mensagens_template: replace any remaining "consignação" references
UPDATE public.mensagens_template
SET conteudo = REPLACE(
  REPLACE(
    REPLACE(conteudo, 'consignação', 'venda'),
    'Consignação', 'Venda'
  ),
  'Carro e Cia Consignação', 'Carro e Cia Veículos'
)
WHERE conteudo ILIKE '%consignação%'
   OR conteudo ILIKE '%Consignação%';

UPDATE public.mensagens_template
SET titulo = REPLACE(
  REPLACE(
    REPLACE(titulo, 'consignação', 'venda'),
    'Consignação', 'Venda'
  ),
  'Carro e Cia Consignação', 'Carro e Cia Veículos'
)
WHERE titulo ILIKE '%consignação%'
   OR titulo ILIKE '%Consignação%';

-- Update whatsapp_templates: replace any remaining "consignação" references
UPDATE public.whatsapp_templates
SET corpo = REPLACE(
  REPLACE(
    REPLACE(corpo, 'consignação', 'venda'),
    'Consignação', 'Venda'
  ),
  'Carro e Cia Consignação', 'Carro e Cia Veículos'
)
WHERE corpo ILIKE '%consignação%'
   OR corpo ILIKE '%Consignação%';

UPDATE public.whatsapp_templates
SET nome = REPLACE(
  REPLACE(
    REPLACE(nome, 'consignação', 'venda'),
    'Consignação', 'Venda'
  ),
  'Carro e Cia Consignação', 'Carro e Cia Veículos'
)
WHERE nome ILIKE '%consignação%'
   OR nome ILIKE '%Consignação%';

-- Update site_configuracoes: replace "consignação" in jsonb values
UPDATE public.site_configuracoes
SET valor = REPLACE(
  REPLACE(
    REPLACE(valor::text, 'consignação', 'venda'),
    'Consignação', 'Venda'
  ),
  'Carro e Cia Consignação', 'Carro e Cia Veículos'
)::jsonb
WHERE valor::text ILIKE '%consignação%'
   OR valor::text ILIKE '%Consignação%';

-- Update site_banners: replace "consignação" in text fields
UPDATE public.site_banners
SET titulo = REPLACE(
  REPLACE(
    REPLACE(titulo, 'consignação', 'venda'),
    'Consignação', 'Venda'
  ),
  'Carro e Cia Consignação', 'Carro e Cia Veículos'
)
WHERE titulo ILIKE '%consignação%'
   OR titulo ILIKE '%Consignação%';

UPDATE public.site_banners
SET texto = REPLACE(
  REPLACE(
    REPLACE(texto, 'consignação', 'venda'),
    'Consignação', 'Venda'
  ),
  'Carro e Cia Consignação', 'Carro e Cia Veículos'
)
WHERE texto ILIKE '%consignação%'
   OR texto ILIKE '%Consignação%';

-- Update social_configuracoes: replace "consignação" in ai_system_prompt
UPDATE public.social_configuracoes
SET ai_system_prompt = REPLACE(
  REPLACE(
    REPLACE(ai_system_prompt, 'consignação', 'venda'),
    'Consignação', 'Venda'
  ),
  'Carro e Cia Consignação', 'Carro e Cia Veículos'
)
WHERE ai_system_prompt ILIKE '%consignação%'
   OR ai_system_prompt ILIKE '%Consignação%';

-- Update veiculos descriptions: replace "consignação" references
UPDATE public.veiculos
SET descricao = REPLACE(
  REPLACE(
    REPLACE(descricao, 'consignação', 'venda'),
    'Consignação', 'Venda'
  ),
  'Carro e Cia Consignação', 'Carro e Cia Veículos'
)
WHERE descricao ILIKE '%consignação%'
   OR descricao ILIKE '%Consignação%';

-- Update blog_posts: replace "consignação" in content and meta_description
UPDATE public.blog_posts
SET content = REPLACE(
  REPLACE(
    REPLACE(content, 'Carro e Cia Consignação', 'Carro e Cia Veículos'),
    'consignação', 'venda'
  ),
  'Consignação', 'Venda'
)
WHERE content ILIKE '%consignação%'
   OR content ILIKE '%Consignação%';

UPDATE public.blog_posts
SET meta_description = REPLACE(
  REPLACE(
    REPLACE(meta_description, 'Carro e Cia Consignação', 'Carro e Cia Veículos'),
    'consignação', 'venda'
  ),
  'Consignação', 'Venda'
)
WHERE meta_description ILIKE '%consignação%'
   OR meta_description ILIKE '%Consignação%';

-- Update pages: replace "consignação" in content and meta fields
UPDATE public.pages
SET conteudo = REPLACE(
  REPLACE(
    REPLACE(conteudo, 'Carro e Cia Consignação', 'Carro e Cia Veículos'),
    'consignação', 'venda'
  ),
  'Consignação', 'Venda'
)
WHERE conteudo ILIKE '%consignação%'
   OR conteudo ILIKE '%Consignação%';

UPDATE public.pages
SET meta_description = REPLACE(
  REPLACE(
    REPLACE(meta_description, 'Carro e Cia Consignação', 'Carro e Cia Veículos'),
    'consignação', 'venda'
  ),
  'Consignação', 'Venda'
)
WHERE meta_description ILIKE '%consignação%'
   OR meta_description ILIKE '%Consignação%';

-- Update articles: replace "consignação" in content and meta fields
UPDATE public.articles
SET conteudo = REPLACE(
  REPLACE(
    REPLACE(conteudo, 'Carro e Cia Consignação', 'Carro e Cia Veículos'),
    'consignação', 'venda'
  ),
  'Consignação', 'Venda'
)
WHERE conteudo ILIKE '%consignação%'
   OR conteudo ILIKE '%Consignação%';

UPDATE public.articles
SET meta_description = REPLACE(
  REPLACE(
    REPLACE(meta_description, 'Carro e Cia Consignação', 'Carro e Cia Veículos'),
    'consignação', 'venda'
  ),
  'Consignação', 'Venda'
)
WHERE meta_description ILIKE '%consignação%'
   OR meta_description ILIKE '%Consignação%';
