-- Novo status "pausado" pra estoque_publicacoes — usado quando um anúncio
-- pendente precisa de revisão manual antes de ir pro ar (ex: primeiro
-- anúncio real após liberação de produção da Webmotors, 13/08/2026). Não é
-- processado pelo wm-sync (só reprocessa agendado/pending_create/
-- pending_update/pending_close), então fica parado até alguém trocar de
-- volta pra pending_create.
ALTER TABLE estoque_publicacoes DROP CONSTRAINT estoque_publicacoes_status_check;
ALTER TABLE estoque_publicacoes ADD CONSTRAINT estoque_publicacoes_status_check
CHECK (status = ANY (ARRAY['agendado','publicando','publicado','erro','deletado','pending_create','pending_update','pending_close','error','despublicado','pausado']));
