-- 24/11/2026 (A4): Central de Ajuda acompanha o PR #32 (exclusão segura,
-- despublicar conferindo o código do anúncio, relatório de agendamentos).
-- Só troca trechos exatos dos 3 artigos existentes.

-- 1) Vender, devolver, reativar, despublicar ou excluir um veículo
UPDATE public.ajuda_conteudos
SET como_utilizar = replace(
  como_utilizar,
  '7. "Excluir Veículo" só aparece para o administrador master. A exclusão é permanente: apaga o veículo e os dados ligados a ele (publicações, anúncios, documentos, despesas, simulações e contratos) e desvincula os leads.',
  '7. "Excluir Veículo" só aparece para o administrador master. Antes de perguntar, o sistema confere o veículo. Se ele tiver anúncio ativo em portal (Webmotors, NaPista ou Mercado Livre), contrato de consignação, consignação, documento, despesa ou agendamento de visita, aparece "Exclusão bloqueada" com a lista do que existe, e nada é apagado. Nesse caso, use "Devolver ao Cliente" ou "Marcar como Vendido". Sem nada disso, ele pede confirmação e apaga o veículo de uma vez só (tudo ou nada): se der erro, aparece "Nenhum dado foi apagado". Os leads ligados ao veículo continuam, só perdem o vínculo. A exclusão é permanente.'
)
WHERE id = '4624c201-00b5-46af-8dd8-6005ac8fb336';

-- 2) Publicar e despublicar um veículo nos portais
UPDATE public.ajuda_conteudos
SET como_utilizar = replace(
  como_utilizar,
  '7. Para tirar do ar, clique em "Despublicar" e confirme. O anúncio sai do portal e o veículo continua no estoque.',
  '7. Para tirar do ar, clique em "Despublicar" e confirme. O anúncio sai do portal e o veículo continua no estoque. Na Webmotors e no NaPista, o sistema primeiro confere se tem o código do anúncio registrado. Se não tiver, aparece "Não há código de anúncio registrado no sistema para esta plataforma..." e NADA é alterado. Se o anúncio aparece no portal mesmo assim, avise o suporte para recriar o registro antes de despublicar. Na Webmotors não existe "pausar": despublicar exclui o anúncio, e para voltar é preciso publicar de novo.'
)
WHERE id = '1a8552a5-a4ae-403a-9def-f0fe80cdb209';

-- 3) Acompanhar e Marcar Resultado de Visitas Agendadas
UPDATE public.ajuda_conteudos
SET como_utilizar = replace(
  replace(
    como_utilizar,
    '7. Abaixo do calendário fica a lista.',
    '7. Abaixo do calendário fica o "Relatório" do mês mostrado no calendário. Ele usa os mesmos filtros de cima. Cartões: "Visitas (vieram)" conta só quem foi marcado como "Compareceu"; "Não vieram"; "Cancelados / remarcados"; "Ainda agendados" (avisa quantos já passaram sem resultado marcado); "Taxa de comparecimento" = vieram ÷ (vieram + não vieram). Embaixo, um gráfico por semana. O botão "Exportar CSV" baixa a lista do mês (abre no Excel).
7b. Abaixo do relatório fica a lista.'
  ),
  'O dia antigo continua contando a visita cancelada.',
  'O dia antigo continua contando a visita cancelada. No relatório, remarcar NÃO vira duas visitas: visita só conta quando é marcada como "Compareceu".'
)
WHERE id = '3bcf44fb-7775-46e3-8c23-889dd418e3a5';
