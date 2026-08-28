-- Sem isso, o INSERT feito pelo novo trigger wm_sync_on_modalidade_change
-- (status='pending_modalidade') violaria estoque_publicacoes_status_check e
-- quebraria a transacao inteira do UPDATE em wm_mapeamento_veiculos -- ou
-- seja, a propria troca de modalidade na tela falharia.
ALTER TABLE public.estoque_publicacoes DROP CONSTRAINT estoque_publicacoes_status_check;
ALTER TABLE public.estoque_publicacoes ADD CONSTRAINT estoque_publicacoes_status_check
  CHECK (status = ANY (ARRAY[
    'agendado', 'publicando', 'publicado', 'erro', 'deletado',
    'pending_create', 'pending_update', 'pending_modalidade', 'pending_close',
    'error', 'despublicado', 'pausado'
  ]));
