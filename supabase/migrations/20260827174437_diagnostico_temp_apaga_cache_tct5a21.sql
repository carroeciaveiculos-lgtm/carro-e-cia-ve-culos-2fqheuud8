-- Diagnostico temporario (27/08/2026): apaga o cache antigo (04/05/2026)
-- da placa TCT5A21 pra forcar uma consulta nova de verdade na API Brasil e
-- confirmar se Cor/Combustivel vem preenchido hoje. So um registro de
-- cache tecnico, nao afeta nenhum veiculo do estoque real.
DELETE FROM public.veiculos_cache WHERE placa = 'TCT5A21';
