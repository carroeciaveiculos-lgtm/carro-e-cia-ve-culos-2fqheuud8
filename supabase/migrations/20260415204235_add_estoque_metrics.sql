ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS visualizacoes_site integer DEFAULT 0;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS cliques_whatsapp integer DEFAULT 0;
