-- Ensure the 'cambio' column exists to support the Meta (Facebook) feed integration mapping
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS cambio TEXT;
