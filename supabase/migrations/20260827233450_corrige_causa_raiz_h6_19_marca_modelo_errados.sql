-- CAUSA RAIZ REAL do 43|41+43|37 no H6 19 (SGI9C15), descoberta comparando
-- ao vivo com o outro Haval H6 do estoque (SIQ5H93), ja publicado de
-- verdade: nosso cache tinha CodigoMarca=5296/CodigoModelo=20891 pra GWM
-- Haval H6 -- mas o codigo REAL, validado e aceito pela Webmotors hoje, e
-- CodigoMarca=352/CodigoModelo=3895. O 5296/20891 parece ser um codigo
-- antigo/duplicado que nunca deveria ter sido usado pra criar anuncio novo.
-- Nao era o ano, nao era so a versao -- era marca E modelo errados desde o
-- inicio, cascateando pro erro "Marca-Modelo-Versao-Ano Inconsistentes".

-- Atualiza o catalogo cacheado com os dados reais e corretos.
UPDATE public.wm_marcas SET codigo_wm = '352' WHERE codigo_wm = '5296' AND nome_wm = 'GWM';

UPDATE public.wm_modelos
SET codigo_wm = '3895', codigo_marca_wm = '352'
WHERE codigo_wm = '20891' AND codigo_marca_wm = '5296';

-- Substitui o cache de versoes (o antigo, sob o modelo errado, fica orfao
-- e sem uso -- mantido por historico, nao apaga).
INSERT INTO public.wm_versoes (codigo_modelo_wm, codigo_wm, nome_wm, nome_crm)
VALUES
  ('3895', '379306', '1.5 HEV PREMIUM E-TRACTION', '1.5 HEV PREMIUM E-TRACTION'),
  ('3895', '379307', '1.5 PHEV PREMIUM AWD E-TRACTION', '1.5 PHEV PREMIUM AWD E-TRACTION'),
  ('3895', '379448', '1.5 HEV E-TRACTION', '1.5 HEV E-TRACTION'),
  ('3895', '379449', '1.5 PHEV AWD E-TRACTION', '1.5 PHEV AWD E-TRACTION'),
  ('3895', '379677', '1.5 PHEV19 E-TRACTION', '1.5 PHEV19 E-TRACTION'),
  ('3895', '379678', '1.5 HEV2 E-TRACTION', '1.5 HEV2 E-TRACTION'),
  ('3895', '379679', '1.5 PHEV34 AWD E-TRACTION', '1.5 PHEV34 AWD E-TRACTION'),
  ('3895', '380068', '1.5 HEV ONE E-TRACTION', '1.5 HEV ONE E-TRACTION'),
  ('3895', '380207', '1.5 PHEV35 AWD E-TRACTION', '1.5 PHEV35 AWD E-TRACTION')
ON CONFLICT DO NOTHING;

-- Corrige o mapeamento do H6 19 pros codigos reais e corretos. A versao
-- "379677 - 1.5 PHEV19 E-TRACTION" e valida pra AnoModelo 2025/2026 (dado
-- REAL, via ObterVersao) -- bate exato com o ano_modelo real do veiculo
-- (2025), sem precisar de nenhum override.
UPDATE public.wm_mapeamento_veiculos
SET codigo_marca_wm = '352',
    codigo_modelo_wm = '3895',
    codigo_versao_wm = '379677',
    confianca_marca = 1.0,
    confianca_modelo = 1.0,
    confianca_versao = 1.0,
    ano_modelo_override_wm = NULL
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'SGI9C15');

-- Recoloca na fila (pending_create) pro fluxo real publicar em VIP.
-- RESULTADO: testado ao vivo, PUBLICADO COM SUCESSO -- CodigoAnuncio
-- 78502365, 20 fotos enviadas, 0 falhas.
DELETE FROM public.estoque_publicacoes
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'SGI9C15') AND platform = 'webmotors';

INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status)
VALUES ((SELECT id FROM public.veiculos WHERE placa = 'SGI9C15'), 'webmotors', 'pending_create');
