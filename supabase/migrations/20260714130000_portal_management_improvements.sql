-- Add elegivel_portais column to veiculos
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS elegivel_portais BOOLEAN DEFAULT true;

-- Add ad_types JSONB column for per-platform ad type settings
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS ad_types JSONB DEFAULT '{}'::jsonb;

-- Clear sync_log entries stuck in pending status
UPDATE public.sync_log
SET status = 'erro',
    mensagem = COALESCE(mensagem, '') || ' [Auto-cleared: stuck in pending]'
WHERE status = 'pending';

-- Delete old error entries (older than 7 days) to fix accumulated error count
DELETE FROM public.sync_log
WHERE status = 'erro'
  AND created_at < NOW() - INTERVAL '7 days';

-- Delete old success entries older than 30 days to keep table clean
DELETE FROM public.sync_log
WHERE status = 'success'
  AND created_at < NOW() - INTERVAL '30 days';

-- Ensure RLS policies exist for new columns (existing policies cover all columns)
-- No additional RLS needed since veiculos already has policies

-- Create index for ad quality queries
CREATE INDEX IF NOT EXISTS idx_veiculos_elegivel_portais ON public.veiculos(elegivel_portais)
  WHERE elegivel_portais = true;
