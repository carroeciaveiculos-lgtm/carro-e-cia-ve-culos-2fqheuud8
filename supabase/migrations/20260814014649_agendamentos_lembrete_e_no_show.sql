-- Blocos 4 e 5 do fluxo de agendamentos (13/08/2026, pedido da Adriana, ver
-- conversa da sessão). agendamentos_visita (criada em 12/08/2026) não tinha
-- como saber se já mandou lembrete pro cliente nem se já reagiu a uma falta —
-- essas duas colunas evitam mandar a mesma mensagem duas vezes quando o cron
-- roda de novo antes do agendamento mudar de status.
ALTER TABLE public.agendamentos_visita
  ADD COLUMN IF NOT EXISTS lembrete_enviado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_enviado_em TIMESTAMPTZ;

-- Bloco 4: roda de hora em hora, manda o template lembrete_agendamento pra
-- quem tem visita entre 1h e 3h à frente e ainda não recebeu lembrete.
SELECT cron.schedule(
  'lembrete-agendamento-cron-job',
  '15 * * * *',
  $cron$
    SELECT net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/lembrete-agendamento-cron',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), ''))
    );
  $cron$
);

-- Bloco 5: roda de hora em hora, marca como nao_compareceu quem passou 2h do
-- horário marcado ainda em 'agendado', manda o template agendamento_reagendar
-- pro cliente e avisa a loja no WhatsApp.
SELECT cron.schedule(
  'agendamento-no-show-cron-job',
  '25 * * * *',
  $cron$
    SELECT net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/agendamento-no-show-cron',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), ''))
    );
  $cron$
);
