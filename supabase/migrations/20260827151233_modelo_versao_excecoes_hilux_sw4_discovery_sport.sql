-- Achado real testando a Fase 1 (27/08/2026): a lista de excecao fechada na
-- sessao 16 nao incluia esses 2 casos, e o teste a seco nos 26 veiculos
-- ativos cortou os dois errado.
-- 'Hilux SW4' -- ja investigado a fundo nas sessoes 14/15 (regra propria
-- em napista-mapear-veiculo pra tratar como modelo distinto de 'Hilux').
-- 'Discovery Sp.' -- literal como esta abreviado no cadastro (nao
-- 'Discovery Sport' por extenso, que nao aparece no texto real).
INSERT INTO public.modelo_versao_excecoes (tipo, termo) VALUES
  ('composto', 'Hilux SW4'),
  ('composto', 'Discovery Sp.')
ON CONFLICT (tipo, termo) DO NOTHING;
