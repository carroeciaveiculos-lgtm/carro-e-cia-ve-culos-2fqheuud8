-- Drop and recreate RLS for crm_conversas
DROP POLICY IF EXISTS "allow_auth_all_crm_conversas" ON public.crm_conversas;
CREATE POLICY "allow_auth_all_crm_conversas" ON public.crm_conversas 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Drop and recreate RLS for crm_mensagens
DROP POLICY IF EXISTS "allow_auth_all_crm_mensagens" ON public.crm_mensagens;
CREATE POLICY "allow_auth_all_crm_mensagens" ON public.crm_mensagens 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure leads has full access policies for authenticated users
DROP POLICY IF EXISTS "allow_auth_all_leads" ON public.leads;
CREATE POLICY "allow_auth_all_leads" ON public.leads 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to view meta_webhook_logs
DROP POLICY IF EXISTS "allow_auth_select_meta_webhook_logs" ON public.meta_webhook_logs;
CREATE POLICY "allow_auth_select_meta_webhook_logs" ON public.meta_webhook_logs 
  FOR SELECT TO authenticated USING (true);

-- Function and trigger to automatically update ultima_msg_em on crm_conversas
CREATE OR REPLACE FUNCTION update_conversa_ultima_msg_em()
RETURNS trigger AS $BODY$
BEGIN
  UPDATE public.crm_conversas
  SET ultima_msg_em = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.conversa_id;
  RETURN NEW;
END;
$BODY$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversa_ultima_msg_em ON public.crm_mensagens;
CREATE TRIGGER trigger_update_conversa_ultima_msg_em
AFTER INSERT ON public.crm_mensagens
FOR EACH ROW EXECUTE FUNCTION update_conversa_ultima_msg_em();
