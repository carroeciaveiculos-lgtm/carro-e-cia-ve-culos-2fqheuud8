-- Verifica e garante que o bucket logos-e-imagens exista e seja público
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('logos-e-imagens', 'logos-e-imagens', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
END $$;

-- Remove as políticas caso já existam para criar novamente de forma idempotente
DROP POLICY IF EXISTS "Public Access to logos-e-imagens" ON storage.objects;
DROP POLICY IF EXISTS "Anon Select Access to logos-e-imagens" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access to logos-e-imagens" ON storage.objects;

-- Criar a política de leitura pública para o bucket logos-e-imagens (anon e authenticated via role public)
CREATE POLICY "Public Read Access to logos-e-imagens" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'logos-e-imagens');
