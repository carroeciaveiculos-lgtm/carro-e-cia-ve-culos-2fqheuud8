ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS nao_exibir_km boolean DEFAULT false;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS mesma_obs_classificados boolean DEFAULT false;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS fipe_ref text;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS info_personalizadas jsonb DEFAULT '[]'::jsonb;
