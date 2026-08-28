-- A pedido da Adriana: remover o anuncio antigo travado (73668233, real
-- mas trava qualquer alteracao ha dias, 43|36) antes de publicar um novo
-- pro HR-V. Marca pending_close pra usar o fluxo real e seguro do wm-sync
-- (ExcluirCarro), em vez de script a parte.
UPDATE public.estoque_publicacoes
SET status = 'pending_close', erro_msg = NULL, updated_at = now()
WHERE id = '582a068b-62b3-463c-9c34-a1a17aff17a6';
