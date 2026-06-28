-- Migrate legacy statuses to the new three-status workflow (disponivel, vendido, devolvido)
UPDATE public.veiculos SET status = 'disponivel' WHERE status IN ('consignado', 'reservado') OR status IS NULL;
UPDATE public.veiculos SET status = 'devolvido' WHERE status IN ('arquivado', 'inativo');
UPDATE public.veiculos SET status = 'disponivel' WHERE status NOT IN ('disponivel', 'vendido', 'devolvido');

-- Ensure exibir_no_site is never null
UPDATE public.veiculos SET exibir_no_site = true WHERE exibir_no_site IS NULL;

-- Add CHECK constraint for valid status values
ALTER TABLE public.veiculos DROP CONSTRAINT IF EXISTS veiculos_status_check;
ALTER TABLE public.veiculos ADD CONSTRAINT veiculos_status_check
  CHECK (status IN ('disponivel', 'vendido', 'devolvido'));

COMMENT ON COLUMN public.veiculos.status IS 'Status do veiculo: disponivel (ativo), vendido, devolvido';
