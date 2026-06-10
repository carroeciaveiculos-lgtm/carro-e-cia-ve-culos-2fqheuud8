DO $do$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('documentos-veiculos', 'documentos-veiculos', true) 
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('contratos-consignacao', 'contratos-consignacao', true) 
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('logos-e-imagens', 'logos-e-imagens', true) 
  ON CONFLICT (id) DO NOTHING;
END $do$;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects 
  FOR SELECT USING (bucket_id IN ('documentos-veiculos', 'contratos-consignacao', 'logos-e-imagens'));

DROP POLICY IF EXISTS "Auth Insert" ON storage.objects;
CREATE POLICY "Auth Insert" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('documentos-veiculos', 'contratos-consignacao', 'logos-e-imagens'));

DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Update" ON storage.objects 
  FOR UPDATE TO authenticated USING (bucket_id IN ('documentos-veiculos', 'contratos-consignacao', 'logos-e-imagens'));

DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
CREATE POLICY "Auth Delete" ON storage.objects 
  FOR DELETE TO authenticated USING (bucket_id IN ('documentos-veiculos', 'contratos-consignacao', 'logos-e-imagens'));

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_documentos" ON public.documentos;
CREATE POLICY "allow_auth_all_documentos" ON public.documentos 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.contratos_consignacao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_contratos_consignacao" ON public.contratos_consignacao;
CREATE POLICY "allow_auth_all_contratos_consignacao" ON public.contratos_consignacao 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
