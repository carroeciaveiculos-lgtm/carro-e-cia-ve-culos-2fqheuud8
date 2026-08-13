-- Indicador de "não lida" da tela /admin/conversas (Fase 4 do plano "Clara
-- ponta a ponta"). Grava quando um humano abriu a conversa daquele lead
-- (ConversationPanel chama isso ao carregar); comparado no front com a
-- mensagem mais recente de conversation_history pra saber se tem coisa nova.
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ultima_leitura_humana timestamptz;
