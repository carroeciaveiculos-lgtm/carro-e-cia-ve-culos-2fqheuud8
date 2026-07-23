CREATE TABLE IF NOT EXISTS public.listing_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  listing_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT listing_preferences_veiculo_platform_unique UNIQUE (veiculo_id, platform),
  CONSTRAINT listing_preferences_listing_type_check CHECK (
    listing_type IN ('diamante', 'prata', 'gold_pro', 'gold_special', 'silver',
                     'basico', 'completo', 'super_acelerador_vip', 'anuncio_basico',
                     'destaque_1_6', 'destaque_2_0')
  )
);

CREATE INDEX IF NOT EXISTS idx_listing_preferences_veiculo ON public.listing_preferences(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_listing_preferences_platform ON public.listing_preferences(platform);
CREATE INDEX IF NOT EXISTS idx_listing_preferences_listing_type ON public.listing_preferences(listing_type);

ALTER TABLE public.listing_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_listing_preferences" ON public.listing_preferences;
CREATE POLICY "auth_select_listing_preferences" ON public.listing_preferences
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_listing_preferences" ON public.listing_preferences;
CREATE POLICY "auth_insert_listing_preferences" ON public.listing_preferences
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_listing_preferences" ON public.listing_preferences;
CREATE POLICY "auth_update_listing_preferences" ON public.listing_preferences
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_listing_preferences" ON public.listing_preferences;
CREATE POLICY "auth_delete_listing_preferences" ON public.listing_preferences
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "service_role_all_listing_preferences" ON public.listing_preferences;
CREATE POLICY "service_role_all_listing_preferences" ON public.listing_preferences
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_listing_preferences_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_listing_preferences_updated_at ON public.listing_preferences;
CREATE TRIGGER trigger_update_listing_preferences_updated_at
  BEFORE UPDATE ON public.listing_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_listing_preferences_updated_at();

INSERT INTO public.listing_preferences (veiculo_id, platform, listing_type)
SELECT v.id, 'mercadolivre', 'prata'
FROM public.veiculos v
WHERE v.ml_listing_type IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.listing_preferences lp
    WHERE lp.veiculo_id = v.id AND lp.platform = 'mercadolivre'
  )
ON CONFLICT (veiculo_id, platform) DO NOTHING;

INSERT INTO public.listing_preferences (veiculo_id, platform, listing_type)
SELECT v.id, 'mercadolivre', 'diamante'
FROM public.veiculos v
WHERE v.ml_listing_type = 'gold_pro'
  AND NOT EXISTS (
    SELECT 1 FROM public.listing_preferences lp
    WHERE lp.veiculo_id = v.id AND lp.platform = 'mercadolivre'
  )
ON CONFLICT (veiculo_id, platform) DO NOTHING;

INSERT INTO public.listing_preferences (veiculo_id, platform, listing_type)
SELECT v.id, 'mercadolivre', 'prata'
FROM public.veiculos v
WHERE v.ml_listing_type IN ('gold_special', 'silver')
  AND NOT EXISTS (
    SELECT 1 FROM public.listing_preferences lp
    WHERE lp.veiculo_id = v.id AND lp.platform = 'mercadolivre'
  )
ON CONFLICT (veiculo_id, platform) DO NOTHING;
