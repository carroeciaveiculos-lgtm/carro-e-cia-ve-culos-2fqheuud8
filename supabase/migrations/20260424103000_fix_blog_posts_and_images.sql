DO $$
BEGIN
  -- Remover o artigo de financiamento consignado conforme solicitado
  DELETE FROM public.blog_posts WHERE title ILIKE '%Financiamento Consignado%';

  -- Limpar referências de imagens proibidas no banco de dados para evitar fallbacks
  UPDATE public.blog_posts
  SET image_url = NULL
  WHERE image_url ILIKE '%modelo-veiculo.webp%' OR image_url ILIKE '%consignacao.webp%';
END $$;
