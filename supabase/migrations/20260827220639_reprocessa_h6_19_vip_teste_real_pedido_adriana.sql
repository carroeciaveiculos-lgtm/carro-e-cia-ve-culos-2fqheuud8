-- Reprocessa o H6 19 (SGI9C15) em VIP a pedido explicito da Adriana, mesmo
-- sem o fix de matching por ano implementado ainda -- ela quer confirmacao
-- real de tentativa/resultado. RESULTADO (wm-sync real, mesmo dia): mesmo
-- erro de sempre, 43|41+43|37, confirmando que o problema persiste sem o
-- fix do AnoModelo (ainda aguardando autorizacao).
UPDATE public.estoque_publicacoes
SET status = 'pending_create', erro_msg = 'Reprocessando a pedido da Adriana (27/08/2026) — teste real em VIP', updated_at = now()
WHERE id = '16d11a4e-5c6f-4d1f-9ba3-d114b0f00b23';
