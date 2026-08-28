-- Recoloca o HR-V na fila depois da remocao da trava local de cota
-- (wm-sync/index.ts). RESULTADO: publicado com sucesso real,
-- CodigoAnuncio 78502438, 20 fotos -- mesmo com o Cockpit mostrando 18/18
-- minutos antes, confirmando que a trava local era o unico obstaculo.
INSERT INTO public.estoque_publicacoes (veiculo_id, platform, status)
VALUES ((SELECT id FROM public.veiculos WHERE placa='PZQ2F46'), 'webmotors', 'pending_create');
