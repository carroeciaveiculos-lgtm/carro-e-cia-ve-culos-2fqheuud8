-- Verifica e garante que o bucket logos-e-imagens exista e seja público
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos-e-imagens', 'logos-e-imagens', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remove as políticas caso já existam para criar novamente de forma idempotente
DROP POLICY IF EXISTS "Public Access to logos-e-imagens" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to logos-e-imagens" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to logos-e-imagens" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes to logos-e-imagens" ON storage.objects;

-- Criar a política de leitura pública
CREATE POLICY "Public Access to logos-e-imagens" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'logos-e-imagens');

-- Criar a política de escrita para usuários autenticados
CREATE POLICY "Allow authenticated uploads to logos-e-imagens" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos-e-imagens');

-- Criar a política de atualização para usuários autenticados
CREATE POLICY "Allow authenticated updates to logos-e-imagens" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'logos-e-imagens');

-- Criar a política de exclusão para usuários autenticados
CREATE POLICY "Allow authenticated deletes to logos-e-imagens" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos-e-imagens');
