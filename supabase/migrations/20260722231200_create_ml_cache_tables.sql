CREATE TABLE IF NOT EXISTS public.ml_attribute_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id TEXT NOT NULL,
  ml_value_id INTEGER NOT NULL,
  ml_value_name TEXT NOT NULL,
  crm_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(attribute_id, ml_value_id)
);

CREATE INDEX IF NOT EXISTS idx_ml_attribute_cache_attr ON public.ml_attribute_cache(attribute_id);
CREATE INDEX IF NOT EXISTS idx_ml_attribute_cache_crm ON public.ml_attribute_cache(crm_value);

CREATE TABLE IF NOT EXISTS public.ml_cities_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ml_city_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  state_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ml_quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ml_item_id TEXT NOT NULL,
  score INTEGER,
  level TEXT,
  checked_at TIMESTAMPTZ DEFAULT now(),
  veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE CASCADE,
  UNIQUE(ml_item_id, checked_at)
);

CREATE INDEX IF NOT EXISTS idx_ml_quality_scores_item ON public.ml_quality_scores(ml_item_id);
CREATE INDEX IF NOT EXISTS idx_ml_quality_scores_veiculo ON public.ml_quality_scores(veiculo_id);

ALTER TABLE public.ml_attribute_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all_ml_attribute_cache" ON public.ml_attribute_cache;
CREATE POLICY "auth_all_ml_attribute_cache" ON public.ml_attribute_cache
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_ml_attribute_cache" ON public.ml_attribute_cache;
CREATE POLICY "service_role_all_ml_attribute_cache" ON public.ml_attribute_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.ml_cities_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all_ml_cities_cache" ON public.ml_cities_cache;
CREATE POLICY "auth_all_ml_cities_cache" ON public.ml_cities_cache
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_ml_cities_cache" ON public.ml_cities_cache;
CREATE POLICY "service_role_all_ml_cities_cache" ON public.ml_cities_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.ml_quality_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all_ml_quality_scores" ON public.ml_quality_scores;
CREATE POLICY "auth_all_ml_quality_scores" ON public.ml_quality_scores
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all_ml_quality_scores" ON public.ml_quality_scores;
CREATE POLICY "service_role_all_ml_quality_scores" ON public.ml_quality_scores
  FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.ml_cities_cache (ml_city_id, name, state_id)
VALUES ('TUxBQ0NBTWFhOTU5', 'Uberaba', 'BR-MG')
ON CONFLICT (ml_city_id) DO NOTHING;
