-- Add em_preparacao column to veiculos
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS em_preparacao boolean DEFAULT false;

-- Add content_type column to social_posts for Feed/Stories/Reels
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'feed';

-- Ensure RLS policies for social_posts
DROP POLICY IF EXISTS "authenticated_all_social_posts" ON public.social_posts;
CREATE POLICY "authenticated_all_social_posts" ON public.social_posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure RLS policies for marketing_logs
DROP POLICY IF EXISTS "authenticated_all_marketing_logs" ON public.marketing_logs;
CREATE POLICY "authenticated_all_marketing_logs" ON public.marketing_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure RLS policies for lead_automations
DROP POLICY IF EXISTS "authenticated_all_lead_automations" ON public.lead_automations;
CREATE POLICY "authenticated_all_lead_automations" ON public.lead_automations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure RLS policies for whatsapp_templates
DROP POLICY IF EXISTS "authenticated_all_whatsapp_templates" ON public.whatsapp_templates;
CREATE POLICY "authenticated_all_whatsapp_templates" ON public.whatsapp_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
