-- Botão manual de Publicar/Não publicado por veículo+plataforma (pedido
-- da Adriana, 17/08/2026). Grava quem/quando só quando a mudança de
-- status veio de uma ação manual (botão), não do cron/venda automática.
alter table estoque_publicacoes
  add column if not exists alterado_manualmente_por uuid references usuarios(id),
  add column if not exists alterado_manualmente_em timestamptz;
