-- Regra de IA "vehicle_description_webmotors" (autorizada pela Adriana em 02/10/2026):
-- acrescenta restrições de conteúdo para o texto não ser ocultado na página do anúncio da Webmotors
-- (caso Audi A3 PQE7D92). Mantém o texto anterior inteiro e só acrescenta o trecho final.
-- Texto anterior (para restaurar): Escreva uma descrição curta e direta do veículo para a Webmotors. Comece pelos destaques do vendedor, depois ano, motor, câmbio e opcionais reais. Frases objetivas, sem adjetivos vazios. NÃO mencione serviços da concessionária, financiamento, informações de contato, preço ou frases como "nossa loja" ou "entre em contato".
UPDATE public.ai_prompts_config
SET prompt_text = prompt_text || $p$ Regras de conteúdo da Webmotors (texto fora delas pode ser ocultado na página do anúncio): use só texto simples, sem emojis, sem ponto de exclamação (nenhum "!"), sem repetir pontuação e sem escrever palavras em maiúsculas; não coloque telefone, WhatsApp, e-mail, site ou link; não convide a contato (por exemplo "chama no WhatsApp", "fale conosco"); não cite valores, parcelas, promoção ou desconto.$p$,
    updated_at = now()
WHERE slug = 'vehicle_description_webmotors'
  AND prompt_text NOT LIKE '%Regras de conteúdo da Webmotors%';
