-- Seed Admin User
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
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'adriana.araujo@kmzero.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Adriana Araujo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.usuarios (id, email, nome, role, ativo, modulos, nivel)
    VALUES (new_user_id, 'adriana.araujo@kmzero.com.br', 'Adriana Araujo', 'admin', true, ARRAY['estoque', 'crm'], 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Enhance Leads Schema
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS external_lead_id text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS trade_in_car text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source text;

-- Create Conversation History Table
CREATE TABLE IF NOT EXISTS public.conversation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('bot', 'client')),
  message_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies for conversation_history
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_auth_all_conversation_history" ON public.conversation_history;
CREATE POLICY "allow_auth_all_conversation_history" ON public.conversation_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
