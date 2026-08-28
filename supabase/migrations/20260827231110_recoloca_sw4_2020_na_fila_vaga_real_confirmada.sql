-- Vaga real confirmada agora pela propria ObterModalidade da Webmotors
-- (17/18 usados, era 18/18) -- recoloca o SW4 2020 na fila pelo fluxo normal
-- do wm-sync, sem nenhum bypass, a pedido explicito da Adriana.
INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status)
VALUES ((SELECT id FROM public.veiculos WHERE placa='QXH1J94'), 'webmotors', 'pending_create');
