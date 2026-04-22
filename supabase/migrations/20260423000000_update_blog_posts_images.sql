DO $$
DECLARE
  base_url TEXT := 'https://htpcqdbhktmvppfemnad.supabase.co/storage/v1/object/public/logos-e-imagens/Fotos/Formato%20webp';
BEGIN
  -- 1. Financiamento de Veículo: Guia Completo 2026
  IF EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = 'financiamento-veiculo-guia-completo') THEN
    UPDATE public.blog_posts 
    SET image_url = base_url || '/financiamento-veiculo-guia-completo.webp'
    WHERE slug = 'financiamento-veiculo-guia-completo';
  ELSE
    INSERT INTO public.blog_posts (title, slug, content, image_url, category, published)
    VALUES ('Financiamento de Veículo: Guia Completo 2026', 'financiamento-veiculo-guia-completo', '<p>Guia completo sobre financiamento de veículos...</p>', base_url || '/financiamento-veiculo-guia-completo.webp', 'Financiamento', true);
  END IF;

  -- 2. Empréstimo com Veículo de Garantia
  IF EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = 'emprestimo-com-garantia-veiculo') THEN
    UPDATE public.blog_posts 
    SET image_url = base_url || '/emprestimo-com-garantia-veiculo.webp'
    WHERE slug = 'emprestimo-com-garantia-veiculo';
  ELSE
    INSERT INTO public.blog_posts (title, slug, content, image_url, category, published)
    VALUES ('Empréstimo com Veículo de Garantia', 'emprestimo-com-garantia-veiculo', '<p>Tudo sobre empréstimo com garantia de veículo...</p>', base_url || '/emprestimo-com-garantia-veiculo.webp', 'Empréstimo', true);
  END IF;

  -- 3. Empréstimo com Carro: O Que Você Precisa Saber
  IF EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = 'emprestimo-com-garantia-carro-o-que-saber') THEN
    UPDATE public.blog_posts 
    SET image_url = base_url || '/emprestimo-com-garantia-carro-o-que-saber.webp'
    WHERE slug = 'emprestimo-com-garantia-carro-o-que-saber';
  ELSE
    INSERT INTO public.blog_posts (title, slug, content, image_url, category, published)
    VALUES ('Empréstimo com Carro: O Que Você Precisa Saber', 'emprestimo-com-garantia-carro-o-que-saber', '<p>O que você precisa saber sobre empréstimo com garantia de carro...</p>', base_url || '/emprestimo-com-garantia-carro-o-que-saber.webp', 'Empréstimo', true);
  END IF;

  -- 4. Financiamento com CPF Negativado
  IF EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = 'financiamento-cpf-negativado') THEN
    UPDATE public.blog_posts 
    SET image_url = base_url || '/financiamento-cpf-negativado.webp'
    WHERE slug = 'financiamento-cpf-negativado';
  ELSE
    INSERT INTO public.blog_posts (title, slug, content, image_url, category, published)
    VALUES ('Financiamento com CPF Negativado', 'financiamento-cpf-negativado', '<p>Como financiar um carro com CPF negativado...</p>', base_url || '/financiamento-cpf-negativado.webp', 'Financiamento', true);
  END IF;

  -- 5. Como Vender Carro Rápido em Uberaba
  IF EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = 'como-vender-carro-rapido-uberaba') THEN
    UPDATE public.blog_posts 
    SET image_url = base_url || '/como-vender-carro-rapido-uberaba.webp'
    WHERE slug = 'como-vender-carro-rapido-uberaba';
  ELSE
    INSERT INTO public.blog_posts (title, slug, content, image_url, category, published)
    VALUES ('Como Vender Carro Rápido em Uberaba', 'como-vender-carro-rapido-uberaba', '<p>Dicas para vender seu carro rapidamente em Uberaba...</p>', base_url || '/como-vender-carro-rapido-uberaba.webp', 'Venda', true);
  END IF;

  -- 6. Consignação de Veículos: Venda Segura
  IF EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = 'consignacao-veiculos-venda-segura') THEN
    UPDATE public.blog_posts 
    SET image_url = base_url || '/consignacao-veiculos-venda-segura.webp'
    WHERE slug = 'consignacao-veiculos-venda-segura';
  ELSE
    INSERT INTO public.blog_posts (title, slug, content, image_url, category, published)
    VALUES ('Consignação de Veículos: Venda Segura', 'consignacao-veiculos-venda-segura', '<p>Por que a consignação de veículos é uma venda segura...</p>', base_url || '/consignacao-veiculos-venda-segura.webp', 'Consignação', true);
  END IF;

  -- 7. Seguro Auto Vale a Pena
  IF EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = 'seguro-auto-vale-pena') THEN
    UPDATE public.blog_posts 
    SET image_url = base_url || '/seguro-auto-vale-pena.webp'
    WHERE slug = 'seguro-auto-vale-pena';
  ELSE
    INSERT INTO public.blog_posts (title, slug, content, image_url, category, published)
    VALUES ('Seguro Auto Vale a Pena', 'seguro-auto-vale-pena', '<p>Análise completa se o seguro auto vale a pena...</p>', base_url || '/seguro-auto-vale-pena.webp', 'Seguro', true);
  END IF;

  -- 8. Revisão de Carro Antes de Vender
  IF EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = 'revisao-carro-antes-de-vender') THEN
    UPDATE public.blog_posts 
    SET image_url = base_url || '/revisao-carro-antes-de-vender.webp'
    WHERE slug = 'revisao-carro-antes-de-vender';
  ELSE
    INSERT INTO public.blog_posts (title, slug, content, image_url, category, published)
    VALUES ('Revisão de Carro Antes de Vender', 'revisao-carro-antes-de-vender', '<p>Importância da revisão antes de vender o carro...</p>', base_url || '/revisao-carro-antes-de-vender.webp', 'Venda', true);
  END IF;

  -- 9. Documentação Necessária para Vender Carro
  IF EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = 'documentacao-vender-carro') THEN
    UPDATE public.blog_posts 
    SET image_url = base_url || '/documentacao-vender-carro.webp'
    WHERE slug = 'documentacao-vender-carro';
  ELSE
    INSERT INTO public.blog_posts (title, slug, content, image_url, category, published)
    VALUES ('Documentação Necessária para Vender Carro', 'documentacao-vender-carro', '<p>Guia com toda a documentação necessária para venda de carro...</p>', base_url || '/documentacao-vender-carro.webp', 'Documentação', true);
  END IF;

  -- 10. Consórcio de Carro vs Financiamento
  IF EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = 'consorcio-vs-financiamento') THEN
    UPDATE public.blog_posts 
    SET image_url = base_url || '/consorcio-vs-financiamento.webp'
    WHERE slug = 'consorcio-vs-financiamento';
  ELSE
    INSERT INTO public.blog_posts (title, slug, content, image_url, category, published)
    VALUES ('Consórcio de Carro vs Financiamento', 'consorcio-vs-financiamento', '<p>Comparativo entre consórcio e financiamento de carro...</p>', base_url || '/consorcio-vs-financiamento.webp', 'Financiamento', true);
  END IF;

END $$;
