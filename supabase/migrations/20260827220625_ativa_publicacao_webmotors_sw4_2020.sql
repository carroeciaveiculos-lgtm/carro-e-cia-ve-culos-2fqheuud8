-- Liga publicado_webmotors pro SW4 2020 (QXH1J94), a pedido da Adriana --
-- dispara o trigger real que cria a linha pending_create em
-- estoque_publicacoes.
UPDATE public.veiculos
SET publicado_webmotors = true
WHERE placa = 'QXH1J94';
