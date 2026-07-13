-- Populate sync queue for ALL platforms for existing visible vehicles
-- Ensures all vehicles with exibir_no_site = true are queued for sync across every active platform
INSERT INTO public.sync_log (plataforma_id, veiculo_id, acao, status, mensagem, metadata)
SELECT p.id, v.id, 'queue_retroactive', 'pending', 'Vehicle retroactively queued for sync', '{}'::jsonb
FROM public.veiculos v
CROSS JOIN public.plataformas p
WHERE p.ativo = true
  AND v.status = 'disponivel'
  AND COALESCE(v.exibir_no_site, true) = true
  AND NOT EXISTS (
    SELECT 1 FROM public.sync_log sl
    WHERE sl.plataforma_id = p.id AND sl.veiculo_id = v.id
  )
ON CONFLICT DO NOTHING;

-- Ensure ml_listings has entries for all visible vehicles not yet tracked
INSERT INTO public.ml_listings (veiculo_id, status, last_synced_at)
SELECT v.id, 'pending_create', now()
FROM public.veiculos v
WHERE v.status = 'disponivel'
  AND COALESCE(v.exibir_no_site, true) = true
  AND NOT EXISTS (
    SELECT 1 FROM public.ml_listings ml WHERE ml.veiculo_id = v.id
  )
ON CONFLICT DO NOTHING;
