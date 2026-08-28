DELETE FROM public.estoque_publicacoes
WHERE id IN ('bc9a191e-30c0-4ca7-a059-60ea3b436528', '16d11a4e-5c6f-4d1f-9ba3-d114b0f00b23');

UPDATE public.estoque_publicacoes
SET status = 'pending_create', erro_msg = 'Reprocessando com ano_modelo_override_wm=2024 (fluxo real, corrigido no codigo)', updated_at = now()
WHERE id = 'b40c38a8-eb12-42e5-8486-9b707f2b04d2';
