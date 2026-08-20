# Memória de trabalho — Carro e Cia

Este arquivo existe pra responder uma pergunta: **"onde paramos?"** — sem
precisar reler o histórico inteiro de conversas. Diferente do
`AUDIT_REPORT.md` (mantido como está, não é mais atualizado), este arquivo é
pra ser mantido em dia de verdade. Detalhe técnico por integração continua
nos arquivos `docs/*.md` — aqui é só o resumo de estado + pendências.

Última atualização: 2026-08-20 (sessão 10).

**Pasta de trabalho deste projeto:** `C:\Projeto\Revenda Carro e Cia\carro-e-cia-ve-culos-2fqheuud8`
(sempre abrir sessão nova aqui pra continuar — ver também `CLAUDE.md`).

## O que está no ar hoje

- **Webmotors — 2 correções de causa raiz + 2 regras novas (20/08/2026)**:
  investigando os "2 pendentes" e o log de erro que a Adriana viu no painel.
  (1) **Causa raiz corrigida**: `wm-confirmar-mapeamento` confirmava
  modelo/versão e marcava `mapeado`, mas nunca gravava
  `codigo_cor_wm`/`codigo_cambio_wm`/`codigo_combustivel_wm` — o guard do
  `wm-sync` bloqueava a publicação, mas o painel dizia "liberado pra
  sincronização" (mesma classe de bug do achado em `publicar-social` hoje).
  `matchCatalogoExato` foi extraída pra `_shared/wm-catalogo-match.ts` e
  agora roda também aqui; se cor/câmbio/combustível não baterem no catálogo,
  volta pra `revisao_necessaria` com aviso claro em vez de mentir "sucesso".
  Achado real corrigido na hora: Honda City Hatchback Touring (`TCQ0B23`,
  tinha 5 tentativas falhas hoje) — completei o mapeamento manualmente
  (cor/câmbio/combustível batiam certinho no catálogo) e testei ao vivo:
  publicado com sucesso, `CodigoAnuncio 78229773`, 20 fotos enviadas, 0
  falhas. (2) **Nova regra — exclusão permanente**: a pedido da Adriana,
  Toyota Hilux SW4 SRX (`PYT5J89`) e RAM Rampage R/T Hurricane (`GTN5D81`)
  não serão publicados na Webmotors — `status_sincronizacao =
  'excluido_manualmente'`, e `wm-mapear-veiculo` agora respeita esse status
  (não reavalia se o veículo for salvo de novo no admin). (3) **Nova regra —
  fila não fica mais travada por cota estourada**: quando a modalidade
  Básico está cheia, `wm-sync` agora remove a linha da fila em vez de deixar
  presa em "erro" pra sempre (achado: 4 veículos parados desde 13/08/2026,
  7 dias, sem ninguém conseguir agir — limpos manualmente também). Detalhe
  completo em `docs/webmotors-integracao.md`, seção "Correções e regras
  novas — 20/08/2026".
- **Post de "Ideias com IA" corrigido — não era publicado de verdade
  (20/08/2026)**: achado em teste ao vivo — `IdeiasSociais.tsx` salvava
  `social_posts.redes` como lista (`['facebook','instagram']`) em vez do
  formato objeto que `publicar-social` espera; sem bater o formato, nenhuma
  rede era chamada e o post virava "Publicado" com sucesso vazio (silencioso,
  sem erro registrado). Corrigido nos dois lados (salva certo + normaliza
  formato antigo defensivamente) e o log de integração agora grava o
  `post_id`/link real do Facebook e `media_id` do Instagram em todo sucesso,
  não só quando dá erro. Detalhe em `docs/meta-integracao.md`.
- **Encaminhamento de consórcio/seguro corrigido + número novo dedicado
  (19/08/2026, sessão 9)**: autocrítica sobre o mapeamento da Clara achou
  que `encaminharParaParceiro()` (`ai-sdr/index.ts`) só avisava o parceiro
  por dentro — o cliente nunca recebia link nenhum, e a Clara continuava
  ativa no mesmo chat depois de "encaminhar" (risco de responder sobre
  assunto que não domina). Corrigido: agora manda o cliente um link
  `wa.me` pro número certo e desliga a IA pra esse lead (`ai_enabled =
  false`), igual já acontecia em `solicitar_atendimento_humano`. Aplicado
  aos dois tipos (consórcio e seguro auto). Junto, criado um WhatsApp
  Business novo (`5534998037651`) só pra consórcio — antes usava o celular
  pessoal da Adriana (`5534984080220`), que agora fica só pra alertas
  administrativos internos. Trocado em `ConsorcioAuto.tsx`, `Sobre.tsx`
  (card "Falar com Adriana") e `PARCEIROS_ENCAMINHAMENTO`. Detalhe
  completo em `docs/origem-leads.md` e regra de roteamento atualizada no
  `CLAUDE.md`.
- **Origem de leads — clique do site agora rastreado (19/08/2026, sessão 9)**:
  auditoria pedida pela Adriana nos 50 leads mais recentes achou que
  clique em botão de WhatsApp do site (12 pontos diferentes, todos via
  `handleCommercialCTA`) não carregava nenhum dado de volta pro CRM — um
  link `wa.me` é só texto. Toda mensagem sem o pacote de anúncio da Meta
  caía em `whatsapp_organico`, misturando cliente que clicou no site com
  contato realmente espontâneo. Corrigido: `cta-router.ts` embute uma
  referência (página/botão/veículo/UTM) no fim da mensagem pré-preenchida
  — `receive-leads` lê, grava origem `site_whatsapp` com os dados certos,
  e remove a tag antes de salvar no histórico ou mandar pra Clara.
  Reaproveitou o `obterAtribuicaoAnuncio()` que já existia (17/08) e só
  era usado nos formulários de consignação. Testado ao vivo com payload
  simulado — funcionando, registro de teste apagado. Detalhe completo em
  `docs/origem-leads.md`.
  **[RESOLVIDO 19/08/2026] `ai_score` e `temperatura` (itens 2 e 3)**:
  achado mais fundo — não era só `ai_score` nunca escrito, era
  `atualizar_estagio_lead`/`agendar_visita` praticamente nunca chamados
  pela Clara na prática (lead com 36 mensagens trocadas ainda em
  status='novo'; `agendamentos_visita` com 0 registro em todo o banco).
  Corrigido com 3 mudanças: (1) `ai_score` agora calculado por código
  (`_shared/lead-score.ts`), sem depender de nenhuma decisão da IA —
  soma pontos por veículo identificado, 5+ mensagens, e-mail, visita
  agendada, origem paga; (2) prompt da Clara ganhou seção nova
  "QUALIFICAÇÃO DO LEAD" com gatilhos concretos de quando marcar
  morno/quente; (3) bug pequeno corrigido — filtro de leads quentes no
  comando do WhatsApp buscava `Quente` maiúsculo, nunca batia com nada.
  Testado ao vivo com conversa simulada completa (4 mensagens): score
  foi 0 → 15 → 75, temperatura virou quente, status virou agendamento,
  e o primeiro `agendamentos_visita` da história do banco foi criado.
  Detalhe completo em `docs/origem-leads.md`.
  **[RESOLVIDO 19/08/2026] Itens 6 e 7 (vocabulário de `origem` +
  alerta de canal silencioso)**: padronizado `origem` num conjunto
  fechado de valores (whatsapp_organico, site_whatsapp, facebook_ads,
  instagram_ads, meta_lead_ads, facebook_dm/instagram_dm,
  comentario_facebook/instagram, google_ads, site_formulario,
  site_consignacao, mercadolivre/webmotors/icarros, avaliacao_avulsa,
  manual, clara) em ~9 arquivos que gravavam texto livre cada um do seu
  jeito. Registros antigos também padronizados (78 'whatsapp' →
  whatsapp_organico, 2 'LP' → site_consignacao). Removida a pergunta
  "Como nos conheceu?" do formulário de consignação da home (decisão da
  Adriana) — colidia com o campo técnico de origem.
  `daily-report-cron` ganhou alerta: se facebook_ads/instagram_ads/
  whatsapp_organico/site_whatsapp ficar 7+ dias sem lead, avisa no
  relatório diário do WhatsApp. Detalhe completo em `docs/origem-leads.md`.
  **Adiado pro futuro (decisão da Adriana)**: confirmar webhook do
  Mercado Livre/Webmotors nos portais; NaPista não tem webhook de lead
  nenhum, só endpoint de consulta — precisaria de cron.
  **[RESOLVIDO 19/08/2026] Imagem do anúncio no Conversador**: achado —
  a Meta sempre mandou `thumbnail_url`/`video_url` do criativo do anúncio
  no `referral`, nunca foi guardado (mesmo padrão do achado de
  `referral.body`, 17/08). 2 colunas novas em `leads`
  (`anuncio_thumbnail_url`, `anuncio_video_url`) — `receive-leads` baixa a
  imagem e re-hospeda no R2 (o link da Meta expira), grava o link do
  vídeo direto (não expira). `ConversationPanel.tsx` mostra a imagem no
  lugar do avatar, clicável pro anúncio no Facebook. Testado ao vivo com
  payload simulado — imagem confirmada acessível publicamente. Detalhe em
  `docs/origem-leads.md`.
