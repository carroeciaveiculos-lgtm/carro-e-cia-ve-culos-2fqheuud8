-- Create napista_credentials table for NaPista OAuth tokens (ver docs/integracao-napista.md)
CREATE TABLE IF NOT EXISTS public.napista_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  seller_id text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.napista_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_napista_credentials" ON public.napista_credentials;
CREATE POLICY "service_role_full_access_napista_credentials"
  ON public.napista_credentials FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_all_napista_credentials" ON public.napista_credentials;
CREATE POLICY "allow_auth_all_napista_credentials"
  ON public.napista_credentials FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_napista_credentials_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_napista_credentials_updated_at ON public.napista_credentials;
CREATE TRIGGER trigger_update_napista_credentials_updated_at
  BEFORE UPDATE ON public.napista_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_napista_credentials_updated_at();
