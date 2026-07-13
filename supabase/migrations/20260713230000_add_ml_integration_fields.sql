-- Add steering, engine displacement, and ML listing type columns to veiculos
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS direcao TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS cilindrada TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS ml_listing_type TEXT DEFAULT 'gold_special';