- **NaPista — PRODUÇÃO LIBERADA, 25/25 VEÍCULOS PUBLICADOS DE VERDADE
  (18/08/2026, sessão 8)**: NaPista aprovou o client_id `carro-e-cia` pra
  produção. Migrei toda a integração (5 functions) de
  `api.development.napista.com.br` pra `api.napista.com.br` de verdade,
  reautentiquei do zero (novo sellerId real). Achado grande: já existiam
  **19 anúncios reais publicados antes da nossa integração** (carregados
  por outro canal, não pela nossa function) — 14 batiam com o estoque
  atual (adotados no controle interno, sem duplicar), 5 eram de veículos
  já vendidos/devolvidos (despublicados). Sincronizei catálogo de
  produção (92 marcas), mapeei os 25 veículos disponíveis (14 usando o
  `versionId` real já publicado, sem chute; 11 por correspondência de
  texto, a maioria revisada manualmente) e publiquei os que faltavam.
  **3 bugs reais achados e corrigidos na hora**: (1) `napista-sync` cria
  o anúncio mas não publica sozinho (fica em DRAFT, precisa de um PUT
  separado — ainda não corrigido na function, só contornado manualmente
  desta vez); (2) `sync_para_estoque` pulou KIA e VOLKSWAGEN
  silenciosamente (populei na mão); (3) chamar a function duas vezes com
  fila cheia duplicou 1 anúncio (Kia Sportage — órfão apagado). Resultado
  final confirmado direto na API: 25 publicados, 0 rascunhos, 0
  duplicatas. Detalhe completo em `docs/integracao-napista.md`.
  **[RESOLVIDO 18/08/2026]** `napista-sync` corrigida — depois de criar
  o anúncio e subir as fotos, chama `PUT .../PUBLISHED` automaticamente.
  Testado ao vivo com veículo fake temporário (apagado depois): criado já
  como `PUBLISHED`, sem passo manual.
  **[INVESTIGADO 19/08/2026]** causa raiz do erro silencioso de
  `sync_para_estoque` (KIA/VOLKSWAGEN sem modelo cacheado): refiz a mesma
  sequência de chamadas, todas as 14 marcas responderam 200 — não achei
  bug reproduzível, mais provável foi falha pontual de rede daquele dia.
  Como não dá pra corrigir a causa (não é determinística), adicionei
  mitigação: `napistaFetch()` tenta 2x antes de desistir, e os `upsert`
  de marca/modelo agora logam erro real em vez de falhar em silêncio.
- **Assinatura eletrônica via Autentique — FUNCIONANDO DE PONTA A PONTA
  (18/08/2026, sessão 8)**: a Adriana confirmou que `AUTENTIQUE_TOKEN` já
  estava configurado — o problema real eram **3 bugs de integração** na
  `enviar-para-assinatura`, nunca detectados porque a function tinha um
  modo mock silencioso (removido). Achados e corrigidos, testando ao
  vivo com a API real do Autentique:
  1. `document.file` mandava a URL como texto — o schema exige upload de
     arquivo de verdade (`Upload!`, multipart/form-data). Corrigido:
     baixa os bytes do PDF e sobe via `FormData` nativo do Deno.
  2. `webhook_url`/`auto_remind`/`expires_in` não existem em
     `DocumentInput` — código antigo inventava esses campos. Removidos.
  3. O cliente não é sempre `signatures[0]` — o Autentique adiciona a
     conta dona do token como signatário extra automaticamente. Corrigido
     pra buscar o assinante certo pelo nome, não pela posição. Também
     corrigido `signatures[].url` (não existe) pra
     `signatures[].link.short_link` (correto).
  Decisão da Adriana no caminho: cliente é assinante só por **nome**, sem
  e-mail (com e-mail, o Autentique manda convite direto e não devolve
  link pra gente controlar via WhatsApp/e-mail); e-mail da loja usa
  domínio do **Resend** (`vendas@carroeciamotors.com.br`), não do Brevo
  (que é só pra marketing) — `BREVO_SENDER_EMAIL` também estava causando
  erro de validação por conta própria. **Testado com 2 documentos reais
  criados no Autentique** (2 dos 20/mês usados, autorizada pela Adriana);
  segundo teste confirmou o link de assinatura do cliente vindo certo
  (`https://assina.ae/...`). Registros de teste apagados do banco.
  **[RESOLVIDO 18/08/2026]** "Enviar E-mail" no `AssinaturaDialog.tsx`
  agora dispara e-mail de verdade via Resend com o link de assinatura
  (antes só mostrava/copiava o link e mentia dizendo que tinha enviado).
  `enviar-para-assinatura` reimplantada com o parâmetro `enviar_email`.
  Testado ao vivo: template isolado (confirmado recebido) + fluxo
  completo pela function real (3º dos 20 documentos/mês do Autentique
  usado, sobram 17) — `email_status.enviado: true`, e-mail recebido com
  link funcionando. Registro de teste apagado.
  **Em aberto pra depois**: webhook de conclusão (`webhook-autentique`)
  não testado ao vivo, precisa confirmar se está registrado no painel da
  conta Autentique.
- **Decisões sobre os achados da Documentação de API implementadas
  (18/08/2026, sessão 8)**: a Adriana decidiu, item por item, o que fazer
  com os achados de código morto/incompleto encontrados. Implementado:
  - **`ai-agents` removida** — `src/lib/ai-agents.ts`,
    `supabase/functions/ai-agents/` apagados, function desimplantada do
    Supabase.
  - **`gerar-imagem` corrigida** — agora grava no R2 (mesmo padrão de
    `gerar-imagem-vaga`), não mais no Supabase Storage. Reimplantada.
  - **`gerar-pdf-contrato` reescrita por completo** — antes só devolvia
    HTML pro navegador imprimir, sem persistir nada; agora gera PDF real
    (jsPDF) pra qualquer um dos 4 tipos de contrato (venda, compra,
    consignação, termo de entrega — não só consignação, a pedido da
    Adriana, já que qualquer documento que precise de assinatura remota
    deve ter essa opção) e sobe pro bucket `contratos-consignacao`.
    **Achado no caminho**: o bucket tinha `allowed_mime_types =
    ['document/pdf', ...]` — "document/pdf" não existe como MIME type
    (o certo é `application/pdf`), bloquearia qualquer upload de PDF
    real que já tivesse sido tentado. Corrigido.
  - **Migration `contratos_consignacao_tipo_documento`** — tabela ampliada
    com coluna `tipo_documento`, cobre qualquer tipo de contrato agora,
    não só consignação.
  - **Nova seção "Gerar Documento de Contrato" em
    `/admin/modelos-documentos`** — achado no caminho: o painel de ações
    do contrato (`PainelContratoAcoes.tsx`, com os 3 botões
    DOCX/PDF/Assinatura Autentique) **nunca tinha sido colocado em
    nenhuma tela do sistema** — existia no código, órfão. Construída
    seção nova (mais simples, não reaproveitou os componentes órfãos
    porque o formato de dado deles é específico de consignação) com
    seletor de tipo de documento + veículo (opcional, preenche
    proprietário automático) + geração de PDF + botão de assinatura via
    Autentique.
  - **Testado ao vivo, ponta a ponta**: gerei um "Contrato de Venda" de
    teste via `curl` direto — PDF real confirmado (magic bytes `%PDF-1.3`
    corretos). Testei o envio pro Autentique com esse PDF real (usando 1
    dos 20 do limite mensal, autorizado pela Adriana) — **ainda caiu em
    modo mock**, confirmando que o problema real agora é só o
    `AUTENTIQUE_TOKEN` (ausente/inválido), não mais o PDF. Registro de
    teste apagado do banco; sobrou 1 arquivo PDF de teste no Storage
    (privado, sem dado sensível) que não consegui apagar sem sessão de
    usuário — baixa prioridade.
  - **Mantido sem mexer (decisão da Adriana)**: `sync-estoque` e
    `admin-plataformas-api` continuam arquivadas, sem remoção.
  - **[RESOLVIDO 18/08/2026] Migração R2 — já tinha sido feita por fora.**
    A Adriana lembrou que já tinha rodado essa sincronização via
    PowerShell dias antes; conferido no Storage e confirmado: os 10
    buckets que `auto-migrate-r2` migraria estão todos vazios hoje, só
    sobrou dado nos 3 buckets pequenos esperados. Rotacionei
    `AUTO_MIGRATE_SECRET` (valor antigo ilegível) e implantei
    `auto-migrate-r2` pela primeira vez (nunca tinha sido implantada,
    só existia no código) achando que precisaria rodar — achei um bug
    real (`unexpected end of file`, incompatibilidade AWS SDK x Deno) mas
    não vale a pena corrigir agora, não tem mais nada pra migrar. Detalhe
    em `docs/admin-infraestrutura.md`.
  - **Correção de achado anterior**: o botão "Compartilhar veículo" (que
    eu tinha documentado como "não existe") **já existia** —
    `Veiculo.tsx`, ícone `Share2`, já usa `getShareUrl()` que já gera o
    link `/s/{slug}` corretamente. Minha busca anterior não pegou porque
    o link é montado num template string. Corrigido em
    `docs/admin-infraestrutura.md`.
