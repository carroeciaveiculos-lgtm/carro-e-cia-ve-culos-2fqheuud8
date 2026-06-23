-- Add ai_enabled flag to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true;

-- Ensure temperatura has valid values
UPDATE public.leads 
SET temperatura = 'frio' 
WHERE temperatura IS NULL OR temperatura NOT IN ('frio', 'morno', 'quente');

-- Create internal_notes table for CRM
CREATE TABLE IF NOT EXISTS public.internal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for internal_notes
ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_internal_notes" ON public.internal_notes;
CREATE POLICY "allow_auth_all_internal_notes" ON public.internal_notes 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed test user (CEO/Salesperson)
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'adriana.araujo@kmzero.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id, '00000000-0000-0000-0000-000000000000', 'adriana.araujo@kmzero.com.br',
      crypt('Skip@Pass123', gen_salt('bf')), NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}', '{"name": "Adriana Araujo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
    INSERT INTO public.usuarios (id, email, nome, role, nivel)
    VALUES (new_user_id, 'adriana.araujo@kmzero.com.br', 'Adriana Araujo', 'admin', 'gerente')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Setup Cron Job for re-engagement (Requires pg_cron and pg_net)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.schedule(
    're-engagement-cron-daily',
    '0 10 * * *',
    'SELECT net.http_post(
        url:=''https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/re-engagement-cron'',
        headers:=''{"Content-Type": "application/json"}''::jsonb
    )'
  );
EXCEPTION WHEN OTHERS THEN
  NULL; -- Graceful fallback if extensions are restricted
END $$;
