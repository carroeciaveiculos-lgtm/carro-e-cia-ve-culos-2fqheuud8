UPDATE public.estoque_publicacoes
SET status = 'pending_create', post_id = NULL, erro_msg = 'Reprocessando com guard de duplicidade corrigido (ObterFotosCarro confirma antes de aceitar match)', updated_at = now()
WHERE id = '582a068b-62b3-463c-9c34-a1a17aff17a6';
