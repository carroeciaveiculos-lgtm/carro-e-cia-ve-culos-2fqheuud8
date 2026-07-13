DO $$
BEGIN
  -- Allow anon to insert leads (Crucial for CRM-First flow)
  DROP POLICY IF EXISTS "allow_anon_insert_leads" ON public.leads;
  CREATE POLICY "allow_anon_insert_leads" ON public.leads
    FOR INSERT TO anon WITH CHECK (true);

  -- Allow anon to update leads (if they need to, e.g. UTM tracking later, but usually just insert)
  DROP POLICY IF EXISTS "allow_anon_update_leads" ON public.leads;
  CREATE POLICY "allow_anon_update_leads" ON public.leads
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

  -- Allow anon to insert simulacoes
  DROP POLICY IF EXISTS "allow_anon_insert_simulacoes" ON public.simulacoes;
  CREATE POLICY "allow_anon_insert_simulacoes" ON public.simulacoes
    FOR INSERT TO anon WITH CHECK (true);

  -- Allow anon to update simulacoes
  DROP POLICY IF EXISTS "allow_anon_update_simulacoes" ON public.simulacoes;
  CREATE POLICY "allow_anon_update_simulacoes" ON public.simulacoes
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

END $$;
