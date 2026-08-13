-- Achado em auditoria (13/08/2026): veículos vendido/devolvido/rascunho
-- continuavam com exibir_no_site = true — nada zerava essa flag
-- automaticamente, só o comando "VENDIDO" do WhatsApp administrativo fazia
-- isso certo. Qualquer outro caminho (nota fiscal emitida, edição manual)
-- deixava o carro aparecendo no site mesmo já vendido.
CREATE OR REPLACE FUNCTION auto_ocultar_veiculo_vendido()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IN ('vendido', 'devolvido') AND
     (OLD.status IS DISTINCT FROM NEW.status) THEN
    NEW.exibir_no_site = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_auto_ocultar_veiculo_vendido
BEFORE UPDATE OF status ON veiculos
FOR EACH ROW EXECUTE FUNCTION auto_ocultar_veiculo_vendido();
