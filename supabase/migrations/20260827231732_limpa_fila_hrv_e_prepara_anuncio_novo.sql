-- Adriana confirmou de verdade (Cockpit) que o anuncio antigo do HR-V saiu
-- e autorizou publicar um novo. Remove a linha 'pending_close' extra que
-- o gatilho criou sozinho (miraria o mesmo anuncio ja fechado, redundante)
-- e recoloca o veiculo na fila como anuncio novo (sem post_id).
DELETE FROM public.estoque_publicacoes WHERE id = '633aeeca-3218-4a07-a211-e8780fcc3aed';

UPDATE public.estoque_publicacoes
SET status = 'pending_create', post_id = NULL, erro_msg = NULL, updated_at = now()
WHERE id = '582a068b-62b3-463c-9c34-a1a17aff17a6';
