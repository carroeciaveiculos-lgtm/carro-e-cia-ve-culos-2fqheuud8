-- Comprehensive removal of "consignação" from all template and config tables
-- Replaces with "venda" or appropriate alternatives

-- mensagens_template: conteudo
UPDATE public.mensagens_template
SET conteudo = REPLACE(REPLACE(REPLACE(conteudo,
  'Carro e Cia Consignação', 'Carro e Cia Veículos'),
  'consignação', 'venda'),
  'Consignação', 'Venda')
WHERE conteudo ILIKE '%consignação%' OR conteudo ILIKE '%Consignação%';

-- mensagens_template: titulo
UPDATE public.mensagens_template
SET titulo = REPLACE(REPLACE(REPLACE(titulo,
  'Carro e Cia Consignação', 'Carro e Cia Veículos'),
  'consignação', 'venda'),
  'Consignação', 'Venda')
WHERE titulo ILIKE '%consignação%' OR titulo ILIKE '%Consignação%';

-- whatsapp_templates: corpo
UPDATE public.whatsapp_templates
SET corpo = REPLACE(REPLACE(REPLACE(corpo,
  'Carro e Cia Consignação', 'Carro e Cia Veículos'),
  'consignação', 'venda'),
  'Consignação', 'Venda')
WHERE corpo ILIKE '%consignação%' OR corpo ILIKE '%Consignação%';

-- whatsapp_templates: nome
UPDATE public.whatsapp_templates
SET nome = REPLACE(REPLACE(REPLACE(nome,
  'Carro e Cia Consignação', 'Carro e Cia Veículos'),
  'consignação', 'venda'),
  'Consignação', 'Venda')
WHERE nome ILIKE '%consignação%' OR nome ILIKE '%Consignação%';

-- veiculos: descricao
UPDATE public.veiculos
SET descricao = REPLACE(REPLACE(REPLACE(descricao,
  'Carro e Cia Consignação', 'Carro e Cia Veículos'),
  'consignação', 'venda'),
  'Consignação', 'Venda')
WHERE descricao ILIKE '%consignação%' OR descricao ILIKE '%Consignação%';

-- site_banners: titulo
UPDATE public.site_banners
SET titulo = REPLACE(REPLACE(REPLACE(titulo,
  'Carro e Cia Consignação', 'Carro e Cia Veículos'),
  'consignação', 'venda'),
  'Consignação', 'Venda')
WHERE titulo ILIKE '%consignação%' OR titulo ILIKE '%Consignação%';

-- site_banners: texto
UPDATE public.site_banners
SET texto = REPLACE(REPLACE(REPLACE(texto,
  'Carro e Cia Consignação', 'Carro e Cia Veículos'),
  'consignação', 'venda'),
  'Consignação', 'Venda')
WHERE texto ILIKE '%consignação%' OR texto ILIKE '%Consignação%';

-- site_configuracoes: valor (jsonb)
UPDATE public.site_configuracoes
SET valor = REPLACE(REPLACE(REPLACE(valor::text,
  'Carro e Cia Consignação', 'Carro e Cia Veículos'),
  'consignação', 'venda'),
  'Consignação', 'Venda')::jsonb
WHERE valor::text ILIKE '%consignação%' OR valor::text ILIKE '%Consignação%';

-- social_configuracoes: ai_system_prompt
UPDATE public.social_configuracoes
SET ai_system_prompt = REPLACE(REPLACE(REPLACE(ai_system_prompt,
  'Carro e Cia Consignação', 'Carro e Cia Veículos'),
  'consignação', 'venda'),
  'Consignação', 'Venda')
WHERE ai_system_prompt ILIKE '%consignação%' OR ai_system_prompt ILIKE '%Consignação%';

-- Also update old slogan in any remaining templates
UPDATE public.mensagens_template
SET conteudo = REPLACE(conteudo,
  'Você tem um carro para vender. Nós temos os compradores.',
  'Venda seu carro rápido e seguro.')
WHERE conteudo ILIKE '%Você tem um carro para vender%';

UPDATE public.whatsapp_templates
SET corpo = REPLACE(corpo,
  'Você tem um carro para vender. Nós temos os compradores.',
  'Venda seu carro rápido e seguro.')
WHERE corpo ILIKE '%Você tem um carro para vender%';
