CREATE TABLE IF NOT EXISTS public.ml_brand_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_crm TEXT NOT NULL UNIQUE,
  brand_ml_id TEXT,
  brand_ml_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ml_brand_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_ml_brand_aliases" ON public.ml_brand_aliases;
CREATE POLICY "auth_select_ml_brand_aliases" ON public.ml_brand_aliases
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_ml_brand_aliases" ON public.ml_brand_aliases;
CREATE POLICY "auth_insert_ml_brand_aliases" ON public.ml_brand_aliases
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_ml_brand_aliases" ON public.ml_brand_aliases;
CREATE POLICY "auth_update_ml_brand_aliases" ON public.ml_brand_aliases
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_ml_brand_aliases" ON public.ml_brand_aliases;
CREATE POLICY "service_role_all_ml_brand_aliases" ON public.ml_brand_aliases
  FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.ml_brand_aliases (brand_crm, brand_ml_id, brand_ml_name) VALUES
  ('Honda', '206', 'Honda'),
  ('Toyota', '201', 'Toyota'),
  ('Volkswagen', '208', 'Volkswagen'),
  ('Chevrolet', '202', 'Chevrolet'),
  ('Fiat', '205', 'Fiat'),
  ('Ford', '203', 'Ford'),
  ('Hyundai', '209', 'Hyundai'),
  ('Nissan', '204', 'Nissan'),
  ('Jeep', '211', 'Jeep'),
  ('Renault', '207', 'Renault'),
  ('Peugeot', '212', 'Peugeot'),
  ('Citroën', '213', 'Citroën'),
  ('Mitsubishi', '210', 'Mitsubishi'),
  ('Kia', '214', 'Kia'),
  ('BMW', '224', 'BMW'),
  ('Audi', '225', 'Audi'),
  ('Mercedes-Benz', '227', 'Mercedes-Benz'),
  ('Volvo', '228', 'Volvo')
ON CONFLICT (brand_crm) DO NOTHING;

CREATE OR REPLACE VIEW public.vw_ml_brand_mapping AS
SELECT DISTINCT v.marca,
  ba.brand_ml_id,
  ba.brand_ml_name
FROM public.veiculos v
LEFT JOIN public.ml_brand_aliases ba ON ba.brand_crm = v.marca
ORDER BY v.marca;
