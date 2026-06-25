DO $$
BEGIN
  UPDATE public.pages SET slug = '/' WHERE slug = 'home';
  
  IF NOT EXISTS (SELECT 1 FROM public.pages WHERE slug = '/') THEN
    INSERT INTO public.pages (
      id, titulo, slug, status_publicacao, meta_title, meta_description, 
      conteudo, criado_em, atualizado_em
    ) VALUES (
      gen_random_uuid(), 
      'Página Inicial', 
      '/', 
      'Publicado', 
      'Venda Seu Veículo em 48 Horas | Consignação Segura em Uberaba', 
      'Venda seu carro em até 48 horas com consignação segura. Avaliação grátis, contrato protegido, transparência total.', 
      '{"blocks": [{"type": "home-hero"}, {"type": "home-info"}, {"type": "home-features"}, {"type": "home-social"}, {"type": "home-faq"}]}',
      NOW(), 
      NOW()
    );
  END IF;
END $$;
