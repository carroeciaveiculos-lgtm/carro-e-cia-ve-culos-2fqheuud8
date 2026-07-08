-- Add tipo and origem columns to despesas table for enhanced expense tracking
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS origem TEXT;

-- Add proprietario_estado_civil column to veiculos table for comprehensive owner registration
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_estado_civil TEXT;
