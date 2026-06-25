-- Add new AI columns
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_score INTEGER DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Create an edge function invoker for notifications
-- In Supabase pg_net might not be available out of the box in all environments or can fail, 
-- but we can safely write a trigger that uses it if it exists, or just log into marketing_logs.
-- Here we'll just log into marketing_logs so the UI can notify, and the existing edge function could poll it.
-- But the requirement: "Notify the responsavel_id when a new record is added to internal_notes."
-- Let's implement robust triggers that insert events to `marketing_logs`.

CREATE OR REPLACE FUNCTION public.handle_lead_status_notification()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND (NEW.status = 'negociando' OR NEW.status = 'fechado') THEN
    INSERT INTO public.marketing_logs (tipo, status, detalhes)
    VALUES ('notification', 'pending', jsonb_build_object(
      'title', 'Lead Avançou no Funil!',
      'message', 'O lead ' || NEW.nome || ' avançou para ' || NEW.status,
      'lead_id', NEW.id,
      'responsavel_id', NEW.responsavel_id
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_lead_status_change ON public.leads;
CREATE TRIGGER on_lead_status_change
  AFTER UPDATE OF status ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_lead_status_notification();

-- Trigger for internal notes
CREATE OR REPLACE FUNCTION public.handle_internal_note_notification()
RETURNS trigger AS $$
DECLARE
  v_lead_nome TEXT;
  v_responsavel_id UUID;
BEGIN
  SELECT nome, responsavel_id INTO v_lead_nome, v_responsavel_id
  FROM public.leads WHERE id = NEW.lead_id;

  IF v_responsavel_id IS NOT NULL AND NEW.author_id IS DISTINCT FROM v_responsavel_id THEN
    INSERT INTO public.marketing_logs (tipo, status, detalhes)
    VALUES ('notification', 'pending', jsonb_build_object(
      'title', 'Nova Nota Interna',
      'message', 'Adicionaram uma nota no lead ' || v_lead_nome,
      'lead_id', NEW.lead_id,
      'responsavel_id', v_responsavel_id
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_internal_note_insert ON public.internal_notes;
CREATE TRIGGER on_internal_note_insert
  AFTER INSERT ON public.internal_notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_internal_note_notification();

-- Seed Auth User adriana.araujo@kmzero.com.br
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

    INSERT INTO public.usuarios (id, email, nome, role, modulos, nivel)
    VALUES (
      new_user_id, 
      'adriana.araujo@kmzero.com.br', 
      'Adriana Araujo', 
      'admin',
      ARRAY['estoque', 'crm', 'avaliacao', 'site', 'financiamento', 'administrativo', 'marketing', 'configuracoes'],
      'gerente'
    )
    ON CONFLICT (email) DO NOTHING;
  END IF;
END $$;
