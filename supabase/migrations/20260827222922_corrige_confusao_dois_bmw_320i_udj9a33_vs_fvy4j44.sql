-- Adriana esclareceu: o BMW 320i excluido por ela ontem foi o FVY4J44
-- (2015), NAO o UDJ9A33 (2026) -- eu tinha confundido os dois (mesmo
-- marca/modelo, placas parecidas). Confirmado ao vivo no Cockpit
-- (dashboard real, sessao logada da Adriana): UDJ9A33 esta publicado de
-- verdade (publishId 75274239, "Veiculo sem pendencias!", R$ 339.897) --
-- minha correcao anterior (marcando despublicado) estava ERRADA. Reverte.

UPDATE public.estoque_publicacoes
SET status = 'publicado', erro_msg = NULL, updated_at = now()
WHERE veiculo_id = (SELECT id FROM public.veiculos WHERE placa = 'UDJ9A33')
  AND platform = 'webmotors' AND post_id = '75274239';

-- FVY4J44 tinha 2 linhas duplicadas (mesmo bug ja visto no HR-V) -- uma
-- antiga de 13/08 travada em 'publicado', uma nova de 27/08 corretamente
-- 'despublicado' (reflete a exclusao real, confirmada ao vivo: FVY4J44 nao
-- aparece nos 17 do Cockpit). Remove a duplicata antiga.
DELETE FROM public.estoque_publicacoes WHERE id = '82121a03-2bd6-4fcc-b79c-3a325b133b44';
