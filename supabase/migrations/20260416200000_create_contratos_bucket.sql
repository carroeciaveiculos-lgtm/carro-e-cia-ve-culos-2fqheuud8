DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('contratos-consignacao', 'contratos-consignacao', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

DROP POLICY IF EXISTS "auth_insert_contratos_consignacao" ON storage.objects;
CREATE POLICY "auth_insert_contratos_consignacao" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contratos-consignacao');

DROP POLICY IF EXISTS "auth_update_contratos_consignacao" ON storage.objects;
CREATE POLICY "auth_update_contratos_consignacao" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'contratos-consignacao');

DROP POLICY IF EXISTS "auth_select_contratos_consignacao" ON storage.objects;
CREATE POLICY "auth_select_contratos_consignacao" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'contratos-consignacao');
