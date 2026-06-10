-- Update veiculos table to support new enriched API fields
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS combustivel text;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS cor text;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'Carro';
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS info_personalizadas jsonb DEFAULT '{}'::jsonb;

-- Update despesas to handle responsibility (Loja vs Cliente)
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS responsabilidade text DEFAULT 'loja';

-- Update cache for smart queries
ALTER TABLE public.veiculos_cache ADD COLUMN IF NOT EXISTS combustivel_sintetico text;
ALTER TABLE public.veiculos_cache ADD COLUMN IF NOT EXISTS categoria_sintetica text;
ALTER TABLE public.veiculos_cache ADD COLUMN IF NOT EXISTS chassi_completo text;
