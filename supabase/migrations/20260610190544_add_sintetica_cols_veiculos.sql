ALTER TABLE public.veiculos 
ADD COLUMN IF NOT EXISTS combustivel_sintetico text,
ADD COLUMN IF NOT EXISTS categoria_sintetica text,
ADD COLUMN IF NOT EXISTS chassi_completo text;
