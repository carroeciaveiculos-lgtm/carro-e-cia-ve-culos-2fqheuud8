-- Auto-unpublish trigger: when vehicle status changes to 'Vendido', unpublish from all platforms
CREATE OR REPLACE FUNCTION public.auto_unpublish_sold_vehicle()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'Vendido' AND (OLD.status IS NULL OR OLD.status != 'Vendido') THEN
    UPDATE public.estoque_publicacoes
    SET status = 'despublicado', updated_at = NOW()
    WHERE veiculo_id = NEW.id AND status IN ('publicado', 'agendado');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_unpublish_sold ON public.veiculos;
CREATE TRIGGER trigger_auto_unpublish_sold
  AFTER UPDATE OF status ON public.veiculos
  FOR EACH ROW EXECUTE FUNCTION public.auto_unpublish_sold_vehicle();

-- Conversion monitoring view: crosses lead_eventos_gtm with estoque_publicacoes
CREATE OR REPLACE VIEW public.vw_conversao_anuncios AS
SELECT
  ep.platform,
  COALESCE(v.ad_types->>ep.platform, v.ml_listing_type) AS ad_tier,
  v.marca,
  v.modelo,
  COUNT(DISTINCT l.id) AS total_leads,
  COUNT(DISTINCT leg.id) AS total_eventos_gtm,
  COUNT(DISTINCT CASE WHEN leg.evento_nome = 'lead' THEN leg.id END) AS lead_conversions
FROM public.estoque_publicacoes ep
JOIN public.veiculos v ON v.id = ep.veiculo_id
LEFT JOIN public.leads l ON l.veiculo_id = v.id
LEFT JOIN public.lead_eventos_gtm leg ON leg.lead_id = l.id
GROUP BY ep.platform, COALESCE(v.ad_types->>ep.platform, v.ml_listing_type), v.marca, v.modelo;

-- Error history view for portal sync failures
CREATE OR REPLACE VIEW public.vw_historico_erros_portais AS
SELECT
  ep.platform,
  ep.veiculo_id,
  v.marca,
  v.modelo,
  ep.erro_msg,
  ep.status,
  ep.updated_at
FROM public.estoque_publicacoes ep
LEFT JOIN public.veiculos v ON v.id = ep.veiculo_id
WHERE ep.erro_msg IS NOT NULL AND ep.erro_msg != ''
ORDER BY ep.updated_at DESC;

-- Ensure RLS on estoque_publicacoes (idempotent)
ALTER TABLE public.estoque_publicacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_estoque_pub_v3" ON public.estoque_publicacoes;
CREATE POLICY "auth_select_estoque_pub_v3" ON public.estoque_publicacoes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_estoque_pub_v3" ON public.estoque_publicacoes;
CREATE POLICY "auth_insert_estoque_pub_v3" ON public.estoque_publicacoes
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_estoque_pub_v3" ON public.estoque_publicacoes;
CREATE POLICY "auth_update_estoque_pub_v3" ON public.estoque_publicacoes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_estoque_pub_v3" ON public.estoque_publicacoes;
CREATE POLICY "auth_delete_estoque_pub_v3" ON public.estoque_publicacoes
  FOR DELETE TO authenticated USING (true);

-- Ensure lead_eventos_gtm has RLS for authenticated users
ALTER TABLE public.lead_eventos_gtm ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_lead_eventos_gtm" ON public.lead_eventos_gtm;
CREATE POLICY "auth_select_lead_eventos_gtm" ON public.lead_eventos_gtm
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_lead_eventos_gtm" ON public.lead_eventos_gtm;
CREATE POLICY "auth_insert_lead_eventos_gtm" ON public.lead_eventos_gtm
  FOR INSERT TO authenticated WITH CHECK (true);

-- Ensure ads_audit_logs has RLS for authenticated users
ALTER TABLE public.ads_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_ads_audit_logs" ON public.ads_audit_logs;
CREATE POLICY "auth_select_ads_audit_logs" ON public.ads_audit_logs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_ads_audit_logs" ON public.ads_audit_logs;
CREATE POLICY "auth_insert_ads_audit_logs" ON public.ads_audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);
