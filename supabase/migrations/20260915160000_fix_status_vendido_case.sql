-- Corrige o gatilho de venda (Purchase pra Meta Conversions API) que
-- comparava com 'Vendido' (maiuscula) -- o valor real gravado pelo botao
-- "Marcar como Vendido" do painel sempre foi 'vendido' (minuscula), entao
-- esse gatilho nunca disparou uma unica vez desde que existe (09/07/2026).
-- Achado 14-15/09/2026, sessao 22 (auditoria do sistema).

CREATE OR REPLACE FUNCTION public.notify_vehicle_sold_capi()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'vendido' AND (OLD.status IS DISTINCT FROM 'vendido') THEN
    PERFORM net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/meta-capi-postback',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'vehicle_id', NEW.id,
        'marca', NEW.marca,
        'modelo', NEW.modelo,
        'versao', NEW.versao,
        'ano_modelo', NEW.ano_modelo,
        'preco_venda', NEW.preco_venda,
        'status', NEW.status,
        'slug', NEW.slug
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;
