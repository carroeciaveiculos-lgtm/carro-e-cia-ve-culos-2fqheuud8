-- Esqueci de atualizar essa linha depois de fechar de verdade a oferta
-- 09fdf129 (duplicata do SW4 2017) via UNPUBLISHED real mais cedo nesta
-- sessao -- a chamada real teve sucesso (confirmado por GET na hora), mas
-- o banco continuou marcando 'publicado'. Corrige agora.
UPDATE public.estoque_publicacoes
SET status = 'despublicado', updated_at = now()
WHERE id = '1e7c700a-dd03-40c4-a500-3774158f9402';
