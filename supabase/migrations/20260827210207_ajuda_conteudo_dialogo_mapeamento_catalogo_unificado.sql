-- Artigo da Central de Ajuda pro dialogo unificado de mapeamento de
-- catalogo (Webmotors + NaPista) implementado na Sessao 17, conforme regra
-- do projeto de sempre documentar funcionalidade nova/ajustada no painel.
INSERT INTO public.ajuda_conteudos
  (categoria, titulo, o_que_e, para_que_serve, caminho, quando_utilizar, como_utilizar, is_faq, setor_id, grupo)
VALUES (
  'Estoque',
  'Confirmar mapeamento de catálogo (Webmotors e NaPista)',
  'Uma janela que aparece ao salvar um veículo quando a Webmotors e/ou o NaPista não conseguem casar automaticamente o Modelo/Versão do carro com o catálogo deles. Antes, só a Webmotors abria essa janela na hora — o NaPista só avisava por um toast e obrigava ir em Portais confirmar depois. Agora as duas aparecem juntas, na mesma janela, cada uma na sua seção.',
  'Sem esse mapeamento confirmado, o veículo fica bloqueado e não é publicado naquela plataforma — a janela existe pra resolver isso na hora, sem precisar sair do cadastro do veículo.',
  '/admin/estoque (abre ao salvar um veículo, quando necessário)',
  'Sempre que salvar (criar ou editar) um veículo e o sistema não conseguir confiar no Modelo/Versão digitado pra uma ou as duas plataformas — geralmente carros com nome de versão incomum ou recém-lançado.',
  '1. Salve o veículo normalmente (botão "Validar e Salvar").\n2. Se aparecer a janela "Confirmar mapeamento de catálogo", ela mostra uma seção para cada plataforma que precisa de revisão (pode ser só Webmotors, só NaPista, ou as duas).\n3. Em cada seção, escolha entre os candidatos de Modelo e depois de Versão que o sistema encontrou (o % ao lado é o quanto o nome bate).\n4. Se nenhum candidato bater com o carro real, clique em "Fechar" — o veículo fica salvo, e você resolve depois em Portais, sem perder o cadastro.\n5. A janela fecha sozinha quando todas as seções pendentes forem resolvidas.',
  false,
  '308efc6e-5db3-4cc9-83e3-e39ecdccd5e1',
  'operacional'
);
