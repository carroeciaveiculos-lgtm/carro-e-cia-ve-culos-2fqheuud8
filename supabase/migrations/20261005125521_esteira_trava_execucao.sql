-- Esteira (05/10/2026): trava curta para o agendamento e a tela não criarem dois itens ao mesmo tempo.
ALTER TABLE public.esteira_config ADD COLUMN IF NOT EXISTS trava_ate timestamptz;
