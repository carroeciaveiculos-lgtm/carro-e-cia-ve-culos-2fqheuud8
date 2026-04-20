DO $$
BEGIN
  -- Add new columns to leads table for unified tracking and automation
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS campanha text;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_brevo boolean DEFAULT false;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_gtm boolean DEFAULT false;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_google_ads boolean DEFAULT false;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS brevo_contact_id text;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS google_ads_customer_id text;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_source text;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_medium text;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_campaign text;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notas_internas text;
END $$;

CREATE TABLE IF NOT EXISTS public.lead_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  tipo_automacao text,
  status text DEFAULT 'aguardando',
  detalhes jsonb,
  brevo_message_id text,
  retry_count integer DEFAULT 0,
  proximo_retry timestamptz
);

CREATE TABLE IF NOT EXISTS public.lead_eventos_gtm (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  evento_nome text,
  timestamp timestamptz DEFAULT now(),
  valor_conversao numeric,
  propriedades jsonb,
  sincronizado_google_ads boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.lead_integracao_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  ferramenta text,
  acao text,
  status_code integer,
  mensagem_erro text,
  retry_agendado boolean DEFAULT false
);

-- Row Level Security
ALTER TABLE public.lead_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_eventos_gtm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_integracao_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_auth_all_lead_automations" ON public.lead_automations;
CREATE POLICY "allow_auth_all_lead_automations" ON public.lead_automations FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_all_lead_eventos_gtm" ON public.lead_eventos_gtm;
CREATE POLICY "allow_auth_all_lead_eventos_gtm" ON public.lead_eventos_gtm FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_auth_all_lead_integracao_log" ON public.lead_integracao_log;
CREATE POLICY "allow_auth_all_lead_integracao_log" ON public.lead_integracao_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
