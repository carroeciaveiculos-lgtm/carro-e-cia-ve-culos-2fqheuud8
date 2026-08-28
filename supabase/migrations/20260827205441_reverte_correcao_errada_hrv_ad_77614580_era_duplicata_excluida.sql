-- Reverte a migracao anterior (corrige_status_real_hrv_ad_code_trocado),
-- que estava ERRADA. A Adriana confirmou que excluiu manualmente, ontem, um
-- anuncio duplicado do HR-V na Webmotors -- e um teste real (ObterFotosCarro)
-- comprovou: 77614580 retorna CodigoAnuncio=0/QuantidadeFotos=0 (excluido,
-- era a duplicata que ela apagou), enquanto 73668233 segue vivo de verdade
-- (CodigoRetorno 500, 20 fotos reais). O anuncio real do HR-V sempre foi
-- 73668233 -- so que ele falha em qualquer AlterarCarro com
-- "CodigoRetorno 43|36: Anuncio nao pode ser alterado", causa raiz ainda nao
-- confirmada (ficha aberta, nao e sobre existir ou nao existir o anuncio).
UPDATE public.estoque_publicacoes
SET post_id = '73668233', status = 'error',
    erro_msg = 'CodigoRetorno 43|36: Anúncio não pode ser alterado (causa raiz ainda não confirmada — anúncio real, com fotos, mas AlterarCarro sempre falha)',
    updated_at = now()
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'PZQ2F46')
  AND platform = 'webmotors';
