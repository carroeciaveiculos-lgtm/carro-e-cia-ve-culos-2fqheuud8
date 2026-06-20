-- Ensures SELECT operations (and HEAD for counts) are explicitly allowed
-- for authenticated and anon users to avoid permission-related network failures

DROP POLICY IF EXISTS "Allow authenticated select" ON public.veiculos;
CREATE POLICY "Allow authenticated select" ON public.veiculos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "allow_anon_select_veiculos" ON public.veiculos;
CREATE POLICY "allow_anon_select_veiculos" ON public.veiculos
  FOR SELECT TO anon USING (true);
