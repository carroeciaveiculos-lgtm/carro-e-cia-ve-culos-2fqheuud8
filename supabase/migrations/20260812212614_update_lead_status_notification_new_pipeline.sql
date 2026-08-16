-- Pipeline nova (12/08/2026): trigger só notificava em 'negociando'/'fechado',
-- coluna 'negociando' foi removida. Passa a notificar em 'agendamento',
-- 'visita' e 'fechado' — os avanços reais de funil que fazem sentido avisar.
CREATE OR REPLACE FUNCTION public.handle_lead_status_notification()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('agendamento', 'visita', 'fechado') THEN
    INSERT INTO public.marketing_logs (tipo, status, detalhes)
    VALUES ('notification', 'pending', jsonb_build_object(
      'title', 'Lead Avançou no Funil!',
      'message', 'O lead ' || NEW.nome || ' avançou para ' || NEW.status,
      'lead_id', NEW.id,
      'responsavel_id', NEW.responsavel_id
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
