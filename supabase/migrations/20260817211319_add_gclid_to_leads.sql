-- Rastreio de Google Ads (17/08/2026, pedido da Adriana) — a conta tem
-- auto-tagging ativado (confirmado via API), o Google usa esse parametro
-- na URL em vez de UTM manual. Sem essa coluna, nenhum lead vindo de
-- anuncio do Google era identificavel como tal.
alter table leads add column if not exists gclid text;