- **Sitemap corrigido (18/08/2026, sessão 8)**: `public/sitemap.xml`
  (estático, parado desde 20/04/2026, só 9 veículos) removido; regra nova
  em `public/_redirects` faz `/sitemap.xml` redirecionar (301) pra function
  `sitemap`. **Primeira tentativa (status 200/proxy) quebrou o deploy** —
  Cloudflare Workers Static Assets só permite proxy pra caminho relativo
  do mesmo domínio, não URL externa (erro exato:
  "Proxy (200) redirects can only point to relative paths"). Descoberto
  investigando via API do Cloudflare (`workers/scripts/.../builds`) depois
  que o primeiro push não refletiu no site — o deploy tinha falhado
  silenciosamente, site continuou no ar normal com a versão anterior, só
  a correção que não subiu. Corrigido pra 301 (mesmo padrão do `/s/:slug`
  do `og-vehicle`, já comprovado funcionando) e reenviado. **[FECHADA]
  Confirmado em produção** (commit `86b6c48`, build com sucesso):
  `/sitemap.xml` redireciona (301) e devolve 40 URLs reais (10 fixas + 25
  veículos + 5 posts), todas com `<lastmod>` — antes eram 19 sem data
  nenhuma.
- **Documentação de API — CONCLUÍDA (18/08/2026, sessão 8)**: os 4 grupos
  (67 functions, `docs/documentacao-api.md`) + os 4 artigos resumo na
  Central de Ajuda (`grupo='dev_ti'`) — um por grupo, apontando pro doc
  técnico completo. Junto, corrigido um achado real: `gerar-conteudo` foi
  a única function do projeto que não tinha a rede de segurança das duas
  grafias da chave do Gemini (`GEMINI_APY_KEY`, nome real confirmado pela
  Adriana, vs. `GEMINI_API_KEY`) — corrigida e reimplantada
  (`supabase functions deploy gerar-conteudo`).
