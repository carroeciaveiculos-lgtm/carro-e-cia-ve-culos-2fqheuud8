DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'despesas' AND column_name = 'veiculo_id'
  ) THEN
    ALTER TABLE public.despesas ADD COLUMN veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE CASCADE;
  END IF;
END $$;
