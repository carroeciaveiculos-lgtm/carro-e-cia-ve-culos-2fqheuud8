-- Achado em auditoria (13/08/2026): quando um veículo publicado na Webmotors
-- virava vendido/devolvido, esse gatilho marcava a publicação como
-- 'despublicado' DIRETO no banco — sem nunca mandar o pedido de exclusão
-- (ExcluirCarro) pra Webmotors de verdade, porque 'despublicado' não é um dos
-- status que o wm-sync (cron a cada 30 min, confirmado ativo) reprocessa.
-- Resultado possível: carro vendido continuava anunciado lá fora.
--
-- Correção: usar 'pending_close' (mesmo padrão já usado pelo Mercado Livre em
-- trigger_ml_sync_on_veiculo_change) — daí o wm-sync processa de verdade e
-- chama ExcluirCarro na Webmotors.
CREATE OR REPLACE FUNCTION auto_unpublish_sold_vehicle()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IN ('vendido', 'devolvido') AND (OLD.status IS NULL OR OLD.status NOT IN ('vendido', 'devolvido')) THEN
    UPDATE public.estoque_publicacoes
    SET status = 'pending_close', updated_at = NOW()
    WHERE veiculo_id = NEW.id AND status IN ('publicado', 'agendado');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
