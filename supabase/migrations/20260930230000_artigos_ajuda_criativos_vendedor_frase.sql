-- Artigos da Central de Ajuda do trabalho de 30/09/2026 (regra do projeto: toda
-- funcionalidade nova no painel ganha artigo). Cada INSERT só roda se o título
-- ainda não existir, então pode ser executado de novo sem duplicar.
-- O artigo "Descrição do veículo: geral e Webmotors" já entrou na migration
-- 20260930180000_descricao_webmotors_e_frase_final.sql.

-- 1) Gerador de Criativos de Anúncio (pendente desde 28/09/2026)
INSERT INTO public.ajuda_conteudos
  (categoria, titulo, o_que_e, para_que_serve, caminho, quando_utilizar, como_utilizar, dependencias, is_faq, setor_id, grupo)
SELECT
  'Estoque',
  'Gerar criativo de anúncio do veículo (Meta Ads e Google Ads)',
  $t$Uma ferramenta dentro do cadastro do veículo que monta uma imagem quadrada (1080 x 1080) pronta para anúncio, a partir de uma das fotos já cadastradas. Existem 4 modelos: Preço em Destaque, Ficha Técnica, Oportunidade e Convite/CTA. Preço, quilometragem, logo e textos são desenhados pelo sistema com os dados reais do veículo. A IA trata só a foto (luz e fundo) e nunca escreve número nem texto na imagem.$t$,
  $t$Criar imagens de anúncio sem depender de designer e sem risco de a IA errar preço ou quilometragem, porque esses valores vêm direto do cadastro. A imagem pode ser baixada para subir no Meta Ads ou no Google Ads, e também fica guardada no veículo para usar de novo.$t$,
  '/admin/estoque (editar veículo, aba Marketing IA)',
  $t$Quando for criar um anúncio pago de um veículo, ou precisar de uma imagem de divulgação com preço e dados certos.$t$,
  $t$1. Abra o veículo em Estoque (botão de editar) e clique na aba "Marketing IA".
2. Em "1. Escolha a foto base", clique na foto que quer usar.
3. Em "2. Escolha o modelo", aparecem os 4 modelos já com o preço e a quilometragem do veículo. Essas prévias são só desenho e não gastam IA.
4. Clique no botão com o nome do modelo que gostou (Preço em Destaque, Ficha Técnica, Oportunidade ou Convite/CTA). Aí sim a IA trata a foto, e isso leva alguns segundos.
5. O resultado aparece em "3. Resultado final". Clique em "Baixar" para salvar a imagem no seu computador, em "Salvar no sistema" para guardar no veículo, ou nos dois.
6. As imagens guardadas aparecem em "Criativos já salvos deste veículo", onde dá para baixar de novo ou apagar (ícone da lixeira).
Observações: o modelo "Oportunidade" só afirma "abaixo da FIPE" quando o preço de venda é pelo menos 5% menor que a referência FIPE do cadastro; caso contrário mostra só o selo "Oportunidade". Cada criativo usa uma foto só e sai no formato quadrado 1080 x 1080.$t$,
  $t$O veículo precisa estar salvo e ter pelo menos uma foto (cadastre em "Fotos & Mídia"). Também precisa ter preço e quilometragem preenchidos, porque eles entram na imagem. As prévias dos modelos dependem da foto escolhida.$t$,
  false,
  '42cc009b-1f94-4bf1-bd2e-8b486f4c11fa',
  'operacional'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ajuda_conteudos
  WHERE titulo = 'Gerar criativo de anúncio do veículo (Meta Ads e Google Ads)'
);

-- 2) Vendedor Responsável do lead
INSERT INTO public.ajuda_conteudos
  (categoria, titulo, o_que_e, para_que_serve, caminho, quando_utilizar, como_utilizar, dependencias, is_faq, setor_id, grupo)
