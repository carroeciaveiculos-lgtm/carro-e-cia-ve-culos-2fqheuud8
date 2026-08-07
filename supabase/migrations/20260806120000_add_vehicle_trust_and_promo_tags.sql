-- Add trust seals (warranty / vehicle history report) and promotional tag columns to veiculos
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS garantia BOOLEAN DEFAULT false;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS laudo_cautelar BOOLEAN DEFAULT false;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS tag_promocional TEXT;
