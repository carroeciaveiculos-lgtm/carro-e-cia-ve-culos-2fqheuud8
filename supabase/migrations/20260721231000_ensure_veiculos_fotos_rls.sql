-- Ensure RLS policies allow public and authenticated SELECT on veiculos (including fotos column)
-- Idempotent: drops and recreates policies with the exact names from acceptance criteria

DROP POLICY IF EXISTS "Allow public read access" ON public.veiculos;
CREATE POLICY "Allow public read access" ON public.veiculos
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated read access" ON public.veiculos;
CREATE POLICY "Allow authenticated read access" ON public.veiculos
  FOR SELECT TO authenticated USING (true);
