-- Add missing FIPE-related columns to the veiculos table
-- Resolves PGRST204 error: "Could not find the 'codigo_fipe' column of 'veiculos' in the schema cache"
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS codigo_fipe TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS url_fipe TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS mes_referencia TEXT;
