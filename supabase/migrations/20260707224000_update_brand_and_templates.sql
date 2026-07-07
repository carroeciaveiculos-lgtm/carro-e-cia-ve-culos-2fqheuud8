-- Update brand name "Carro e Cia Consignação" to "Carro e Cia Veículos" in all text fields

-- Update mensagens_template
UPDATE public.mensagens_template
SET conteudo = REPLACE(conteudo, 'Carro e Cia Consignação', 'Carro e Cia Veículos')
WHERE conteudo ILIKE '%Carro e Cia Consignação%';

UPDATE public.mensagens_template
SET titulo = REPLACE(titulo, 'Carro e Cia Consignação', 'Carro e Cia Veículos')
WHERE titulo ILIKE '%Carro e Cia Consignação%';

-- Update whatsapp_templates
UPDATE public.whatsapp_templates
SET corpo = REPLACE(corpo, 'Carro e Cia Consignação', 'Carro e Cia Veículos')
WHERE corpo ILIKE '%Carro e Cia Consignação%';

UPDATE public.whatsapp_templates
SET nome = REPLACE(nome, 'Carro e Cia Consignação', 'Carro e Cia Veículos')
WHERE nome ILIKE '%Carro e Cia Consignação%';

-- Update vehicle descriptions containing old brand name
UPDATE public.veiculos
SET descricao = REPLACE(descricao, 'Carro e Cia Consignação', 'Carro e Cia Veículos')
WHERE descricao ILIKE '%Carro e Cia Consignação%';

-- Update site banners
UPDATE public.site_banners
SET titulo = REPLACE(titulo, 'Carro e Cia Consignação', 'Carro e Cia Veículos')
WHERE titulo ILIKE '%Carro e Cia Consignação%';

UPDATE public.site_banners
SET texto = REPLACE(texto, 'Carro e Cia Consignação', 'Carro e Cia Veículos')
WHERE texto ILIKE '%Carro e Cia Consignação%';

-- Update site_configuracoes (jsonb fields)
UPDATE public.site_configuracoes
SET valor = REPLACE(valor::text, 'Carro e Cia Consignação', 'Carro e Cia Veículos')::jsonb
WHERE valor::text ILIKE '%Carro e Cia Consignação%';

-- Update social_configuracoes ai_system_prompt
UPDATE public.social_configuracoes
SET ai_system_prompt = REPLACE(ai_system_prompt, 'Carro e Cia Consignação', 'Carro e Cia Veículos')
WHERE ai_system_prompt ILIKE '%Carro e Cia Consignação%';

-- Update mensagens_template conteudo with old slogan
UPDATE public.mensagens_template
SET conteudo = REPLACE(conteudo, 'Você tem um carro para vender. Nós temos os compradores.', 'Venda seu carro rápido e seguro.')
WHERE conteudo ILIKE '%Você tem um carro para vender%';

-- Update whatsapp_templates corpo with old slogan
UPDATE public.whatsapp_templates
SET corpo = REPLACE(corpo, 'Você tem um carro para vender. Nós temos os compradores.', 'Venda seu carro rápido e seguro.')
WHERE corpo ILIKE '%Você tem um carro para vender%';
