CREATE TABLE IF NOT EXISTS public.hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag TEXT UNIQUE NOT NULL,
    categoria TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

DROP POLICY IF EXISTS "allow_auth_all_hashtags" ON public.hashtags;
CREATE POLICY "allow_auth_all_hashtags" ON public.hashtags FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

-- Seed some initial hashtags
INSERT INTO public.hashtags (tag, categoria) VALUES
('#seminovos', 'Geral'),
('#carros', 'Geral'),
('#vender', 'Vendas'),
('#financiamento', 'Financeiro')
ON CONFLICT (tag) DO NOTHING;
