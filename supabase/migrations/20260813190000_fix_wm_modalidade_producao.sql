-- Achado em auditoria (13/08/2026): CodigoModalidade 2943 ("Anúncio Básico")
-- só existe na conta genérica de homologação. Consultado ObterModalidade
-- contra a conta de produção real (CNPJ 10196974000146) e o código
-- correspondente lá é 6351 (20 anúncios contratados, 17 em uso no momento da
-- consulta). Existe também 6914 "Super Acelerador Vip - M" (2 contratados,
-- 2 em uso — sem vaga). Todo veículo mapeado com 2943 falhava a publicação
-- em produção com CodigoRetorno 56 ("modalidade inválida para o
-- Revendedor") — afetava os 9 veículos já mapeados nesta migration.
UPDATE wm_modalidades SET codigo_wm = '6351' WHERE codigo_wm = '2943';
INSERT INTO wm_modalidades (codigo_wm, descricao) VALUES ('6914', 'Super Acelerador Vip - M') ON CONFLICT DO NOTHING;

UPDATE wm_mapeamento_veiculos SET codigo_modalidade_wm = '6351' WHERE codigo_modalidade_wm = '2943';
