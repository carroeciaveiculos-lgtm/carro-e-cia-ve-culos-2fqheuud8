-- Adiciona coluna de visibilidade no site
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS exibir_no_site BOOLEAN DEFAULT true;

-- Cria tabela de logs de marketing para analytics
CREATE TABLE IF NOT EXISTS public.marketing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL, -- 'email', 'social_post', 'automation'
    status TEXT NOT NULL, -- 'sucesso', 'erro', 'pendente'
    detalhes JSONB DEFAULT '{}'::jsonb,
    campanha_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.marketing_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_auth_all_marketing_logs" ON public.marketing_logs;
CREATE POLICY "allow_auth_all_marketing_logs" ON public.marketing_logs 
  FOR ALL TO authenticated USING (true);

-- Seed de dados para popular os gráficos iniciais
DO $DO$
BEGIN
  INSERT INTO public.marketing_logs (id, tipo, status, detalhes, created_at)
  VALUES 
    (gen_random_uuid(), 'email', 'sucesso', '{"opened": true, "clicked": false}'::jsonb, NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), 'email', 'sucesso', '{"opened": true, "clicked": true}'::jsonb, NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), 'email', 'sucesso', '{"opened": false, "clicked": false}'::jsonb, NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), 'email', 'sucesso', '{"opened": true, "clicked": false}'::jsonb, NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), 'email', 'sucesso', '{"opened": true, "clicked": false}'::jsonb, NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), 'email', 'sucesso', '{"opened": true, "clicked": false}'::jsonb, NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), 'social_post', 'sucesso', '{"platform": "instagram", "likes": 120, "comments": 5}'::jsonb, NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), 'social_post', 'sucesso', '{"platform": "facebook", "likes": 45, "comments": 1}'::jsonb, NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), 'social_post', 'sucesso', '{"platform": "instagram", "likes": 200, "comments": 15}'::jsonb, NOW() - INTERVAL '3 days')
  ON CONFLICT DO NOTHING;
END $DO$;
