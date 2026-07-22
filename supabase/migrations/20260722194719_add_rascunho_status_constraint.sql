-- Update veiculos_status_check to allow 'rascunho' (draft) status
-- Idempotent: drop existing constraint then recreate with expanded allowed values
ALTER TABLE public.veiculos DROP CONSTRAINT IF EXISTS veiculos_status_check;

ALTER TABLE public.veiculos ADD CONSTRAINT veiculos_status_check
  CHECK (status IN ('disponivel', 'vendido', 'devolvido', 'preparacao', 'reservado', 'excluido', 'rascunho'));

COMMENT ON COLUMN public.veiculos.status IS 'Status do veiculo: rascunho (em elaboracao), disponivel (ativo), vendido, devolvido, preparacao, reservado, excluido';
