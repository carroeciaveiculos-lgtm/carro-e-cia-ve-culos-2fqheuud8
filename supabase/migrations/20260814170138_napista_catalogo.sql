-- Cache local do catálogo do NaPista (marcas/modelos/versões/atributos) —
-- necessário pra mapear veiculos.marca/modelo/versao pro versionId exigido
-- em POST /seller/{sellerId}/offer. Ver docs/integracao-napista.md.
CREATE TABLE IF NOT EXISTS public.napista_marcas (
  id text PRIMARY KEY,
  nome text NOT NULL,
  atualizado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.napista_modelos (
  marca_id text NOT NULL REFERENCES public.napista_marcas(id) ON DELETE CASCADE,
  id text NOT NULL,
  nome text NOT NULL,
  atualizado_em timestamptz DEFAULT now(),
  PRIMARY KEY (marca_id, id)
);

CREATE TABLE IF NOT EXISTS public.napista_versoes (
  id text PRIMARY KEY,
  modelo_id text NOT NULL,
  marca_id text NOT NULL,
  nome text NOT NULL,
  atualizado_em timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_napista_versoes_modelo ON public.napista_versoes(marca_id, modelo_id);

-- Um único row com o payload inteiro de GET /catalog/attributes (colors,
-- equipments, fuelTypes, transmissionTypes, doors, factoryYears, modelYears)
-- — endpoint pequeno e estático, não compensa normalizar em várias tabelas.
CREATE TABLE IF NOT EXISTS public.napista_atributos (
  id text PRIMARY KEY DEFAULT 'catalogo',
  dados jsonb NOT NULL,
  atualizado_em timestamptz DEFAULT now()
);

ALTER TABLE public.napista_marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.napista_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.napista_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.napista_atributos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_napista_marcas" ON public.napista_marcas;
CREATE POLICY "service_role_full_access_napista_marcas" ON public.napista_marcas FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_auth_all_napista_marcas" ON public.napista_marcas;
CREATE POLICY "allow_auth_all_napista_marcas" ON public.napista_marcas FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_napista_modelos" ON public.napista_modelos;
CREATE POLICY "service_role_full_access_napista_modelos" ON public.napista_modelos FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_auth_all_napista_modelos" ON public.napista_modelos;
CREATE POLICY "allow_auth_all_napista_modelos" ON public.napista_modelos FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_napista_versoes" ON public.napista_versoes;
CREATE POLICY "service_role_full_access_napista_versoes" ON public.napista_versoes FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_auth_all_napista_versoes" ON public.napista_versoes;
CREATE POLICY "allow_auth_all_napista_versoes" ON public.napista_versoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_napista_atributos" ON public.napista_atributos;
CREATE POLICY "service_role_full_access_napista_atributos" ON public.napista_atributos FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_auth_all_napista_atributos" ON public.napista_atributos;
CREATE POLICY "allow_auth_all_napista_atributos" ON public.napista_atributos FOR ALL TO authenticated USING (true) WITH CHECK (true);