- **Correção de achado anterior (18/08/2026)**: o trigger órfão removido
  ontem (`sync_to_crm`) não apontava pra "sobra de template" como eu tinha
  concluído — apontava pra um projeto Supabase real da Adriana ("CRM
  CARRO E CIA"), só que numa organização diferente
  (`carroeciamotors_crm`) que eu não enxergava antes. **Escopo confirmado
  pela Adriana**: trabalhar só neste projeto (`htpcqdbhktmvppfemnad`,
  "Projeto Site Carro e Cia") — nunca investigar os outros projetos dela.
  Varredura completa feita a pedido dela (código + todas as colunas de
  texto/JSON do banco + cron + funções) confirmando que não sobrou
  nenhuma outra referência a projetos externos além do trigger já
  removido.
- **Documentação de API — grupo 4 (Infraestrutura) escrito, os 4 grupos
  completos (18/08/2026, sessão 8)**: `admin-infraestrutura.md` (5
  functions — R2 e SEO). **Achado mais concreto da sessão inteira**:
  `/sitemap.xml` (prometido no `robots.txt` pro Google) responde 200 com
  XML válido, mas **não vem da function `sitemap`** — vem de
  `public/sitemap.xml`, arquivo estático parado desde **20/04/2026**, com
  só 19 URLs (9 veículos) contra os 25 veículos disponíveis hoje. A
  function que geraria o sitemap certo, ao vivo, nunca é chamada — o
  arquivo estático sempre ganha. Achados menores: `og-vehicle` (prévia
  rica de veículo pro WhatsApp/Facebook) está pronta mas nada no site
  gera o link `/s/{slug}` que a aciona; `auto-migrate-r2` e
  `migrar-storage-r2` (migração Supabase Storage → R2) rodaram uma vez,
  travaram/pararam, sem cron — conecta com o achado do `gerar-imagem`
  (grupo 3): imagem que cai no Supabase Storage hoje não tem mais
  nenhum processo automático levando pro R2. Índice
  (`docs/documentacao-api.md`) atualizado — **os 4 grupos (67 functions)
  estão documentados**. Falta só o resumo simplificado dos grupos 2, 3 e
  4 na Central de Ajuda (só o grupo 1 tem resumo lá).
- **Documentação de API — grupo 3 (IA e PDFs) escrito (18/08/2026, sessão
  8)**: `admin-ia-conteudo.md` (9 functions) + `admin-pdfs.md` (3
  functions), `ai-sdr` continua só linkada em `leads-e-sdr.md`. **Achados
  novos**: (1) `ai-agents` nunca foi chamada por nada (mesmo padrão de
  código pronto e esquecido); (2) `gerar-conteudo` lê só o nome de
  variável do Gemini com erro de digitação (`GEMINI_APY_KEY`), sem
  fallback pro nome certo que as functions irmãs já corrigiram — risco de
  cair silenciosamente pra outro provedor; (3) `gerar-imagem` grava no
  Supabase Storage em vez do R2, diferente do resto do sistema; (4) **achado
  importante — fechou o mistério do Autentique**: `gerar-pdf-contrato` não
  gera PDF nenhum, só devolve HTML pro navegador imprimir — e o `pdf_url`
  mock do `CTR-41` (achado antes, ver `docs/autentique-integracao.md`) era
  literalmente um PDF de teste do W3C (`dummy.pdf`), confirmando que o
  fluxo de assinatura nunca teve um contrato real de verdade pra assinar.
  Índice atualizado — grupos 1, 2 e 3 escritos, falta o grupo 4
  (Infraestrutura, R2+SEO) e o resumo dos grupos 2 e 3 na Central de
  Ajuda (só o grupo 1 tem resumo lá até agora).
- **Trigger órfão removido (18/08/2026, sessão 8)**: `sync_to_crm` em
  `operacional.veiculos` (schema paralelo vazio, mesmo caso de
  `operacional.leads` já achado antes) chamava um projeto Supabase de
  fora da organização (`zsqmlbcxiqggzsehzqdv`, não é
  Motores Hub/IntegradorWeb/Carro e Cia), função `sync-inventory` que
  nem existe neste repositório — sobra de template da ferramenta que
  gerou o projeto originalmente (commits antigos assinados "Skip
  <skip@usecurling.com>"). Confirmado seguro (schema inteiro sem outro
  trigger, sem referência no código, sem FK) e removido via migration
  `remove_trigger_sync_to_crm_orfao`. Enquanto investigava isso,
  também confirmado que só existem 3 triggers no banco desse tipo
  (tabela → chama Edge Function): `trigger_notify_new_vehicle`
  (→ `notify-new-vehicle`), `trigger_notify_vehicle_sold`
  (→ `meta-capi-postback`, já documentado) e o que foi removido agora.
  As 3 tabelas do schema `operacional` (`leads`, `veiculos`,
  `configuracoes`) continuam existindo, vazias — decisão de apagar o
  schema inteiro não foi pedida, fica pra depois se a Adriana quiser.
- **Documentação de API — grupo 2 (Internas do admin) escrito (18/08/2026,
  sessão 8)**: 3 docs novos — `admin-usuarios-acesso.md`,
  `admin-orquestracao-portais.md`, `admin-automacoes-internas.md` — as 14
  functions do grupo, índice atualizado. **2 achados sérios, só
  documentados**: (1) `sync-estoque` e `admin-plataformas-api` são código
  morto (nenhum caller vivo — nem tela, nem cron, nem outra function);
  `admin-plataformas-api` tem uma armadilha se algum dia for reativada
  (só libera acesso pro e-mail hardcoded `adriana.araujo@kmzero.com.br`
  via sessão normal, ignora `usuarios.nivel` — bloquearia até a própria
  Adriana no login principal); (2) `notify-new-vehicle` (aviso de veículo
  novo no estoque) tem fallback pro número da **Clara** (atendimento ao
  cliente) em vez da equipe de vendas, porque a variável
  `WHATSAPP_SALES_TEAM_PHONE` não aparece configurada em lugar nenhum do
  projeto — risco real de aviso interno caindo no WhatsApp de cliente.
  Índice (`docs/documentacao-api.md`) atualizado, grupo 3 (IA/PDFs) e
  grupo 4 (Infra) ainda faltam.
- **Central de Ajuda reorganizada em 4 menus (18/08/2026, sessão 8)**:
  Operacional / Processos (por setor) / Dev e TI (restrito) / FAQs,
  pedido da Adriana. Migration `ajuda_conteudos_grupo_e_restricao_dev_ti`
  — coluna `grupo` nova + RLS que restringe `grupo='dev_ti'` a
  admin_master/gerente (antes QUALQUER logado lia tudo, sem exceção
  nenhuma — achado na auditoria). `Ajuda.tsx`, `ManualFormModal.tsx` e
  `services/ajuda.ts` atualizados; aba "Dev e TI" só aparece pra quem
  tem permissão. Limpeza de dado no mesmo pacote: apagadas 2 duplicatas
  ("Estoque" vs "Estoque e Integrador", "Agendador de Postagens" vs
  "Agendador de Redes Sociais"), categoria dos 3 FAQs padronizada, e
  corrigido endereço errado hardcoded no FAQ "Onde fica a loja?"
  (mostrava "Avenida Principal, 1000" fictício, não o endereço real da
  loja). 11 artigos classificados: 7 Operacional, 1 Dev e TI, 3 FAQ,
  0 Processos ainda (nenhum existe — setores como Consórcio/Seguro nem
  têm tela própria). Build e lint limpos, **não testado no navegador**
  (sem login) — pedir pra Adriana conferir a tela antes de considerar
  100% validado, principalmente a aba Dev e TI sumindo pra usuário
  `operador`.
  **Ajustes pedidos após teste (18/08/2026, mesma sessão)**: editar/apagar
  conteúdo agora é exclusivo de `admin_master` (antes incluía `gerente`
  também) — migration `ajuda_conteudos_editar_apenas_admin_master`, RLS e
  `Ajuda.tsx` atualizados (`podeEditar` separado de `podeVerDevTi`, que
  continua admin_master+gerente). Setor novo **"Todos"** criado na tabela
  `setores`, usado pra reclassificar os 4 artigos Operacionais que
  estavam sem setor definido (Dashboard, Gerenciador de Leads, Estoque e
  Integrador, Agendador de Redes Sociais).
- **Documentação de API — índice + grupo 1 (Integrações) escrito
  (18/08/2026, sessão 8)**: `docs/documentacao-api.md` (índice mestre,
  67 functions em 4 grupos) + 4 docs novos no padrão "referência
  técnica" (`meta-integracao.md`, `autentique-integracao.md`,
  `consultas-externas.md`, `google-drive-integracao.md`) — os outros
  3 clusters do grupo 1 (Webmotors, Mercado Livre, NaPista) já tinham
  doc, só linkados. **3 achados sérios no caminho, todos só
  documentados (decisão da Adriana foi não investigar/corrigir agora)**:
  (1) `enviar-para-assinatura` (Autentique) tem modo mock silencioso —
  único contrato que passou por ela (`CTR-41`, 16/04/2026) está com
  link falso, parado em "pendente" há 4 meses; (2) `consultar-cpf` e
  `consultar-placa` têm o mesmo padrão de mock silencioso, mas sem
  contaminação encontrada nas tabelas reais hoje; (3) `whatsapp-webhook`
  e `webhook-portais` são código morto — nunca receberam tráfego real
  do Meta (confirmado via contagem de linhas nas tabelas que cada uma
  escreveria); `receive-leads` é o único webhook do Meta realmente
  ativo. Grupos 2 (Internas), 3 (IA/PDFs) e 4 (Infra) ainda não
  escritos — só o índice com descrição de 1 linha por function.
- **2 artigos da Central de Ajuda criados (18/08/2026, sessão 8)**, via
  skill `manual-operacional`: "Avaliar Veículo de Cliente" (setor
  Vendas, `/admin/avaliacao`) e "Editar Dados da Loja (Endereço,
  Horário e Logo)" (setor Desenvolvedor e TI, `/admin/configuracoes`,
  aba Loja & SEO). Fecha a pendência que tinha ficado devendo de
  17/08. Checklist (`docs/manual-operacional-contexto.md`) atualizado
  com ✅ nas duas linhas. Aba "Contatos"/"Brain IA"/demais de
  Configurações continuam sem artigo.

- **Clara (SDR via WhatsApp/Instagram)**: atende, consulta estoque, agenda
  visita/avaliação, pede e-mail, escala pra humano quando qualificado.
  Ressalva conhecida: o modelo às vezes *diz* que agendou sem de fato chamar
  a função — mitigado com alerta automático (`logs_integracao`, portal
  `clara_confirmacao_sem_acao`), não eliminado.
- **Webmotors**: produção, com cota (18 Básico + 2 Super Vip = 20), fotos,
  opcionais e regra de PrecoReal (De/Por) — ver `docs/webmotors-integracao.md`.
- **Mercado Livre**: sincronização automática ativa (cron a cada 30min).
- **Agendamentos** (`/admin/agendamentos`): painel + lembrete automático
  (1-3h antes) + marcação automática de não-comparecimento (2h de atraso) +
  aviso no WhatsApp da loja a cada novo agendamento.
- **Central de Redes Sociais** (`/admin/central-social`): publicações
  (calendário/lista + IA), aprovações, comentários (responde
  Facebook/Instagram direto do painel), ideias de post com IA. Publicação
  agendada agora funciona de ponta a ponta (bug de import + cron ausente
  corrigidos em 14/08).
- **Conversador** (`/admin/conversas`): WhatsApp e Instagram numa tela só.
- **Feed de estoque pro Facebook Catalog**: function `public-inventory-feed`
  no ar, catálogo confirmado ativo no Commerce Manager com 27 veículos.
- **Meta Ads MCP**: conector conectado via token (não OAuth — ver
  `docs/meta-ads-mcp.md`). Ferramentas `mcp__meta-ads__*` confirmadas
  carregando em conversa nova.
- **NaPista**: autenticação + fluxo completo de publicação (catálogo →
  mapeamento → revisão → `napista-sync`) no ar e testado com dado real. Falta
  só automação (enfileiramento automático + cron) — ver pendência 1.
