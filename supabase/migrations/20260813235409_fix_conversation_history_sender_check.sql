-- Achado em auditoria (13/08/2026, teste ao vivo): conversation_history_sender_check
-- só permitia ('bot','client','human'). receive-leads grava o NOME real do
-- contato (ex: "Adriana Araújo") no campo sender pra mensagens de WhatsApp —
-- violava a trava e falhava em silêncio (o insert do supabase-js não lança
-- erro sozinho, e o código não conferia {error}). Resultado: toda mensagem
-- de cliente recebida por WhatsApp nunca era salva, só a resposta da Clara.
-- Mesmo problema explica por que "Nota Interna" (sender='internal_note',
-- usado desde sempre em Leads.tsx/ConversationPanel) nunca gravava nada.
ALTER TABLE conversation_history DROP CONSTRAINT conversation_history_sender_check;
ALTER TABLE conversation_history ADD CONSTRAINT conversation_history_sender_check
CHECK (sender = ANY (ARRAY['bot','client','human','internal_note']));
