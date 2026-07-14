ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS notas_internas TEXT;

DROP POLICY IF EXISTS "Allow authenticated insert veiculos" ON public.veiculos;
CREATE POLICY "Allow authenticated insert veiculos" ON public.veiculos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update veiculos" ON public.veiculos;
CREATE POLICY "Allow authenticated update veiculos" ON public.veiculos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