- **Site institucional**: bug de layout corrigido em 14/08/2026 — imagens
  dos cards de "Veículos em Destaque" na home estouravam a altura do
  contêiner e cobriam o texto (título/preço/botão), tamanho diferente por
  veículo. Causa: regra CSS global em `src/main.css`
  (`img { height: auto !important }`) sobrescrevia qualquer `h-full`/altura
  fixa do Tailwind em QUALQUER imagem do site, não só nesses cards — corrigido
  removendo o `!important` (era redundante com o preflight do Tailwind, que
  já faz o mesmo sem `!important`). Rodapé do site também ganhou razão
  social (TRANSLUGA ADMINISTRADORA DE VEÍCULOS LTDA, CNPJ
  10.196.974/0001-46) e endereço (Av. Guilherme Ferreira, 1119, Uberaba -
  MG) em `src/components/PublicLayout.tsx`. Divergência de endereço (1131 vs
  1119) **corrigida em 15/08/2026** em todos os pontos (`ml-client.ts`,
  `public-inventory-feed`, `Configuracoes.tsx`, `PoliticaPrivacidade.tsx`,
  `Termos.tsx`, `Sobre.tsx`) — ver pendência 6 fechada abaixo.
- **Mercado Livre — bug "not modifiable"** (achado e corrigido em
  15/08/2026): anúncio local apontava pra item já `closed`/`deleted` do lado
  do ML — todo PUT falhava com "not modifiable" em todos os campos, porque a
  API do ML não deixa editar anúncio fechado, só criar um novo. Corrigido em
  `_shared/ml-sync-core.ts` E `sync-plataforma/index.ts` (código duplicado,
  não compartilhado — os dois precisaram do mesmo fix): checagem de
  status antes do PUT, cai pra POST (cria novo) se estiver stale. Testado ao
  vivo com o veículo SW4 Hilux, novo anúncio `MLB7420419026`, modalidade
  prata. `sync-estoque` e `admin-plataformas-api` redeployados pra pegar o
  fix (mesmo shared file, precisa redeploy de cada consumidor).
