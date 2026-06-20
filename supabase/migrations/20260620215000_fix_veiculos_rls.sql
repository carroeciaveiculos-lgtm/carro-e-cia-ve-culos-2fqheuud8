DO $$
BEGIN
  -- Garante a idempotência removendo a policy caso já exista
  DROP POLICY IF EXISTS "Allow authenticated select" ON public.veiculos;
  
  -- Cria a policy solicitada para acesso autenticado de contagem/fetching
  CREATE POLICY "Allow authenticated select" ON public.veiculos
    FOR SELECT TO authenticated USING (true);
END $$;
