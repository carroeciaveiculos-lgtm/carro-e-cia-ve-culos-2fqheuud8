CREATE TABLE IF NOT EXISTS public.social_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    post_id TEXT NOT NULL,
    comment_id TEXT NOT NULL,
    from_name TEXT NOT NULL,
    from_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_replied BOOLEAN DEFAULT false
);

ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_social_comments" ON public.social_comments;
CREATE POLICY "allow_all_social_comments" ON public.social_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure we have the necessary columns for leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS trade_in_car TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS external_lead_id TEXT;