- **Regra de roteamento de números de WhatsApp/telefone** — definida e
  documentada em 15/08/2026 no `CLAUDE.md` (seção "A PREENCHER pela
  Adriana"): Clara (`5534997384177`) = atendimento geral do site; Adriana
  (`5534984080220`) = só consórcio + alertas administrativos internos;
  Gabriel (`5534992000300`) = só seguro auto; Fixo (`553433159400`) +
  Celular da loja (`5534992893615`) = só ligação direta (`tel:`), nunca
  `wa.me`. Corrigido em ~15 arquivos do site (a maioria já usava a Clara por
  padrão via `getWhatsAppLink()`; só os pontos com link direto hardcoded
  estavam errados). Também corrigidos 3 bugs de backend que vazavam o
  celular pessoal da Adriana pro público: `ai-sdr` (Clara se apresentando
  com o número dela), `gerar-conteudo` (posts de IA com o número dela),
  `receive-leads` (alerta de lead Meta Ads pro número morto antigo).
- **Jessica Germano removida** do site inteiro (não trabalha mais na
  empresa): `brand.ts`, `Sobre.tsx`, `VenderMeuCarro.tsx` e também do JSON
  salvo em `site_configuracoes.brand_config` no banco (é o que alimenta o
  rodapé de verdade).
- **Razão social corrigida**: "LGA COMÉRCIO DE VEÍCULOS LTDA" (antiga, errada)
  → "TRANSLUGA ADMINISTRADORA DE VEÍCULOS LTDA, CNPJ 10.196.974/0001-46" em
  `PoliticaPrivacidade.tsx` e `Configuracoes.tsx`.
- **Página "Trabalhe Conosco"** (`/trabalhe-conosco`, nova, 15/08/2026):
  formulário público (nome, telefone, e-mail, texto livre até 20.000
  caracteres, currículo em PDF obrigatório) + card "Temos vaga" (lista
  títulos das vagas ativas). Link no menu principal do site. Admin em
  `/admin/vagas`: aba "Vagas Abertas" (CRUD, botão "Gerar com IA" via
  Gemini pra redigir a vaga, botão "Gerar imagem" via IA pra imagem padrão
  de post, botão "Postar nas redes" que reaproveita a fila existente de
  `social_posts`/`publicar-social`) e aba "Candidaturas Recebidas" (lista
  com filtro por vaga). Tabelas novas: `vagas`, `candidaturas` (com
  `vaga_id`, nulo = candidatura espontânea). 3 functions novas:
  `enviar-candidatura` (verify_jwt=false, sobe currículo pro R2 direto
  — client não tem login —, valida só PDF, máx 8MB), `gerar-vaga-ia`,
  `gerar-imagem-vaga` (as duas últimas verify_jwt=true, admin). Página
  `/obrigado` agora aceita `state: { tipo: 'candidatura' }` do
  `navigate()` pra mostrar mensagem própria (sem empurrar candidato pro
  WhatsApp do Luiz) — `tipo` ausente continua caindo no comportamento
  antigo ("venda"), nada quebrou pros outros formulários.

- **E-mail de candidatura e de lead do site corrigido** (15/08/2026, fecha a
  pendência 7 abaixo): domínio `carroeciamotors.com.br` verificado no Resend
  (confirmado via MCP oficial do Resend, conectado nesta sessão). Remetente
  trocado de `onboarding@resend.dev` (modo sandbox, só entregava pro dono da
  conta) pra endereços do próprio domínio em `enviar-candidatura/index.ts`
  (`rh@carroeciamotors.com.br`) e `send-lead-email/index.ts`
  (`contato@carroeciamotors.com.br`). Testado ao vivo via curl no endpoint
  real — `emailStatus: {enviado:true}` confirmado. As duas functions
  redeployadas. **Achado à parte — resolvido em 15/08/2026:** a chave de API
  do Resend hardcoded como fallback em `send-lead-email/index.ts` (linha 10)
  estava exposta no histórico do GitHub. Rotacionada: chave nova gerada no
  Resend ("Supabase Integration (rotacionada 2026-08-15)"), salva na
  variável `RESEND_API_KEY` do Supabase, hardcode removido do código
  (function redeployada), chave antiga ("Supabase Integration") revogada.
  Testado ao vivo nas duas functions após a troca — ambas continuam enviando
  e-mail normalmente. Chave "Onboarding" (mais antiga, nome bate com o
  remetente sandbox usado antes da correção do domínio) não foi revogada —
  não confirmado se é usada em outro lugar.
- **Dois avisos automáticos novos pro WhatsApp da Adriana** (15/08/2026, em
  `ai-sdr/index.ts`, constante `ADRIANA_PHONE`): (1) quando a Clara agenda
  visita OU avaliação (`agendar_visita` → `notificarNovoAgendamento`), agora
  manda a mesma mensagem que já ia pro WhatsApp da loja também pro número
  pessoal dela; (2) quando a Clara passa atendimento pra humano
  (`solicitar_atendimento_humano`), que antes só desligava a IA no lead sem
  avisar ninguém, agora manda nome/telefone/motivo pro WhatsApp dela. Function
  redeployada e no ar.

- **Catch-up de Git (15/08/2026, sessão 5)**: todo o trabalho das sessões 3 e
  4 (14-15/08) estava só na máquina local, sem commit desde 14/08 10:46 — 39
  arquivos modificados + 24 novos. Revisado (sem segredo exposto), dividido
  em 9 commits lógicos por assunto (NaPista, fix Mercado Livre, roteamento
  WhatsApp/limpeza institucional, Clara, Trabalhe Conosco, tipos gerados,
  fix e-mail Resend, docs, filtro de leads) e **enviado pro GitHub**
  (`git push origin main`, branch `main`, até o commit `3b8d548`). Site
  publicado (Cloudflare Worker) já conferido no ar com as mudanças de
  frontend antes mesmo do commit (alguém já tinha rodado `wrangler deploy`
  antes) — git só estava desatualizado, não o site.
- **Rotação de chave do Resend (15/08/2026)**: ver bullet anterior sobre
  e-mail — chave antiga exposta revogada, chave "Onboarding" (não usada)
  também revogada, nova gerada e testada.
- **NaPista — automação aplicada (16/08/2026, sessão 6)**: migration e
  deploy da etapa 7-8 (enfileiramento automático + cron a cada 30min)
  aplicados de verdade. Falta só o teste de ponta a ponta — ver pendência
  aberta 1.
- **Integridade de migrations corrigida (16/08/2026, sessão 6)**: achado
  investigando o `wm-sync` — 47 migrations com timestamp local diferente
  do banco (aplicadas via MCP, que carimba a hora real), uma correção real
  em produção (`corrige_laco_republicacao_webmotors`) sem nenhum registro
  no histórico (aplicada via `execute_sql` direto), e dois pares de cron
  duplicados rodando a mesma função (criados ao tentar renomear um job
  existente em vez de alterá-lo). Corrigido: 26 migrations renomeadas pro
  timestamp real, 4 migrations órfãs registradas no histórico, crons
  duplicados removidos. Regra nova documentada em `CLAUDE.md`, seção
  "Integridade de migrations e deploys". Detalhe em pendências 8 e 9
  abaixo.
- **Correção de segurança (16/08/2026, sessão 6)**: achada senha fixa em
  texto plano numa migration antiga (`add_access_control`,
  `Skip@Pass123!`), válida pra conta de login da Adriana
  (`lgacomerciodeveiculos@gmail.com`, nível admin_master). Senha trocada
  no banco. Contas de Roberto e da conta `@kmzero.com.br` **não foram
  mexidas** — decisão da Adriana, ver pendência 10.
- **Crons duplicados removidos (16/08/2026)**: `re-engagement-cron-daily`
  e `ml_weekly_quality_check` desligados — cada um duplicava a função de
  outro cron já ativo (`re-engagement-cron-job` e
  `avaliar-qualidade-anuncios-cron`, respectivamente) rodando sem que
  ninguém percebesse havia semanas.
- **Sistema de setores substituiu módulos (17/08/2026, sessão 7)**:
  tabelas `setores` (11 setores seedados) + `usuario_setores`, controle de
  acesso real por rota em `src/lib/setor-acesso.ts` +
  `AdminLayout.tsx` (antes o sistema de "módulos" existia mas não
  restringia nada de verdade). RLS crítica corrigida na tabela `usuarios`
  no mesmo pacote. Feature "Criar Usuário" com permissão por setor no ar,
  botão de criar setor novo removido do modal (pedido da Adriana). Feature
  "Esqueci minha senha" via Resend também entregue nesta sessão.
- **Auditoria completa do painel + reorganização de menu (17/08/2026,
  sessão 7)**: levantamento das 21 páginas admin via subagente, gerou
  `docs/manual-operacional-contexto.md` (checklist de documentação por
  setor). Achadas e **removidas** 3 telas 100% fachada, sem persistência
  real (decisão da Adriana — remover com segurança, planejar futuro
  depois): Avaliação de veículo (`/admin/avaliacao`), abas "Loja & SEO" e
  "Scripts & Tracking" de Configurações, aba "Automações de E-mail" de
  Marketing. Menu lateral reorganizado nos 3 grupos fixos pedidos por ela:
  Menu Principal (operacional) / Administração / Área de Ajuda — antes
  eram 6 grupos por assunto misturando os dois. Build (`bun run build`)
  confirmado limpo depois da remoção. Tudo commitado e enviado pro GitHub
  (`ba3b5f5`).
- **Skill `manual-operacional` criada (17/08/2026, sessão 7)**: em
  `.claude/skills/manual-operacional/`, escopo só deste projeto. Conduz a
  escrita guiada dos artigos da Central de Ajuda (`ajuda_conteudos`),
  setor por setor, sempre investigando a página real antes de documentar.
  `CLAUDE.md` ganhou regra ampliada: ao fechar tarefa que tocou o painel,
  checar `docs/manual-operacional-contexto.md` e já fechar lacuna
  relacionada, sem esperar pedido explícito.
- **Botão manual Publicar/Despublicar implementado (17/08/2026, sessão
  7)**: `/admin/portais` — Webmotors, Mercado Livre e NaPista. Detalhe
  completo (inclui 2 bugs achados e corrigidos no caminho: NaPista era
  decorativo, seletor de modalidade mostrava valor errado) na seção
  "Implementado nesta sessão" de `docs/manual-operacional-contexto.md`.
  Build e lint limpos. **Não testado ao vivo no navegador** (sem login
  disponível nesta sessão) — pedir pra Adriana conferir antes de
  considerar 100% validado.
- **Auditoria + correção pontual Webmotors (17/08/2026, sessão 7)**:
  reconciliação real (API Webmotors) vs sistema confirmou 18=18 sem
  divergência. RAV4 (QMY0E06) e HB20X (RFV1E55) publicadas nas 2 vagas
  que abriram com a venda de 2 carros em 15/08. Compass Sport 2021
  (RMP8G90) despublicado a pedido da Adriana. Confirmado com a própria
  API da Webmotors: modalidade Básico (6351) e Vip (6914) são pools
  **fixos e separados** (18 + 2), não fungíveis um com o outro — a
  Adriana levantou a hipótese de serem fungíveis, dado real não confirma
  isso, vale confirmar com o suporte da Webmotors se ela quiser insistir.
- **Auditoria de qualidade dos leads (17/08/2026, sessão 7)**: achados e
  apagados 15 leads-fantasma no total (9 do clique "Tenho Interesse" do
  site + 6 de outros padrões: "Lead Portal", "Cliente Instagram", um
  "teste" de formulário, e 3 contatos WhatsApp reais com nome de perfil
  inútil tipo "." ou emoji, sem conversa registrada). Corrigido na raiz:
  `handleCommercialCTA` não cria mais lead nem aciona a Clara antes da
  pessoa mandar mensagem de verdade (só o fluxo real de entrada do
  WhatsApp faz isso agora).
  **Achado maior**: nenhum lead vindo de anúncio (Meta Ads) ou do site
  tinha o veículo de interesse gravado em campo estruturado — só o nome
  genérico da campanha. A ferramenta `atualizar_estagio_lead` da Clara
  ganhou o parâmetro `veiculo_interesse`; deploy do `ai-sdr` já feito
  (17/08/2026) — **efeito colateral bom**: esse deploy também colocou no
  ar a expansão de classificação de leads que estava parada desde
  14/08/2026 (ver item 4 nas pendências fechadas).
  **Google Ads investigado a fundo** (conector `carroecia-api-google-ads`
  ganhou 2 ferramentas novas, só leitura: `detalhar_campanha` e
  `verificar_auto_tagging`, testadas e funcionando):
  - Conta tem **auto-tagging ATIVADO** — Google usa `gclid` na URL, não
    UTM manual. Nosso site **não captura `gclid` em lugar nenhum hoje** —
    todo tráfego de Google Ads que vira lead fica invisível como "Google"
    (cai como orgânico ou sem origem).
  - As 2 campanhas (`Website_traffic` ativa, `Leads_pesquisa` pausada) só
    têm 1 anúncio cada, tipo Busca (Responsive Search Ad), URL final = a
    home do site (`carroeciamotors.com.br`), sem página específica de
    veículo nem extensão de formulário/ligação visível no tipo do
    anúncio.
  - Zero leads no banco hoje com qualquer rastro de Google Ads.
  - **[FECHADA 17/08]** Captura de `gclid` implementada — `src/lib/ad-tracking.ts`
    guarda no localStorage assim que aparece na URL, os 3 pontos que criam
    lead direto do navegador (Hero, LeadForm, ConsignacaoLPForm) mandam
    pro backend, `leads.gclid` gravado, `origem` vira `google_ads` quando
    presente. **Limitação que continua**: clique direto no botão de
    WhatsApp (sem passar por formulário) ainda não carrega o `gclid` até
    a conversa — o WhatsApp não devolve esse dado como a Meta devolve nos
    anúncios dela. **Pesquisado em 17/08/2026**: mercado resolve isso com
    "código de referência" na mensagem pré-preenchida (visível pro
    cliente, ele pode apagar antes de mandar — atribuição se perde nesse
    caso, sem quebrar nada). Não implementado ainda, esperando decisão da
    Adriana (muda o texto que o cliente vê).
  - **[FECHADA 17/08] Veículo do anúncio (Meta Ads) — resolvido de
    verdade**: achado que `referral.body` (corpo do criativo do anúncio,
    manda pela Meta em toda mensagem de WhatsApp vinda de anúncio) sempre
    trouxe o veículo exato — nunca foi lido, só `headline`/`source_id`
    (nome genérico da campanha) eram usados. `receive-leads/index.ts`
    agora extrai o texto antes dos dois-pontos da primeira linha do
    `referral.body` (nossos anúncios sempre começam "Marca Modelo Versão
    Ano: descrição") e grava em `veiculo_interesse` na hora que o lead é
    criado — não depende mais da Clara identificar depois na conversa.
    Provavelmente é o mesmo mecanismo que o Venda.iA usa.
- **Avaliação de Veículo implementada (17/08/2026)** — reconstruída do
  zero em `/admin/avaliacao`. Detalhe completo na seção "Backlog" (item
  1) de `docs/manual-operacional-contexto.md`. **Achado importante no
  caminho**: a função "Gerar Proposta PDF Automática" que já existia em
  `/admin/crm` era 100% fake (PDF fixo "Mocked PDF") — nunca tinha sido
  usada de verdade (zero arquivos gerados antes da correção). Corrigida
  junto: geração de PDF real agora via jsPDF (testado isolado antes de
  integrar), com 2 templates novos editáveis em `/admin/modelos-documentos`.
  Também corrigido um bug pequeno pré-existente nessa tela (`t.doc_type`
  deveria ser `t.document_type` — o "Não salvo" nunca sumia depois de
  salvar). Build e lint limpos. **Não testado no navegador** (sem login).
- **Configurações Loja & SEO implementada (17/08/2026)** — detalhe
  completo na seção "Backlog" (item 2) de `docs/manual-operacional-contexto.md`.
  Resumo: achado que não existia NENHUMA tela pra editar endereço/logo da
  loja (Contatos só cobre WhatsApp/telefone/redes) — não era duplicação,
  era lacuna real. Endereço/telefone/logo saíram do hardcode em
  `SEO.tsx` (schema.org de toda página do site) e passam a vir de
  `brand_config` via `useBrandConfig()`, mesmo hook que o rodapé já usa.
  Fallback seguro confirmado (`DEFAULT_BRAND` bate com o que estava
  hardcoded — testei que `address`/`logoUrl` nunca tinham sido salvos no
  banco até hoje, e o site continua mostrando certo mesmo assim).
  Decisão consciente de não incluir fallback de título/descrição padrão
  (toda página relevante já define o próprio SEO). Build e lint limpos,
  **não testado no navegador**.
- **Correção nos cards de veículo — capa e `/estoque` (17/08/2026)** —
  detalhe completo em "Implementado nesta sessão" de
  `docs/manual-operacional-contexto.md`. Resumo: fotos em retrato/quadradas
  cortadas por `object-cover` num quadro fixo 4:3 (Volvo XC 60, HR-V,
  Toro citados como exemplo) → trocado pra `object-contain` (mostra a
  foto inteira). Removido "versão" do texto do card (existia só pra
  exigência de cadastro Webmotors, continua sendo enviado pra lá igual).
  "Cilindrada" conferida — nunca apareceu em card nenhum, nada a
  remover. Adicionado botão WhatsApp nos cards da capa (só o `/estoque`
  tinha). Build e lint limpos, **não testado no navegador**.
  **Atualização mesmo dia**: corrigido também `Veiculo.tsx` (galeria da
  página de detalhe) — mesmo `object-contain` na foto grande e nas
  miniaturas (2 dos 3 pontos com `object-cover`; o placeholder de "sem
  foto" ficou como estava, não é foto real). Build limpo, os 4 warnings
  de lint no arquivo já existiam antes (confirmado via `git stash`),
  não são deste ajuste.
  **Atualização 2 mesmo dia — revertido**: Adriana testou e não gostou
  do `object-contain` (cards com foto vertical/quadrada ficavam
  visivelmente menores, com faixa cinza nas laterais). Revertido pra
  `object-cover` nos 3 arquivos. Criado `src/lib/image-cover-position.ts`
  — mede a foto ao carregar e só ajusta o ponto de corte pra cima
  quando ela for vertical/quadrada (fora do padrão paisagem), mostrando
  mais do teto do carro. Fotos paisagem normais não mudam nada.
  Testado localmente (`bun run dev`) direto no navegador nos 3 carros
  citados antes de subir — confirmado visualmente. Achado à parte, sem
  ação: existe um terceiro card duplicado em
  `src/components/home/HomeFeatures.tsx` ("Veículos em Destaque" da
  home) — nunca teve o bug, não mexido.

## Pendências abertas

1. **[FECHADA 17/08] NaPista — automação testada de ponta a ponta.**
   Migration e deploy aplicados (16/08/2026, sessão 6) — trigger
   `trigger_napista_sync_on_veiculo_change` e cron `napista-sync-cron-job`
   (30min) ativos. Testado ao vivo em 17/08/2026 com o Jeep Compass Sport
   (RMP8G90, já mapeado): marcado como pendente, `napista-sync` chamado,
   voltou `status: updated`, 10 fotos enviadas, sem erro. **Achado
   importante**: `napista-sync/index.ts` aponta pra
   `api.development.napista.com.br` — **ainda é a API de desenvolvimento
   da NaPista, não produção**. Tecnicamente tudo funciona, mas nada disso
   aparece pro público de verdade até trocar pra API de produção — isso
   é decisão da Adriana (precisa confirmar credenciais/URL de produção
   com a NaPista antes), não fiz essa troca sozinha.
   **Confirmado em `docs/integracao-napista.md` (item 9, já documentado
   antes): hoje só existe `client_id` de desenvolvimento — produção exige
   pedir um `client_id` novo direto pra `parceiros@napista.com.br`.** Ou
   seja, o sistema NUNCA publicou nada na NaPista de produção — os 19
   veículos que a Adriana vê ao vivo no site da NaPista (17/08/2026) não
   vieram do nosso sistema. Bloqueado até ela pedir o client_id de
   produção — não dá pra "publicar os 6 que faltam" até isso existir.

1. **NaPista** — Fase 1 (autenticação) concluída e testada. Fase 2: etapas
   1-4 de 9 **concluídas, testadas e publicadas em 14/08/2026** com dado
   real (Jeep Compass) — sync de catálogo, mapeamento automático
   (`napista-mapear-veiculo`) e tela de revisão manual
   (`NapistaPendenciasReview.tsx`, dentro da aba NaPista de
   `/admin/portais`) funcionando de ponta a ponta: marca/modelo casaram com
   confiança 1.0, versão foi corretamente pra revisão (candidato certo em
   1º lugar), confirmação manual resolveu cor/câmbio/combustível certo
   (`BLACK`/`AUTOMATIC`/`FLEX`). Dois bugs reais achados e corrigidos
   testando ao vivo: (1) confirmar manualmente não recalculava
   cor/câmbio/combustível, ficavam `null`; (2) cor do NaPista é masculina
   ("Preto"), `veiculos.cor` é feminina ("Preta") — quase todo veículo
   falhava o match; criado fallback de gênero (`NAPISTA_COR_FALLBACK` em
   `napista-client.ts`, mesmo espírito do `ML_COLOR_MAP`). Site
   rebuildado e redeployado (`wrangler deploy`) com tudo isso no ar.
   Etapa 5 (endpoint de fotos) **pesquisada em 14/08/2026**:
   `POST /seller/{sellerId}/offer/{offerId}/photos/url`, aceita URL pública
   direto, mas sobrescreve a lista inteira a cada chamada.
   **Etapa 6 (`napista-sync`) concluída e testada ao vivo em 14/08/2026** —
   os três caminhos (criar/atualizar/encerrar) confirmados funcionando de
   verdade no ambiente dev do NaPista, com o Jeep Compass real (offerId
   `a8d18554-5cc9-45b5-a0b5-332879cb1891`). Dois achados corrigidos no
   caminho: (1) `estoque_publicacoes.platform` tinha CHECK restrito a
   facebook/instagram/webmotors — a suposição de que já era
   multi-plataforma estava errada, migration ampliou pra incluir 'napista';
   (2) limite de **10 fotos por anúncio**, não documentado — acima disso
   a API rejeita a lista inteira (HTTP 412). Fase 2 do NaPista está com o
   fluxo principal completo (catálogo → mapeamento → revisão → publicação);
   falta só automação (etapas 7-8: trigger automático + cron periódico,
   hoje é tudo manual) — plano completo em `docs/integracao-napista.md`.
2. **Meta Ads MCP** — confirmado nesta sessão: as ferramentas
   `mcp__meta-ads__*` carregam normalmente numa conversa nova. Pendência
   encerrada.
3. **Catálogo Facebook** — confirmado pela Adriana: fonte de dados criada e
   funcionando no Commerce Manager, 27 veículos ativos. Pendência encerrada.
4. **Classificação de leads pela Clara** — expandida em 14/08/2026:
   - `criar_lead_crm`: enum de `tipo` foi de 2 pra 7 valores (`comprador`,
     `vendedor`, `troca`, `consignacao`, `financiamento`, `seguro_auto`,
     `consorcio`).
   - `atualizar_estagio_lead`: agora também aceita `temperatura`
     (frio/morno/quente) — antes a Clara nunca escrevia nesse campo, só
     integrações automáticas (ML, site, portais) com valor fixo por canal.
   - Encaminhamento automático: lead com `tipo=seguro_auto` manda WhatsApp
     pro Gabriel (5534992000300); `tipo=consorcio` manda pra própria
     Adriana (5534984080220) — resumo da conversa + dados do cliente, via
     `encaminharParaParceiro()` em `ai-sdr/index.ts`.
   - Painel (`/admin/leads`): filtro por tipo adicionado (agrupa
     `compra`+`comprador`+`interesse` como "Quer comprar").
   - **[FECHADA 17/08]** Foi ao ar sem querer como efeito colateral do
     redeploy do `ai-sdr` em 17/08/2026 (feito por outro motivo — ver
     item do veículo de interesse abaixo). Confirmado no código
     deployado: enum de 7 tipos, temperatura e encaminhamento automático
     estão todos ativos agora.
5. **Gemini API — verificação de atualidade** (pedido da Adriana,
   14/08/2026): modelo em uso (`gemini-3.6-flash`) **está atualizado** —
   confere com os exemplos oficiais atuais da Google. O endpoint usado
   (`generateContent` via REST) **continua totalmente suportado**, sem
   prazo de descontinuação. A "Interactions API" (`client.interactions.create`,
   GA desde 06/2026) é recomendada pra projetos novos, mas migrar exigiria
   reescrever boa parte do `_shared/gemini-client.ts` (formato de tools e de
   leitura de resposta mudam bastante). **Não migrado agora** — ficou como
   melhoria futura, não urgente.

6. **[FECHADA 15/08]** Endereço 1131 vs 1119 — corrigido em todos os pontos
   (ver bullet acima). Sem pendência.
7. **[FECHADA 15/08] E-mail de candidatura não chega** — resolvida (ver
   bullet acima, seção "O que está no ar hoje"). Causa raiz: a chave
   `RESEND_API_KEY` estava em modo sandbox
   no Resend — só permite mandar e-mail pro endereço da própria conta
   (`lgacomerciodeveiculos@gmail.com`), recusa qualquer outro destinatário
   (testei direto via curl, resposta 403 do Resend confirma isso). Por isso
   o e-mail pra `rh@carroeciamotors.com.br` (function `enviar-candidatura`)
   nunca chegava — a function reportava sucesso porque o `fetch()` original
   não checava `res.ok` (bug já corrigido, agora a resposta da function
   inclui `emailStatus: {enviado, motivo}` pra diagnóstico). **Suspeita não
   confirmada**: `send-lead-email` (mais antiga) usa o mesmo remetente
   `onboarding@resend.dev` e manda pra `contato@carroeciamotors.com.br` —
   pode ter o mesmo problema, vale a Adriana conferir se esses e-mails têm
   chegado de verdade.
   Dois caminhos de solução, nenhum aplicado ainda — decisão da Adriana:
   (a) verificar domínio em resend.com/domains e trocar o remetente pra um
   e-mail `@carroeciamotors.com.br`; (b) mandar temporariamente pro Gmail
   dela até o domínio ser verificado. As candidaturas continuam salvas
   certinho no banco/admin independente disso — nada se perde, só o aviso
   por e-mail que não sai.
   Servidor MCP oficial do Resend (`https://mcp.resend.com/mcp`) foi
   registrado no `claude mcp` local deste projeto, pra eu poder investigar/
   configurar isso diretamente — mas está com status "Needs authentication".
   Falta a Adriana completar o login/OAuth na conta Resend dela (não é algo
   que eu faço sozinha) e provavelmente reiniciar a sessão do Claude Code
   pra essas ferramentas aparecerem.

8. **22 migrations sem arquivo local nenhum** (achado 16/08/2026): schema
   real está correto e aplicado, mas o texto SQL original de 22 migrations
   antigas (02/08 a 12/08) foi perdido do histórico do banco — sem arquivo
   local pra reconstruir. Resolve rodando `supabase db pull`, que precisa
   de **Docker Desktop instalado** nesta máquina (não está). Sem urgência
   — nada quebrado, só documentação incompleta.
9. **Uma migration parada em `supabase/migrations-rascunho/`**, fora do
   fluxo automático de propósito:
   - `desliga_cron_wm_sync.sql` — desligaria a sincronização automática da
     Webmotors. Decisão da Adriana em 16/08: manter automático por ora.
     Aplicar só depois do fluxo manual "Sincronizar Agora" (painel Portais)
     ser testado de ponta a ponta.
   - **[FECHADA 17/08]** `crm_improvements.sql` (23/06, órfã) — confirmado
     que `internal_notes` e `leads.ai_enabled` (o que esse arquivo criava)
     já existem no banco via outra migration já aplicada
     (`20260623192000_crm_improvements`). Arquivo apagado.
10. **Senha exposta pro Roberto (`roberto@carroecia.com`) e pra conta
    `adriana.araujo@kmzero.com.br` continua sem trocar** (16/08/2026):
    achada em `add_access_control.sql` (senha fixa em texto plano, ver o
    arquivo — não repetida aqui de propósito, continua válida pras duas
    contas). A senha da própria Adriana (conta de login principal) já foi
    trocada. Decisão dela foi deixar as outras duas como estão por ora —
    registrado aqui porque a exposição em si continua no histórico do
    Git, não some sozinha.
11. **[PLANEJADO 17/08, falta implementar] Plano das 3 telas removidas**:
    Avaliação de veículo formal, Configurações gerais de Loja/SEO/Scripts,
    Automações de e-mail de nutrição de lead. Plano completo de cada uma
    (decidido junto com a Adriana) está na seção "Backlog" de
    `docs/manual-operacional-contexto.md` — não repetir aqui, só resumo:
    (1) Avaliação vira tabela `avaliacoes_veiculo` + tela nova, com ação
    de virar proposta em PDF / consignação / compra-estoque; (2) "Loja &
    SEO" volta reaproveitando `brand_config` (elimina hardcode duplicado
    em `SEO.tsx`), "Scripts & Tracking" NÃO volta como tela (edito
    `index.html` direto quando pedir); (3) Automação de e-mail usa Brevo
    como motor (não cron próprio) — depende da chave de API do Brevo,
    ver pendência 5. Nenhuma das 3 tem código escrito ainda, só o plano.
12. **Confirmar status real de OLX/iCarros/Napista em `/admin/portais`**
    (17/08/2026): comentário no código dizia que só Webmotors e Mercado
    Livre têm integração real, as outras seriam só flag. Sinalizado no
    doc de contexto do manual pra reconferir — pode estar desatualizado,
    não foi checado nesta sessão.
13. **[FECHADA 18/08/2026] Documentação de API.** Índice
    (`docs/documentacao-api.md`) + os 4 grupos (67 functions) + os 4
    artigos resumo na Central de Ajuda (`grupo='dev_ti'`) — tudo
    completo. Pendência que sobrou dela: sitemap desatualizado desde
    abril/2026 (ver `docs/admin-infraestrutura.md`) — Adriana pediu pra
    tratar isso a seguir.
14. **Manual Operacional — maioria das páginas ainda sem artigo**
    (atualizado 18/08/2026): infraestrutura pronta
    (`docs/manual-operacional-contexto.md` + skill `manual-operacional`),
    3 artigos reais existem hoje ("Criar Usuário no Painel", "Avaliar
    Veículo de Cliente", "Editar Dados da Loja"). Escrever o resto é
    trabalho de várias sessões futuras, conduzido pela skill quando a
    Adriana pedir.

## Referências técnicas por assunto

`docs/webmotors-integracao.md` · `docs/mercadolivre-integracao.md` ·
`docs/leads-e-sdr.md` · `docs/meta-ads-mcp.md` · `docs/edge-functions-rules.md`
· `docs/R2_CORS_CONFIGURATION.md` · `docs/integracao-napista.md`
