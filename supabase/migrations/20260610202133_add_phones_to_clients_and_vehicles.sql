ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS telefone_residencial TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS telefone_trabalho TEXT;

ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_telefone_residencial TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS proprietario_telefone_trabalho TEXT;
