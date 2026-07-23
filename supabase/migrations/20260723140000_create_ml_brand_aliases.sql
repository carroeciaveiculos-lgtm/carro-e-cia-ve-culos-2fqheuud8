CREATE TABLE IF NOT EXISTS public.ml_brand_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_crm TEXT NOT NULL UNIQUE,
  brand_ml_id TEXT,
  brand_ml_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_brand_aliases_crm ON public.ml_brand_aliases(brand_crm);

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

DROP POLICY IF EXISTS "auth_delete_ml_brand_aliases" ON public.ml_brand_aliases;
CREATE POLICY "auth_delete_ml_brand_aliases" ON public.ml_brand_aliases
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "service_role_all_ml_brand_aliases" ON public.ml_brand_aliases;
CREATE POLICY "service_role_all_ml_brand_aliases" ON public.ml_brand_aliases
  FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.ml_brand_aliases (brand_crm, brand_ml_id, brand_ml_name) VALUES
  ('Honda', '99825', 'Honda'),
  ('Toyota', '99860', 'Toyota'),
  ('Volkswagen', '99873', 'Volkswagen'),
  ('Chevrolet', '99813', 'Chevrolet'),
  ('Fiat', '99820', 'Fiat'),
  ('Ford', '99822', 'Ford'),
  ('Hyundai', '99826', 'Hyundai'),
  ('Nissan', '99845', 'Nissan'),
  ('Renault', '99856', 'Renault'),
  ('Jeep', '99828', 'Jeep'),
  ('Citroën', '99814', 'Citroën'),
  ('Peugeot', '99849', 'Peugeot'),
  ('Mitsubishi', '99841', 'Mitsubishi'),
  ('Kia', '99832', 'Kia'),
  ('BMW', '99808', 'BMW'),
  ('Audi', '99800', 'Audi'),
  ('Mercedes-Benz', '99835', 'Mercedes-Benz'),
  ('Volvo', '99874', 'Volvo'),
  ('Land Rover', '99833', 'Land Rover')
ON CONFLICT (brand_crm) DO NOTHING;
