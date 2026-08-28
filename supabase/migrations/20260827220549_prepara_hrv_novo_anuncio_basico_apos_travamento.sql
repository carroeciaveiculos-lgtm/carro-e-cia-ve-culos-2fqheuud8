-- 73668233 (existente) esta travado: existe de verdade (fotos reais) mas
-- recusa qualquer AlterarCarro com 43|36 e nao aparece em ObterEstoqueAtual.
-- A Adriana pediu publicacao real do HR-V em Basico -- unico jeito de
-- entregar isso de fato e' criar um anuncio novo (IncluirCarro), ja que o
-- antigo nao responde a alteracao nenhuma. Remove a linha 'pending_close'
-- duplicada/estranha e reseta a linha principal pra pending_create sem
-- post_id, sinalizando "criar anuncio novo".
DELETE FROM public.estoque_publicacoes WHERE id = 'f1ead3ff-9dbc-46b9-bd38-722ecb9a3953';

UPDATE public.estoque_publicacoes
SET status = 'pending_create', post_id = NULL,
    erro_msg = 'Anúncio anterior (73668233) travado (43|36, real mas sem resposta a alteração) — tentando anúncio novo a pedido da Adriana',
    updated_at = now()
WHERE id = '582a068b-62b3-463c-9c34-a1a17aff17a6';
