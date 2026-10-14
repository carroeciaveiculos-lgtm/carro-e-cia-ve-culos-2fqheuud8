-- Artigo da Central de Ajuda: leads do formulário do anúncio do Google Ads
-- (function google-ads-leads, 13/10/2026). Só insere se o título ainda não existir.
-- Aplicado em produção via MCP em 13/10/2026 (versão 20261014023759).

INSERT INTO public.ajuda_conteudos
  (categoria, titulo, o_que_e, para_que_serve, caminho, quando_utilizar, como_utilizar, dependencias, is_faq, setor_id, grupo)
SELECT
  'CRM',
  'Receber leads do formulário do anúncio do Google Ads',
  $t$Quando alguém preenche o formulário que aparece dentro do anúncio do Google (a "extensão de formulário de lead"), o Google envia os dados para o nosso sistema e o lead entra sozinho no CRM, com origem "google_ads". Não precisa baixar planilha nem copiar nada do painel do Google.$t$,
  $t$Não perder lead de anúncio e saber de qual campanha ele veio. O lead chega com nome, telefone, e-mail, cidade, o código da campanha do Google e o identificador do clique (gclid). Se o mesmo telefone ou e-mail já tiver um lead ativo, o sistema reaproveita o lead existente e anota o novo contato, em vez de criar um repetido. Se o Google reenviar o mesmo lead, ele não duplica.$t$,
  '/admin/leads (filtrar pela origem "google_ads")',
  $t$Sempre que existir uma campanha do Google Ads com formulário de lead ligado e ativo. Também para conferir se um lead de anúncio chegou.$t$,
  $t$1. Abra Leads (CRM) e use o filtro de origem "google_ads" para ver os leads que vieram do formulário do anúncio.
2. Abra o lead: nas observações aparecem o código da campanha do Google (campanha_google), o código do formulário (formulario_google), a cidade e o identificador do lead no Google (google_lead_id).
3. Para testar a ligação: no Google Ads, abra o formulário de lead, vá na configuração de entrega por webhook e clique em "Enviar dados de teste". O Google deve mostrar sucesso. O teste NÃO cria lead no CRM, só confirma que o sistema respondeu.
4. Para um lead real chegar, o formulário precisa estar ligado a uma campanha ativa e com a URL e a chave do webhook preenchidas (quem configura é o administrador do sistema).
Observações: a URL e a chave do webhook não são escritas aqui por segurança. A chave fica guardada no Supabase (GOOGLE_ADS_LEAD_WEBHOOK_KEY) e deve ser a mesma no Google Ads.$t$,
  $t$Campanha do Google Ads ativa com um formulário de lead ligado, webhook do formulário apontando para a function google-ads-leads e a chave GOOGLE_ADS_LEAD_WEBHOOK_KEY gravada no Supabase e no Google Ads.$t$,
  false,
  '37b8d5ed-232c-425d-a80e-07b714c473a2',
  'operacional'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ajuda_conteudos
  WHERE titulo = 'Receber leads do formulário do anúncio do Google Ads'
);
