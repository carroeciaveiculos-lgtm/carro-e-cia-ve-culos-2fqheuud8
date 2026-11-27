-- 26/11/2026: Central de Ajuda acompanha o campo "Lugares" (versão Webmotors de 5 ou 7 lugares) e a limpeza
-- automática de fotos do R2. Autorização permanente da Adriana para artigos (09/11/2026).

insert into public.ajuda_conteudos (titulo, setor_id, categoria, caminho, o_que_e, para_que_serve, quando_utilizar, como_utilizar, dependencias)
select
  'Informar o número de lugares do veículo (versão de 5 ou 7 lugares na Webmotors)',
  '91be7040-6a3a-425c-9f01-01e2b04900d4',
  'Estoque',
  'Menu lateral → Estoque → Novo Veículo / editar veículo → aba Geral & Valores → campo "Lugares" (/admin/estoque)',
  'Campo "Lugares" no cadastro do veículo (Não informado, 2, 4, 5, 6, 7, 8 ou 9). O sistema usa esse número para escolher a versão certa na Webmotors quando o modelo tem versão de 5 e de 7 lugares (ex.: Toyota Hilux SW4).',
  'Evitar anúncio com a lotação errada. Caso real de 25/11/2026: duas Hilux SW4 de 7 lugares saíram na Webmotors como 5 lugares, porque a FIPE não separa a SW4 por lugares.',
  'Ao cadastrar ou editar qualquer veículo, principalmente SUVs e minivans que existem em 5 e 7 lugares.',
  E'1. No cadastro, aba "Geral & Valores", ao lado de "Portas", escolha o número em "Lugares".\n2. Se a versão do veículo diz "7 Lug.", "7 lugares" ou "7L", o campo já vem com 7 — confira e troque se estiver errado.\n3. Salve normalmente ("Validar e Salvar").\n4. Na escolha da versão Webmotors: com 7 informado, o sistema só considera as versões de 7 lugares; com outro número, descarta as de 7; nos modelos que não têm as duas lotações, nada muda.\n5. Se o modelo tem versões de 5 e de 7 lugares e o campo ficou "Não informado", o veículo vai para revisão com a mensagem "Informe o número de lugares no cadastro". Preencha o campo e use "Remapear" (ou escolha a versão na janela de mapeamento).\n6. Na janela de mapeamento, as versões de 7 lugares aparecem com a etiqueta amarela "7 lugares".\nObservações: veículos já mapeados antes de 26/11/2026 não são refeitos sozinhos; para corrigir um deles, preencha "Lugares" e use "Remapear".',
  'Setor Estoque/Portais. Veículo com marca, modelo, versão e ano preenchidos.'
where not exists (select 1 from public.ajuda_conteudos where titulo = 'Informar o número de lugares do veículo (versão de 5 ou 7 lugares na Webmotors)');

insert into public.ajuda_conteudos (titulo, setor_id, categoria, caminho, o_que_e, para_que_serve, quando_utilizar, como_utilizar, dependencias)
select
  'Limpeza automática das fotos de veículos vendidos, devolvidos ou excluídos',
  '9753df9c-b4bc-4a37-9512-19592eca8ca7',
  'Estoque',
  'Automático (rotina diária às 03h30). Registro nas tabelas r2_limpeza_fila e r2_limpeza_execucoes (Supabase)',
  'Rotina que libera espaço no armazenamento de imagens (Cloudflare R2): 30 dias depois de um veículo virar vendido ou devolvido, as fotos e vídeos dele vão para a lixeira, menos a foto de capa. Veículo excluído: todas as fotos vão para a lixeira 30 dias depois. A lixeira apaga de vez depois de mais 30 dias.',
  'Evitar acumular arquivos que ninguém usa mais (em 26/11/2026 havia 1,76 GB sem uso de 6,35 GB nas pastas de veículos), sem perder o histórico: a capa continua aparecendo nos vendidos, leads antigos e relatórios.',
  'Não precisa fazer nada no dia a dia. Consultar quando sumir uma foto de veículo vendido/devolvido ou para conferir quanto foi limpo.',
  E'1. Ao marcar um veículo como Vendido ou Devolvido, a limpeza fica agendada para 30 dias depois.\n2. Se a venda for desfeita (ou o carro voltar ao estoque) antes disso, o agendamento é cancelado sozinho.\n3. Ao excluir um veículo, a lista de fotos é guardada antes, e a limpeza fica agendada para 30 dias depois.\n4. No dia, a rotina confere de novo: o carro continua vendido/devolvido? a foto é usada em outro lugar (outro veículo, post ainda não publicado)? Se for usada, ela fica.\n5. Só mexe nas pastas de fotos de veículo. Documentos, contratos, notas fiscais e comprovantes nunca entram.\n6. O que sai vai para a pasta lixeira/ do R2 com a data do dia; até a lixeira expirar dá para recuperar (fale com Desenvolvedor e TI).\n7. A Pasta do veículo no Google Drive deve ser movida para outra pasta quando ele for vendido ou devolvido; assim a sincronização do Drive não traz as fotos de volta.\nObservações: a rotina tem modo de ensaio (só anota o que faria) e modo real, ligado por um interruptor no Supabase (R2_LIMPEZA_ATIVA). Cada execução fica registrada.',
  'Setor Desenvolvedor e TI. Interruptor R2_LIMPEZA_ATIVA no Supabase e regra de expiração da pasta lixeira/ no R2.'
where not exists (select 1 from public.ajuda_conteudos where titulo = 'Limpeza automática das fotos de veículos vendidos, devolvidos ou excluídos');

-- Artigo do cadastro: cita o campo novo.
update public.ajuda_conteudos
   set como_utilizar = como_utilizar || E'\nLugares (desde 26/11/2026): preencha o número de lugares ao lado de "Portas"; ele define a versão de 5 ou 7 lugares na Webmotors (veja o artigo "Informar o número de lugares do veículo").'
 where id = '43f41717-6173-4552-8127-c990cee011ee'
   and como_utilizar not like '%Lugares (desde 26/11/2026)%';
