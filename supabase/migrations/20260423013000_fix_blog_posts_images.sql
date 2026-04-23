DO $do$
DECLARE
  base_url TEXT := 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/fotos';
BEGIN
  -- 1. Financiamento de Veículo: Guia Completo 2026
  UPDATE public.blog_posts 
  SET image_url = base_url || '/financiamento-veiculo-guia-completo.webp'
  WHERE slug = 'financiamento-veiculo-guia-completo';

  -- 2. Empréstimo com Veículo de Garantia
  UPDATE public.blog_posts 
  SET image_url = base_url || '/emprestimo-com-garantia-veiculo.webp'
  WHERE slug = 'emprestimo-com-garantia-veiculo';

  -- 3. Empréstimo com Carro: O Que Você Precisa Saber
  UPDATE public.blog_posts 
  SET image_url = base_url || '/emprestimo-com-garantia-carro-o-que-saber.webp'
  WHERE slug = 'emprestimo-com-garantia-carro-o-que-saber';

  -- 4. Financiamento com CPF Negativado
  UPDATE public.blog_posts 
  SET image_url = base_url || '/financiamento-cpf-negativado.webp'
  WHERE slug = 'financiamento-cpf-negativado';

  -- 5. Como Vender Carro Rápido em Uberaba
  UPDATE public.blog_posts 
  SET image_url = base_url || '/como-vender-carro-rapido-uberaba.webp'
  WHERE slug = 'como-vender-carro-rapido-uberaba';

  -- 6. Consignação de Veículos: Venda Segura
  UPDATE public.blog_posts 
  SET image_url = base_url || '/consignacao-veiculos-venda-segura.webp'
  WHERE slug = 'consignacao-veiculos-venda-segura';

  -- 7. Seguro Auto Vale a Pena
  UPDATE public.blog_posts 
  SET image_url = base_url || '/seguro-auto-vale-pena.webp'
  WHERE slug = 'seguro-auto-vale-pena';

  -- 8. Revisão de Carro Antes de Vender
  UPDATE public.blog_posts 
  SET image_url = base_url || '/revisao-carro-antes-de-vender.webp'
  WHERE slug = 'revisao-carro-antes-de-vender';

  -- 9. Documentação Necessária para Vender Carro
  UPDATE public.blog_posts 
  SET image_url = base_url || '/documentacao-vender-carro.webp'
  WHERE slug = 'documentacao-vender-carro';

  -- 10. Consórcio de Carro vs Financiamento
  UPDATE public.blog_posts 
  SET image_url = base_url || '/consorcio-vs-financiamento.webp'
  WHERE slug = 'consorcio-vs-financiamento';

  -- Fix any other lingering image with the old path
  UPDATE public.blog_posts 
  SET image_url = replace(image_url, 'Fotos/Formato%20webp', 'fotos')
  WHERE image_url LIKE '%Fotos/Formato%20webp%';

END $do$;