SELECT
  'CRM',
  'Definir o vendedor responsável de um lead',
  $t$Um seletor "Vendedor Responsável" no painel de gestão do lead, que fica na coluna da direita do Gerenciador de Leads e também no Conversador. Nele você escolhe qual vendedor cuida daquele lead.$t$,
  $t$Saber de quem é cada lead. O nome escolhido aparece no cartão do lead no CRM (no lugar de "Sem Vendedor") e permite filtrar por vendedor nos relatórios de Leads e de Clientes. Até 28/09/2026 nenhum dos 117 leads tinha responsável, porque não existia jeito de preencher.$t$,
  'Menu lateral → Vendas → Leads (CRM) (/admin/crm) ou Vendas → Conversador (/admin/conversas), painel de gestão do lead à direita',
  $t$Quando um lead novo chegar e alguém assumir o atendimento, ou quando o lead mudar de mãos entre os vendedores.$t$,
  $t$1. Abra o Leads (CRM) ou o Conversador e clique no lead.
2. No painel da direita, localize o bloco "Vendedor Responsável".
3. Clique no seletor e escolha o nome do vendedor. A lista mostra os usuários ativos do sistema. Para tirar o responsável, escolha "Sem responsável".
4. A escolha é salva na hora, sem botão de salvar e sem mensagem de confirmação.
5. Para conferir, olhe o cartão do lead no CRM: o nome do vendedor aparece nele. Em Relatórios, nas abas Leads e Clientes, dá para filtrar por vendedor.$t$,
  $t$O vendedor precisa ter usuário ativo no sistema para aparecer na lista.$t$,
  false,
  '37b8d5ed-232c-425d-a80e-07b714c473a2',
  'operacional'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ajuda_conteudos
  WHERE titulo = 'Definir o vendedor responsável de um lead'
);

-- 3) Frase final dos anúncios (Regras de IA)
INSERT INTO public.ajuda_conteudos
  (categoria, titulo, o_que_e, para_que_serve, caminho, quando_utilizar, como_utilizar, dependencias, is_faq, setor_id, grupo)
SELECT
  'Regras de IA',
  'Mudar a frase final dos anúncios (Webmotors, Mercado Livre e NaPista)',
  $t$A frase fixa que fecha a descrição de todo anúncio: "Reservamo-nos o direito de corrigir eventuais erros de digitação; valores sujeitos a alteração sem aviso prévio." Ela fica na tela Regras de IA, no campo de texto fixo da regra "Descrição Webmotors (máx. 500)".$t$,
  $t$Trocar a frase em um lugar só e ela valer para Webmotors, Mercado Livre e NaPista. A IA nunca escreve essa frase: o sistema a cola no final, para sair sempre exata.$t$,
  'Menu lateral → Regras de IA (/admin/prompts-ia), card "Descrição Webmotors (máx. 500)"',
  $t$Quando o texto legal mudar, ou quando quiser ajustar o tamanho da frase para sobrar mais espaço ao texto do carro.$t$,
  $t$1. Abra Regras de IA (/admin/prompts-ia) e localize o card "Descrição Webmotors (máx. 500)".
2. Em "Frase final (vai no fim do anúncio de TODAS as plataformas...)", edite o texto. O contador mostra quantos caracteres usou, até 200.
3. Clique em "Salvar texto fixo". Não dá para salvar vazio nem acima de 200 caracteres.
4. A frase nova vale para os próximos textos gerados com IA e para os próximos envios aos portais. Anúncios já publicados só mudam quando o veículo for reenviado.
Atenção: não existe botão de desfazer para essa frase, então copie o texto antigo antes de trocar. Descrições já salvas nos veículos que terminam com uma frase antiga diferente da original continuam com ela no final.
Espaço disponível: na Webmotors a descrição inteira tem no máximo 500 caracteres, então uma frase de 112 deixa 387 para o texto do carro. No Mercado Livre e no NaPista o limite é 800, e sobram 686.$t$,
  $t$Acesso à tela Regras de IA, que é do setor Desenvolvedor e TI.$t$,
  false,
  '9753df9c-b4bc-4a37-9512-19592eca8ca7',
  'operacional'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ajuda_conteudos
  WHERE titulo = 'Mudar a frase final dos anúncios (Webmotors, Mercado Livre e NaPista)'
);
