-- 1. Create internal notes table for CRM
CREATE TABLE IF NOT EXISTS public.internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add AI Co-Pilot control flag to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT true;

-- 3. Set Row Level Security (RLS) for internal_notes
ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_internal_notes" ON public.internal_notes;
CREATE POLICY "authenticated_all_internal_notes" ON public.internal_notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Seed User for testing as requested
DO $DO$
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
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'adriana.araujo@kmzero.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Adriana Araujo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, nivel)
    VALUES (new_user_id, 'adriana.araujo@kmzero.com.br', 'Adriana Araujo', 'vendedor', 'admin')
    ON CONFLICT (email) DO NOTHING;
  END IF;
END $DO$;

-- 5. Setup Cron Job for automated Re-engagement
-- Extensions pg_net and pg_cron are needed for Supabase scheduled functions via SQL
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $DO$
BEGIN
  -- Attempt to schedule the re-engagement task to run daily at 10 AM
  PERFORM cron.schedule('re-engagement-cron', '0 10 * * *',
    $ SELECT net.http_post('https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/re-engagement-cron') $
  );
EXCEPTION WHEN OTHERS THEN
  -- Safely ignore if the current database role lacks permissions
END $DO$;
