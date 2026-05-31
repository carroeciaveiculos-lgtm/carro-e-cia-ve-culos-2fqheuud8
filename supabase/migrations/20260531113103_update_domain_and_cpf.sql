DO $$
BEGIN
  -- RLS for clientes table
  DROP POLICY IF EXISTS "allow_auth_all_clientes" ON public.clientes;
  CREATE POLICY "allow_auth_all_clientes" ON public.clientes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- Replace .goskip.app with .com.br domain in dynamic tables
  UPDATE public.site_configuracoes
  SET valor = (REPLACE(valor::text, 'carroeciaveiculos.goskip.app', 'www.carroeciamotors.com.br'))::jsonb
  WHERE valor::text LIKE '%carroeciaveiculos.goskip.app%';

  UPDATE public.pages
  SET conteudo = REPLACE(conteudo, 'carroeciaveiculos.goskip.app', 'www.carroeciamotors.com.br')
  WHERE conteudo LIKE '%carroeciaveiculos.goskip.app%';

  UPDATE public.articles
  SET conteudo = REPLACE(conteudo, 'carroeciaveiculos.goskip.app', 'www.carroeciamotors.com.br')
  WHERE conteudo LIKE '%carroeciaveiculos.goskip.app%';

  UPDATE public.pages
  SET canonical_url = REPLACE(canonical_url, 'carroeciaveiculos.goskip.app', 'www.carroeciamotors.com.br')
  WHERE canonical_url LIKE '%carroeciaveiculos.goskip.app%';

  UPDATE public.articles
  SET canonical_url = REPLACE(canonical_url, 'carroeciaveiculos.goskip.app', 'www.carroeciamotors.com.br')
  WHERE canonical_url LIKE '%carroeciaveiculos.goskip.app%';
  
  -- Apply replacements on version history tables as well for robustness
  UPDATE public.pages_versions
  SET conteudo = REPLACE(conteudo, 'carroeciaveiculos.goskip.app', 'www.carroeciamotors.com.br')
  WHERE conteudo LIKE '%carroeciaveiculos.goskip.app%';
  
  UPDATE public.article_versions
  SET conteudo = REPLACE(conteudo, 'carroeciaveiculos.goskip.app', 'www.carroeciamotors.com.br')
  WHERE conteudo LIKE '%carroeciaveiculos.goskip.app%';
END $$;
