-- Enable required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fix the syntax error in cron.schedule and use dollar quoting ($$)
DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('re-engagement-cron-job');
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if pg_cron is not properly initialized or job doesn't exist
  END;
END $$;

SELECT cron.schedule(
  're-engagement-cron-job',
  '0 10 * * *',
  $$
    SELECT net.http_post(
      url:='https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/re-engagement-cron'
    );
  $$
);

-- Seed Meta Analyst User securely and idempotently
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'meta_tester@carroeciamotors.com.br') THEN
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
      'meta_tester@carroeciamotors.com.br',
      crypt('MetaReviewer2026!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Meta Analyst"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, nivel)
    VALUES (new_user_id, 'meta_tester@carroeciamotors.com.br', 'Meta Analyst', 'vendedor', 'operador')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
