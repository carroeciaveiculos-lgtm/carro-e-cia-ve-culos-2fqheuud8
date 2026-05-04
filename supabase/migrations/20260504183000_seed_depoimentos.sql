DO $$
BEGIN
  -- Cria os depoimentos do Google na base de dados (idempotente)
  IF NOT EXISTS (SELECT 1 FROM public.site_depoimentos WHERE nome_cliente = 'Jair Cachapuz') THEN
    INSERT INTO public.site_depoimentos (id, nome_cliente, texto, estrelas, tipo, publicado, verificado, foto_url)
    VALUES 
      (gen_random_uuid(), 'Jair Cachapuz', '5 estrelas . Ótimo atendimento. Lugar agradabilíssimo. Ar condicionado. Cafezinho. Água gelada. Tratamento vip.', 5, 'Google', true, true, 'https://img.usecurling.com/ppl/thumbnail?seed=1&gender=male'),
      (gen_random_uuid(), 'Paulo Sérgio Dias de Abreu', 'Ótimo atendimento e boa oferta de produtos.', 5, 'Google', true, true, 'https://img.usecurling.com/ppl/thumbnail?seed=2&gender=male'),
      (gen_random_uuid(), 'rondineli oliveira', 'Ótimo lugar bem atenciosos', 5, 'Google', true, true, 'https://img.usecurling.com/ppl/thumbnail?seed=3&gender=male'),
      (gen_random_uuid(), 'LFernando', 'Atendimento excelente... veículos de boa procedência.', 5, 'Google', true, true, 'https://img.usecurling.com/ppl/thumbnail?seed=4&gender=male'),
      (gen_random_uuid(), 'Milson Q10 Sorvetes', 'Atendimento, qualidade e confiança.', 5, 'Google', true, true, 'https://img.usecurling.com/ppl/thumbnail?seed=5&gender=male'),
      (gen_random_uuid(), 'Carlucio Amaral', 'Produto de qualidade com um bom preço, atendimento vip Parabéns !!!', 5, 'Google', true, true, 'https://img.usecurling.com/ppl/thumbnail?seed=6&gender=male'),
      (gen_random_uuid(), 'Rodrigo Carvalho Gomide', 'Excelente loja, pessoal muito educado e atenciosos.', 5, 'Google', true, true, 'https://img.usecurling.com/ppl/thumbnail?seed=7&gender=male'),
      (gen_random_uuid(), 'Marlucio Macedo', 'Honestidade e bom atendimento e o forte desta casa', 5, 'Google', true, true, 'https://img.usecurling.com/ppl/thumbnail?seed=8&gender=male');
  END IF;
END $$;
