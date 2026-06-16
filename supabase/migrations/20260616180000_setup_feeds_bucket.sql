DO $$
BEGIN
  -- Insert bucket if not exists and ensure it is public
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('feeds', 'feeds', true, null, null)
  ON CONFLICT (id) DO UPDATE SET public = true;
END $$;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public Access to feeds bucket" ON storage.objects;

-- Setup RLS policy to allow public read access to the feeds bucket
CREATE POLICY "Public Access to feeds bucket" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'feeds');
