# Postagem automática de veículos (Facebook e Instagram) — referência técnica

**Como usar este documento.** Plano e estado do sistema que posta sozinho os veículos ativos e os novos
(carrossel de fotos no feed, vídeo no feed e Stories) no Facebook e no Instagram. Vá direto à fase que
interessa. A seção _Becos sem saída_ lista o que já foi descoberto — **não repita**.

Última atualização: 2026-10-03.

## Objetivo (pedido da Adriana, 03/10/2026)

Postar automaticamente os veículos ativos e todo veículo cadastrado daqui em diante, com dados do veículo,
descrição, opcionais e fotos no feed (carrossel), e o vídeo separado no feed e nos Stories, no Facebook e no
Instagram.

## O que já existia (levantamento de 03/10/2026)

| Peça | Estado | Observação |
|---|---|---|
| `publicar-social` (cron a cada 15 min) | no ar | Publica UMA mídia por post. FB: foto/texto. IG: foto, Reels, Stories (foto e vídeo, testado ao vivo em 20/08/2026). **Falta:** carrossel, várias fotos no FB, vídeo no feed do FB, Facebook Stories (devolve erro de propósito) |
| `post-organico-diario-cron` (todo dia 8h BRT) | no ar | 1 veículo/dia, só Facebook, 1 foto, grava **Rascunho** (aprovação manual). 8 rascunhos parados em 03/10 = gargalo |
| `gerar-conteudo-social` | no ar | Legenda por rede (IA) |
| `gerar-criativo-anuncio` | no ar | Trata a foto base (formato 1080) |
| Token Meta | válido | SYSTEM_USER sem expiração; `publicar-social` troca por token de PÁGINA (`obterTokenDePagina`). Tem `pages_manage_posts` e `instagram_content_publish` |
| Dados do veículo | existem | `fotos`, `videos`, `descricao`, `caracteristicas` e `diferenciais` (opcionais), preço, km, `slug` |
| Tela de aprovação | no ar | `SocialApprovalDashboard.tsx` (Central Social) |

## Decisões ainda abertas (aguardam a Adriana)

1. Aprovação: automático ou manual? (recomendado: automático para veículo novo e rodízio, com painel para pausar)
2. Texto do post: descrição geral resumida, sem telefone, com chamada pro WhatsApp da Clara?
3. Frequência do estoque ativo (recomendado: 1 carrossel/dia, 1 vídeo em dia alternado, Stories diários).
4. Veículo sem vídeo: posta só o carrossel?
5. Vendeu: para de postar e sai da fila automaticamente?

## Fases

| Fase | O quê | Estado |
|---|---|---|
| **1 — Base** | Fila `social_posts` v2 (colunas novas, validações, trava de duplicidade) | **FEITA em 03/10/2026** (migration `20261003140709_social_posts_fila_v2_base`) |
| 2 — Carrossel | Carrossel IG (contêineres filhos + pai) e várias fotos no FB | **CONSTRUÍDA e no ar em 03-04/10/2026; rascunhos da Frontier criados; publicação real PENDENTE da aprovação da Adriana** (ver "Fase 2") |
| 3 — Vídeo e Stories | Reels/vídeo no FB; Stories foto e vídeo nos dois (FB Stories exige endpoint próprio e permissão a confirmar) | pendente — depende do formato dos vídeos |
| 4 — Automação | Gatilho de veículo novo (disponível + mapeamento confirmado + fotos) e cron de rodízio, com limites e pausa por venda | pendente |
| 5 — Painel | Fila, falhas, Pausar / Tentar de novo / Postar agora, alerta no WhatsApp | pendente |

## Fase 1 — modelo da fila (`social_posts` v2)

Só **aditivo**: posts manuais e antigos seguem funcionando como antes; `publicar-social` e a Central Social
não foram alterados.

| Coluna nova | Tipo | Para quê |
|---|---|---|
| `midias` | jsonb, padrão `[]` | URLs das fotos do carrossel ou do vídeo. Vazia = usa `imagem` (posts antigos) |
| `formato` | text | `feed_carrossel`, `feed_foto`, `feed_video`, `story_foto`, `story_video`. NULL = antigo (usa `content_type`) |
| `rede` | text | `facebook` ou `instagram` — **uma linha por rede** nos posts automáticos. NULL = antigo (usa `redes`) |
| `origem` | text | `manual`, `organico_diario`, `auto_novo`, `auto_rodizio` (posts existentes foram marcados) |
| `ciclo` | int, padrão 1 | Quantas vezes o veículo entrou no rodízio nesse formato/rede |
| `tentativas` | int, padrão 0 | Limita as repetições em caso de erro |
| `post_externo_ids` | jsonb, padrão `{}` | IDs devolvidos pela Meta, por rede |

- **Trava de duplicidade:** índice único parcial `social_posts_auto_unico` em `(veiculo_id, formato, rede, ciclo)`
  **só** onde `origem` é `auto_novo` ou `auto_rodizio`. Posts manuais não entram na trava.
- **Validações (CHECK):** `formato`, `rede` e `origem` só aceitam os valores acima (ou NULL).
- **Índice da fila:** `social_posts_fila_idx` em `(status, data_agendamento)`.
- **Testado em 03/10/2026** (bloco que desfaz tudo): mesmo veículo+formato+rede+ciclo automático é barrado;
  outro formato passa; ciclo 2 passa; posts manuais repetidos passam; formato e rede inválidos são barrados.
  26 posts existentes intactos (contagem e status iguais).
- Status hoje: `Rascunho`, `Agendado`, `Publicado`, `Erro`. A Fase 2 deve acrescentar `Publicando` (trava contra o
  cron de 15 min publicar duas vezes um vídeo que ainda está processando).

## Fase 2 — carrossel (construída)

- **Legenda por modelo fixo, sem IA** (`_shared/legenda-social.ts`, função pura, aprovada pela Adriana em
  03/10/2026): título, ficha (anos • cor • combustível • câmbio • km), preço, Destaques (opcionais, prioridade
  teto solar/couro/4x4/câmera/GPS, até 8), Acompanha (itens seguros de `caracteristicas`), frase "laudo cautelar
  aprovado e procedência garantida" para TODOS os veículos (decisão dela), aviso "Atenção: veículo com passagem por
  leilão" quando o cadastro tiver leilão (informar leilão é obrigação), WhatsApp da Clara (`wa.me/5534997384177`),
  endereço, frase final (`rodape_fixo`) e hashtags: marca, modelo, categoria, #uberaba + #consignacao #veiculo
  #carro #carroecia #automovel #webmotors #icarros #olx #mercadolivre #napista. No Facebook entra também o link
  `carroeciamotors.com.br/estoque/{slug}` (**a rota por slug ainda precisa ser conferida no teste real**).
  Itens com leilão/sinistro/alienado/batido etc. NUNCA entram em Destaques/Acompanha (`ITEM_PROIBIDO`).
  Bug achado no teste e corrigido: `numeric` do banco vem como "149897.00" — tratar o ponto como milhar dava
  R$ 14.989.700.
- **`montar-post-veiculo`** (Edge Function, `verify_jwt = true`): cria os posts na fila, uma linha por rede
  (`formato = feed_carrossel`, `origem = auto_novo|auto_rodizio`), por padrão como **Rascunho**. Até 10 fotos JPG,
  na ordem do cadastro (capa primeiro); descarta foto com proporção fora de 4:5–1,91:1 (`_shared/foto-jpeg.ts`;
  vertical 3:4 derrubaria o carrossel do Instagram); mínimo 2 fotos; só veículo `disponivel`. A trava
  `social_posts_auto_unico` devolve "já existe um post automático igual" (testado).
- **`publicar-social`**: ramo SEPARADO `processarCarrossel` para `formato = feed_carrossel` (o fluxo antigo — manual,
  orgânico, Stories — não foi tocado). Trava o post em `Publicando` (+ `publicando_em`) antes de falar com a Meta;
  falha volta pra `Agendado` até 3 tentativas, depois `Erro` com mensagem em português; `Publicando` há mais de
  30 min volta pra `Agendado`. IDs da Meta em `post_externo_ids`. Chamadas da Meta em `_shared/meta-publicar.ts`:
  Instagram = contêiner filho por foto (`is_carousel_item`) → pai `media_type=CAROUSEL` → `media_publish`
  (espera `FINISHED` em cada etapa); Facebook = `/photos` com `published=false` por foto → `/feed` com
  `attached_media`. Parênteses dos nomes de arquivo ("...(1).jpg") são codificados (`%28/%29`) ao enviar.
- **Verificado em 03-04/10/2026:** Frontier (`RNY4F77`) — 10 fotos JPEG 4:3 (2,7–5,9 MB, limite do IG é 8 MB),
  endereços abrem com parênteses codificados. Migration `social_posts_publicando_em` aplicada.
- **Achado:** o rascunho ANTIGO do orgânico diário (`origem = organico_diario`) traz o preâmbulo da IA
  ("Aqui está o post perfeito e otimizado para o Facebook, pronto para copiar e colar!") — NÃO aprovar; o orgânico
  atual será substituído pelo sistema novo na Fase 4.
- **Falta:** aprovar os rascunhos da Frontier e conferir os 2 posts reais (IG e FB) nas páginas públicas.

## Riscos e pré-requisitos

- **Vídeos do Drive**: precisam estar sincronizados e num formato que a Meta aceite (vertical 9:16 para Reels e
  Stories, H.264, tamanho limitado). Só 7 de 27 disponíveis tinham vídeo em 03/10/2026. Pode precisar de conversão.
- **Facebook Stories**: endpoints `photo_stories`/`video_stories`; permissão do app a confirmar antes de construir.
- **Limites da Meta**: ~100 posts/dia por conta pela API; Instagram **não aceita link clicável** na legenda
  (por isso o WhatsApp vai no texto).
- **Texto**: mesma lição da Webmotors — evitar telefone e pontuação exagerada ("!!!") na legenda.

## Becos sem saída

- Não colocar `UNIQUE (veiculo_id, formato, rede)` sem `ciclo`: impediria repostar o veículo meses depois no rodízio.
- Não usar a coluna `redes` (jsonb, lista OU objeto conforme quem gravou) como chave de unicidade: por isso a coluna
  `rede` (uma por linha) nos posts automáticos.

## Painel de aprovação — botões de ação (04/10/2026, pedido da Adriana)

`SocialApprovalDashboard.tsx` (Central Social, aba "Aprovações"). Cada cartão mostra rede, formato ("Carrossel · N
fotos"), todas as fotos (`midias`, ou `imagem` nos posts antigos) e a legenda. Ações por estado:
- **Rascunho/Aprovado:** Editar, **Aprovar** (→ `Agendado`), **Excluir**.
- **Agendado:** Editar, Excluir. **Publicando:** sem botões (post travado pelo publicador; antes sumia da lista).
- **Erro:** Editar, **Publicar novamente** (→ `Agendado`, zera `tentativas` e `publicando_em`; sem zerar, um carrossel que
  já falhou 3 vezes ganharia 1 chance só), Excluir.
- **Publicado:** **Publicar novamente** = cria um post NOVO igual (`origem = manual`, `Agendado`, agora; confirmação avisa
  que o conteúdo aparece duas vezes) e **Excluir** = remove só da lista (**não apaga o post do Instagram/Facebook**).
- **Editar** muda legenda, data/hora e, no carrossel, tira fotos (mínimo 2; atualiza `midias` e `imagem`).
- Excluir/Publicar novamente usam `AlertDialog` (não o `confirm()` do navegador).
- Beco sem saída: não há "Publicar agora" imediato — `publicar-social` só aceita o segredo interno, então o front não
  consegue chamá-la; o cron de 15 min publica. Se for preciso, criar uma function proxy autenticada.

### Correção (04/10/2026, mesmo dia): botões também na TABELA de Publicações

A Adriana não via os botões: a Central Social abre na aba **Publicações** (`RedesSociais.tsx`, tabela com coluna
"Ações" que só tinha "Detalhes" e um painel lateral com botão "Editar Rascunho" **sem ação ligada**), e os botões tinham
sido feitos só na aba **Aprovações** (cartões). Agora:
- `src/services/social-posts.ts` concentra as ações (`agendarPost`, `excluirPost`, `duplicarPostPublicado`,
  `salvarEdicaoPost`) e os helpers (`redesDoPost`, `midiasDoPost`); **as duas telas usam o mesmo módulo**.
- `AcoesPostSocial.tsx` (botões por estado + janelas de confirmação e de edição) fica em cada linha da tabela e no
  painel lateral (`layout="coluna"`); `stopPropagation` evita abrir o painel ao clicar num botão.
- **Defeito corrigido:** `RedesSociais.tsx` lia `redes` com `Object.keys(...)`, que só serve para objeto; posts novos
  gravam lista (`["instagram"]`) e ficavam sem ícone de rede. Agora usa `redesDoPost()` (calendário, tabela e painel).
- Filtro de status ganhou "Publicando"; coluna Conteúdo mostra "Carrossel · N fotos"; painel lateral mostra todas as fotos.
- Teste: renderização do componente nos 6 estados confirmou a matriz de botões (Rascunho/Aprovado: Aprovar, Editar,
  Excluir; Agendado: Editar, Excluir; Publicando: aviso; Erro: Publicar novamente, Editar, Excluir; Publicado: Publicar
  novamente, Excluir). Clique real na tela NÃO testado (sem login).

### 04/10/2026 — contato pelo post orgânico e comentários

- **Não existe botão CTA em post orgânico do feed** (só em anúncio). Facebook: link `https://wa.me/...` no texto é clicável.
  Instagram: link na legenda NÃO é clicável. A legenda agora diz "Fale com a gente pelo WhatsApp: https://wa.me/..." no
  Facebook e "Chame no direct ou toque no link da nossa bio" no Instagram (`_shared/legenda-social.ts`). **A conferir:** se o link
  da bio do Instagram leva ao WhatsApp da Clara.
- **Comentários públicos** (`social_comments`, aba "Comentários"): chegam pelo webhook `receive-leads` (campo `feed` no Facebook,
  `comments` no Instagram). `_shared/comentario-social.ts`: `extrairComentario` (formato de cada rede; ignora o comentário da própria
  página), `comentarioDemonstraInteresse` (valor, preço, troca, km, onde, quero...; testado com os 40 comentários reais, 28/28 casos)
  e `avisarComentarioInteressado` (WhatsApp para `social_configuracoes.whatsapp_number`). Comentário com interesse cria lead
  (`origem` = `comentario_facebook`/`comentario_instagram`, sem duplicar por autor) e avisa. Reenvio do mesmo evento não duplica.
- **Correção do próprio dia:** a 1ª versão deste texto dizia que o Instagram "só envia DM" e que faltava inscrever `comments` na Meta.
  ERRADO (olhei só 10 dias de `meta_webhook_logs`). Em 30 dias: 122 eventos `comments` do Instagram (72 comentários distintos,
  25/06 a 23/09, 20 da própria loja; vários em ANÚNCIOS, com `media.media_product_type = AD` e o mesmo comentário repetido por `ad_id`).
  O app JÁ está inscrito; o código é que descartava (exigia `value.item === 'comment'`, formato só do Facebook). Lição: conferir janela
  de 30+ dias antes de concluir que um evento "não chega".
- Limite conhecido: o aviso é texto livre via WhatsApp Cloud API (mesmo caminho do relatório diário) e só chega dentro da janela
  de 24 h; o lead no CRM é criado de qualquer forma.

### 04/10/2026 — mensagens diretas (direct do Instagram / Messenger): causa raiz e conserto

> **SUPERADO no mesmo dia pela seção "Central de Mensagens" (abaixo):** DM e comentário **não criam mais lead** (o CRM de leads da Clara é só de WhatsApp,
> decisão da Adriana). As causas raiz abaixo continuam válidas; o "conserto" que criava lead `instagram_dm`/`comentario_*` foi substituído.

- **Duas causas** de nunca ter existido lead de DM (0 em 120 dias; 59 eventos `messaging` do Instagram em 30 dias):
  1. O `receive-leads` só percorria `entry[].changes[]`; a Meta entrega DM em `entry[].messaging[]`. O ramo de DM nunca era alcançado.
  2. Esse ramo fazia `insert` em `leads` **sem `tipo`** (NOT NULL, sem default) e engolia o erro. Mesmo se alcançado, falharia calado.
- **Conserto:** `_shared/mensagem-direta.ts` (`extrairMensagensDiretas`) converte `entry.messaging` para o formato `{field:'messages', value:{sender,message}}`
  que o ramo antigo espera. Ignora eco (`is_echo`, resposta da equipe pelo app), leitura, reação, mensagem da própria página e mensagem apagada;
  anexo vira "[enviou: foto]", resposta a story vira "[Respondeu ao story]". O insert agora leva `tipo: 'compra'`, nome do perfil (melhor esforço, via
  `META_PAGE_ACCESS_TOKEN`) e erro registrado em `lead_errors`. Cada DM recebida avisa a dona por WhatsApp (`avisarMensagemDireta`).
- **A Clara NÃO responde Instagram/Messenger** (verificado: nenhuma function envia por essas redes). Fica para depois (exige API de envio + permissão).
- **Messenger do Facebook:** 0 eventos `messaging` da página em 30 dias (só `feed`). Pode ser página não inscrita em `messages` OU ninguém escreveu. A conferir na Meta.
- **Legenda do Instagram sem convite ao direct/bio** até o direct ser atendido e a bio apontar para o WhatsApp da Clara (hoje é `5534999484285`).
- **Sujeira pré-existente achada (não corrigida):** o idioma `.catch(() => {})` em `supabase.from(...).insert(...)` aparece em `receive-leads` (linhas ~675, 773 e
  no `catch` final ~850). O builder do Supabase não tem `.catch`: se a gravação em `lead_errors` rodar, dá `TypeError` dentro do tratamento de erro.
  Tipos: `deno check` roda via `bunx deno check --no-lock --node-modules-dir=none <arquivo>` (ainda acusa 5 erros antigos no `receive-leads` e vários em `_shared/whatsapp-*`).
- **Teste em produção (04/10/2026, após deploy só do `receive-leads`):** eventos falsos (ids `TESTE_*`) por POST: DM nova criou 1 lead `instagram_dm`
  (tipo `compra`) + conversa; eco e leitura foram ignorados; 2ª DM do mesmo cliente anexou na mesma conversa (sem lead duplicado, anexo virou "[enviou: foto]");
  comentário do Instagram com "valor" criou 1 comentário + 1 lead `comentario_instagram`; reenvio do mesmo comentário não duplicou; `lead_errors` vazio.
  Dados de teste apagados por id. O recebimento do aviso no WhatsApp da dona NÃO é visível pelo banco (confirmação só com ela).
- **ATENÇÃO (segurança, achado no teste):** o `receive-leads` não valida a assinatura `X-Hub-Signature-256` da Meta nos POSTs; qualquer pessoa que conheça a URL
  pode injetar eventos falsos (criar lead, disparar aviso por WhatsApp). Corrigir exige o App Secret da Meta como secret da function. Pendente.

### 04/10/2026 — Central de Mensagens (decisão: fora do CRM da Clara) e assinatura da Meta

**Decisão da Adriana:** mensagens (direct do Instagram, Messenger) e comentários dos posts são geridos na **Central de Redes Sociais**, separados do CRM de
leads da Clara, que serve **só para o WhatsApp** (anúncios orgânicos por WhatsApp no futuro). Nenhum fluxo de rede social cria lead.

- **Tabelas:** `social_conversas` (única por `plataforma`+`contato_id`; `ultima_do_cliente_em` = base da janela de 24 h; `nao_lidas`; `status` aberta/resolvida) e
  `social_mensagens` (`direcao` entrada/saida; `origem` cliente/equipe_app/painel; única por `mid`, o que também absorve o "eco" das respostas enviadas pelo painel).
  `social_comments.demonstra_interesse` (selo). RLS: equipe autenticada (mesmo padrão de `social_comments`); a function do webhook usa a chave de serviço.
- **Webhook (`receive-leads`):** `entry.messaging` → `_shared/mensagem-direta.ts` (entrada de cliente OU **eco** = resposta digitada pela equipe no app, contato = destinatário)
  → `_shared/social-inbox.ts` grava conversa+mensagem (dedup por `mid`) e avisa a dona por WhatsApp só na mensagem NOVA do cliente. O ramo antigo que criava lead de DM foi removido.
- **Responder pelo painel:** Edge Function `social-mensagens` (`verify_jwt = true` + confere o usuário logado dentro, porque a chave anon também passa no verify_jwt).
  Bloqueia fora da janela de 24 h (409), envia por `POST /{FACEBOOK_PAGE_ID}/messages` (não `me`: o token é de usuário do sistema), traduz erros da Meta e grava a resposta.
  **NÃO testada contra a Meta** (enviaria mensagem a cliente real): o primeiro envio de verdade valida permissão/endpoint. Para Instagram o corpo é `{recipient:{id}, message:{text}}`; Messenger acrescenta `messaging_type: RESPONSE`.
- **UI:** aba **Mensagens** (selo de não lidas, atualiza a cada 20 s, aviso da janela) e aba **Comentários** (selo "Interesse de compra", filtro, sem "Converter em Lead").
  Corrigido: a aba Comentários não mandava `platform` ao `social-actions` (curtir/responder comentário do **Instagram** ia pelo caminho do Facebook) e mostrava "Curtido!" mesmo com erro da Meta.
- **Histórico importado** (migration `central_mensagens_importar_historico`, só insere): 19 conversas / 123 mensagens (19 de clientes, 104 respostas da equipe — uma conversa tem 57,
  provável automação/fluxo de anúncio), 68 comentários do Instagram, 35 comentários com interesse (total), 1 conversa não lida.
- **Assinatura da Meta (`X-Hub-Signature-256`)** em `_shared/meta-assinatura.ts` (HMAC-SHA256 sobre o corpo BRUTO, comparação em tempo constante, segredo `META_APP_SECRET` — já existia).
  Rollout em 2 etapas por segurança: **etapa 1a = `log`** (padrão do código; grava `meta_webhook_logs.assinatura_ok/assinatura_motivo` e NÃO bloqueia) → conferir em tráfego real que os eventos
  verdadeiros dão `ok` (atenção: o app do WhatsApp pode ter outro App Secret) → **etapa 1b = `enforce`** (403 sem assinatura válida; secret `META_WEBHOOK_SIGNATURE_MODE=enforce` ou trocar o padrão no código).
  Também removido o token de verificação padrão que estava escrito no código (`META_VERIFY_TOKEN` agora é obrigatório para a verificação GET).
  Consulta de conferência: `select assinatura_ok, assinatura_motivo, platform, count(*) from meta_webhook_logs where created_at > now() - interval '1 day' group by 1,2,3;`
- **Beco sem saída (testes):** simulador de banco em memória precisa de `then` no builder para `await insert()` sem `.select()`; sem isso a gravação "some" no teste (defeito do teste, não do código).

### 04/10/2026 — Fotos com marca de IA (Galaxy AI): decisão, inventário e regra do carrossel

- **O que é:** o "Photo assist" do **Galaxy AI (Samsung, ex.: Galaxy S23 Ultra)** grava nas fotos editadas (1) uma **marca d'água visível "Conteúdo gerado por IA"**
  no canto inferior esquerdo, **nos próprios pixels** (confirmado abrindo o arquivo de 4000×3000 fora do Instagram), e (2) **Credenciais de Conteúdo (C2PA)** nos metadados,
  com `softwareAgent = "Photo assist"` e `digitalSourceType = compositeWithTrainedAlgorithmicMedia`. **Não é rótulo do Instagram** (a 1ª explicação, "Google/Pixel + rótulo da Meta", estava errada).
- **Decisão da Adriana (04/10/2026):** aceitar o selo no post da Frontier já publicado; **nunca remover/esconder a marca** (cortar, retocar ou apagar metadados). A foto foi de fato editada por IA; esconder
  isso em anúncio de veículo engana o comprador (CDC art. 37) e contraria as regras da Meta. Caminho: usar fotos sem a marca ou reenviar as **originais** (o Galaxy guarda a original ao lado da editada) e desligar o Photo assist.
- **Inventário (04/10/2026, detecção por C2PA):** 29 veículos ativos, 554 fotos, **235 (42%) marcadas**; 11 veículos com 10+ fotos limpas, 15 com 8-9, 3 com 6 (Hilux SW4 `QXH1J94`, Tiggo `RTP2G79`, Volvo XC60 `SYI6C55`); nenhum com todas marcadas.
  Na Frontier as 9 limpas são só **interior/painel** — as de fora (com a placa trocada) foram as editadas. Essas mesmas fotos alimentam site e portais (não conferi se a marca d'água aparece lá).
- **Limite da detecção:** só metadados. Foto editada e depois reenviada por WhatsApp perde o C2PA e mantém a marca d'água → aparece como "limpa". Detectar a marca d'água visível exigiria OCR/visão (não feito).
- **Regra do carrossel (`montar-post-veiculo`):** por padrão usa **só fotos limpas** (verificadas por `_shared/foto-marca-ia.ts`, com cache em `veiculo_fotos_ia`); **menos de 6 limpas = não cria o post** (422, código
  `fotos_limpas_insuficientes`); `permitir_fotos_marcadas: true` volta ao antigo. `social_posts.fotos_marcadas_ia` guarda a contagem (selo verde/âmbar no cartão de Aprovações).
- **Aba "Fotos"** da Central (`FotosMarcaIA.tsx`, function `auditar-fotos-ia`, `verify_jwt=true` + confere o usuário dentro): relatório por veículo, "Verificar fotos novas" / "Reverificar tudo". O cache começa VAZIO: depois do deploy, clicar em "Verificar fotos novas".
- **Rascunho do Facebook da Frontier** (`52c8869d`) foi refeito com as 9 fotos limpas (capa agora é foto de interior; o post do Instagram já publicado tem 8 fotos marcadas e segue como está).
- **Ordem da esteira de aprovação (decisão da Adriana, 04/10/2026):** veículos **mais recentes no estoque primeiro**, e para cada veículo o **carrossel e depois o vídeo**. Demais decisões do plano da esteira
  (orgânico x pago, IG+FB juntos, ritmo/horários, vídeos arriscados) ainda abertas. Vídeos do estoque: 7, todos 9:16 (39-71 s); 6 em HEVC; Hilux `RUG8F56` 246 MB/4K sem faststart; Rampage `GTN5D81` 478×850.
- **Beco sem saída:** o Cloudflare do R2 devolve 403 para o User-Agent padrão do Python/urllib (usar `User-Agent: Mozilla/5.0`); Deno/bun/curl passam.
- **Segurança (05/10/2026):** `montar-post-veiculo` aceitava a chave pública (anon) mesmo com `verify_jwt = true` (conseguia criar rascunhos). Agora só aceita a **chave de serviço** (esteira/cron) ou **usuário logado**;
  anon → 401 (testado em produção). Padrão a repetir em toda function chamada pelo painel: conferir o usuário dentro (`auth.getUser`), já que a chave anon também passa no `verify_jwt`.
- **Teste em produção (05/10/2026):** `montar-post-veiculo` na Frontier (só Facebook, rascunho já existente) verificou as 20 fotos (9 limpas / 11 marcadas, igual à contagem independente), populou o cache e não criou nem alterou post.
- **Assinatura da Meta — 05/10/2026:** além do WhatsApp, um evento REAL de Facebook (`page`) também deu `diferente` com `META_APP_SECRET`. Hipóteses: valor guardado com quebra de linha/aspas, ou secret de outro app.
  A conferência agora também tenta o valor sem espaços/quebra de linha/aspas (`meta-assinatura.ts`, testada). Segue em modo `log`; **o bloqueio NÃO foi ligado**. Se continuar `diferente` depois disso, o `META_APP_SECRET`
  guardado não é o App Secret do app que envia (conferir em Meta for Developers → app → Configurações → Básico, e regravar com `! supabase secrets set META_APP_SECRET=<valor> --project-ref htpcqdbhktmvppfemnad`).

### 05/10/2026 — Esteira de postagens (Fase A: carrossel) — construída, NÃO publicada

Decisões da Adriana ("siga com as minhas recomendações"): post **orgânico** (não anúncio pago); **Instagram + Facebook juntos** ("Aprovar os dois"); aprovado sai no **próximo horário livre**
(10h e 18h de Brasília, 2 por dia por rede); veículos **mais recentes no estoque primeiro** (`veiculos.created_at`), carrossel e depois o vídeo do mesmo carro; só **fotos sem marca de IA**; vídeos arriscados por último.

- **Tabelas** (migration `esteira_postagens_tabelas_e_fila` + `esteira_trava_execucao`): `esteira_config` (1 linha: `ativa` **false por padrão**, `posts_por_dia`, `horarios`, `trava_ate`; fora de `social_configuracoes` porque
  aquela guarda os tokens do IG/FB) e `social_esteira` (1 item por veículo+tipo+ciclo; `ordem`, `estado` fila/em_aprovacao/concluido/pulado/bloqueado, `motivo`, `post_ids`). Carga inicial: 29 carrosséis + 7 vídeos, Frontier como concluída.
- **Function `esteira-proximo-post`** (`verify_jwt=false`; confere `x-internal-secret` do cron OU usuário logado OU chave de serviço): sincroniza a fila (veículo novo entra na frente, vendido sai, vídeo novo ganha item), reconcilia os itens
  em aprovação (rascunho decidido = concluído; todos apagados = pulado, nunca recria) e, **só se ativa e sem item pendente**, chama `montar-post-veiculo` (chave de serviço) para o próximo carrossel. Veículo com poucas fotos limpas vira `bloqueado`
  (com o motivo) e a fila segue; erro inesperado não gasta o item. Trava de 2 min evita dois itens simultâneos (cron + tela). Lógica em `_shared/esteira.ts` (testada: 18 casos). Ação `pular` apaga só os RASCUNHOS do item.
- **Horário livre** (`src/lib/horario-livre.ts`, testado: 13 casos): `agendarPost` passa a usar o próximo horário livre para posts `auto_novo`/`auto_rodizio`; "tentar de novo" e posts manuais seguem imediatos.
- **UI:** `EsteiraPainel.tsx` no topo de Aprovações (ligar/pausar, contadores, item atual com "Aprovar os dois" e "Pular veículo", fila e bloqueados).
- **Pendente para entrar no ar:** deploy da function + agendamento (SQL abaixo, **ainda NÃO aplicado**; ao aplicar, usar `apply_migration` e salvar o arquivo com o timestamp real) + commit/push. **Vídeo = Fase B** (Reels/FB, publicação assíncrona; 1º teste com o Compass `QUK1J80`).
- **Colisão conhecida:** o agendamento `post-organico-diario-cron` (ativo) cria 1 rascunho/dia no Facebook com 1 foto, sem a regra de fotos limpas; pode duplicar assunto com a esteira. Decisão pendente: pausar quando a esteira estiver em uso.

  SQL do agendamento da esteira (aplicar só depois do deploy da function e com autorização; conferir antes `select jobname from cron.job where jobname = 'esteira-proximo-post-cron-job'`):
  ```sql
  SELECT cron.schedule('esteira-proximo-post-cron-job', '*/15 * * * *', $$
    SELECT net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/esteira-proximo-post',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', coalesce(public.get_internal_service_secret(), ''))
    );
  $$);
  ```

### 05/10/2026 — Assinatura da Meta: teste no console + descoberta dos DOIS segredos (hipótese forte, não confirmada)

- **Minha verificação está correta:** eventos REAIS do Instagram das 09:35 (antes de trocar o segredo) deram `assinatura_ok = true / ok` com o `META_APP_SECRET` ANTIGO. (Fecha a dúvida "e se o bug for meu?".)
- **Mas** eventos de **Page** (inclusive o teste do console, 10:21) e de **WhatsApp** deram `diferente` com o segredo antigo. Hipótese: apps com o produto Instagram têm um **"segredo do app do Instagram" separado** do segredo principal
  (Configurações do app → Básico). O antigo `META_APP_SECRET` era o do Instagram; Page e WhatsApp são assinados com o principal.
- **Ação de 05/10 (erro meu):** a Adriana gravou o segredo principal do APP CARRO E CIA (id 1369928368361968) em `META_APP_SECRET`, **substituindo o antigo sem eu ter lido o log do Instagram antes**. O valor antigo se perdeu
  (nunca foi lido). Efeito: só em modo `log` (nada bloqueia); mas os eventos do Instagram devem passar a dar `diferente` até o segredo do Instagram voltar. **Solução:** gravar o segredo do app do Instagram em `META_APP_SECRET_2`
  (a conferência já aceita `META_APP_SECRET`, `META_APP_SECRET_WHATSAPP` e `META_APP_SECRET_2`).
- **Botão "Testar" do console** (Meta for Developers → app → Casos de uso → Webhooks → produto Page → campo `feed` → Teste → Enviar para servidor): só ~1 em cada 2-3 envios chegou; o evento é o exemplo "Test Page / Example post content",
  não cria comentário nem lead. Cada envio que chega fica em `meta_webhook_logs` (`payload::text like '%Test Page%'`).
- **Função em memória:** trocar um secret NÃO reinicia a Edge Function já "quente"; reimplantar a function (`supabase functions deploy receive-leads ...`) força o reinício.
- **Segurança operacional:** NUNCA colar segredo no chat; `supabase secrets set NOME=valor` **sem** os sinais `< >` (no bash eles redirecionam arquivo e o comando falha).
- **Bloqueio de eventos falsos continua DESLIGADO** (modo `log`). Só ligar quando eventos reais de `page`, `instagram` e `whatsapp_business_account` mostrarem `ok`/`ok_segredo_N`.

### 05/10/2026 — Auditoria do app Meta (APP CARRO E CIA, id 1369928368361968) feita no navegador, só leitura

- **Webhooks:** Catalog, Page, Instagram e WhatsApp apontam para o mesmo `.../functions/v1/receive-leads`. Assinados (v25.0): Page = feed, messages, message_deliveries, message_reads, message_reactions, messaging_postbacks, messaging_referrals,
  leadgen, leadgen_update, ratings, email; Instagram = comments, messages, message_reactions, messaging_postbacks, messaging_referral; WhatsApp = só `messages`. **`message_echoes` não está assinado** (Page e WhatsApp).
- **Dois segredos:** o caso de uso "Gerenciar mensagens e conteúdo no Instagram" (API do Instagram, login do Instagram) tem um app próprio, **"APP CARRO E CIA-IG" (ID 2965065097175003)**, com **chave secreta própria** (Casos de uso → esse caso → "Configuração da API com login do
  Instagram" → "Chave secreta do app do Instagram", atrás de "Mostrar"). A chave do app principal fica em Configurações do app → Básico. O segredo ANTIGO do `META_APP_SECRET` validava os eventos reais do Instagram (provável chave do app IG).
- **CAUSA PROVÁVEL do Messenger mudo e de só ~19 DMs de clientes (vs 104 respostas da equipe):** TODAS as permissões estão em **"Pronto para teste" (acesso padrão)**, incluindo `pages_messaging` (157 chamadas), `instagram_manage_messages` (61),
  `pages_manage_metadata`; a **Análise do app está "Não enviado"** (32 solicitações preparadas, nenhuma submetida) e o app está "Publicado" (ativo). Regra geral da Meta: com acesso padrão o app só recebe mensagens de quem tem FUNÇÃO no app (admin/dev/testador).
  Não confirmado com teste de cliente real. Solução = **Análise do app** (acesso avançado) + verificação da empresa. A tela "Configuração da API do Messenger" mostra o passo 3 "Pedir permissão" de `pages_messaging` pendente.
- A página "Carro e Cia Veículos" (id 1419304271478565) está inscrita no app com 5 campos (messages, messaging_postbacks, message_reactions, messaging_referral, comments); nenhum token de página gerado na tela (o sistema usa token de usuário do sistema).
  Passo 2 ("Gerar tokens de acesso") da API do Instagram está incompleto. Outras páginas/apps da conta (Guia Low Carb, Km Zero) NÃO são do projeto e não foram tocadas.
- **Operação do navegador:** havia 2 Chromes conectados à extensão; usar `list_connected_browsers`/`switch_browser` e conferir que a Adriana está vendo o mesmo. Rolar com o mouse às vezes amplia a página (usar `find` + clique por ref). O console da Meta é pesado (screenshot pode estourar tempo).

### 05/10/2026 — Auditoria completa do app Meta (continuação): verificação da empresa, permissões do Instagram, checklist da API do Instagram

- **Verificação da empresa: FEITA.** Portfólio `carroeciaveiculos` (id 298827564319943): "Verificação para LGA COMERCIO DE VEICULOS LTDA — verificada em 11/06/2026". Caso de uso de verificação: "o app exige acesso a permissões no Meta for Developers".
  Dependência crítica da Análise do app já satisfeita. Central de Segurança: **2FA pendente para 1 de 8 pessoas**; há administrador secundário.
- **Permissões do caso de uso "API do Instagram"** (todas "Pronto para teste", acesso padrão; chamadas): instagram_business_basic 44, instagram_business_manage_comments 11, instagram_business_manage_messages 31, instagram_manage_messages 61, instagram_manage_comments 30,
  instagram_content_publish 51, instagram_manage_insights 12, instagram_basic 209. **`instagram_manage_engagement` NÃO habilitada ("Adicionar à análise do app")** → o botão "Curtir" de comentário do Instagram (social-actions) não deve funcionar.
- **Checklist "Configuração da API com login do Instagram":** 1 permissões ✔, 2 "Gerar tokens de acesso" incompleto, 3 webhooks ✔, 4 "Configurar o login da empresa no Instagram" incompleto, 5 "Concluir a análise do app" incompleto — texto da Meta: para acessar dados ao vivo o Instagram
  exige a análise do app, para ter ACESSO AVANÇADO às permissões do Instagram. (Confirma por escrito a causa dos DMs de clientes não chegarem.)
- Webhooks do Instagram: o produto "Instagram" da tela geral só mostra o aviso de que a configuração do login do Instagram é aceita apenas dentro do próprio produto.

### 05/10/2026 (tarde) — CORREÇÃO IMPORTANTE: a Análise do app (acesso avançado) provavelmente NÃO é necessária para este app

**Erro meu:** afirmei, nas seções anteriores de hoje ("CAUSA PROVÁVEL do Messenger mudo e de só ~19 DMs de clientes: acesso padrão" e o plano de Análise do app com vídeos), que sem acesso avançado as mensagens de clientes não chegariam.
A Adriana contestou ("para uso da própria empresa isso não é obrigatório") e estava CERTA. Verificado na documentação oficial da Meta e nos nossos dados:
- **Docs (Messenger Platform → Overview → "Before you begin"):** App Review só se o app precisa de Advanced Access, e "não exigido se você só envia e recebe mensagens da sua PRÓPRIA página do Facebook".
  **Docs (Instagram Platform → Overview):** acesso avançado é para contas profissionais que você NÃO possui/gerencia; "se o app só serve a sua conta profissional do Instagram ou uma que você gerencia, o acesso padrão é tudo de que precisa" (conta própria ou adicionada ao app no painel; o app pode ser reivindicado por um portfólio empresarial — o nosso é de `carroeciaveiculos`).
  **Guia de submissão:** apps só de uso interno devem usar a finalidade "Você mesmo ou sua própria empresa".
  (Há uma frase na doc de webhooks dizendo que, no acesso padrão, as notificações vêm de quem tem função no app; está em tensão com as duas acima e os dados abaixo decidem.)
- **Nossos dados refutam a hipótese:** conversas do Instagram com mensagens de **~10 clientes diferentes** chegaram ao webhook ao longo de jun–out/2026 (um com 5 mensagens do cliente, outro com 4, outro com 3...), todas com o app em acesso padrão.
  O desequilíbrio (≈22 do cliente × 104 da equipe) vem de a equipe escrever muito (uma conversa tem 54 mensagens da equipe), não de mensagens perdidas.
- **Messenger (Facebook): zero eventos em 30 dias NÃO prova defeito** — pode simplesmente não ter havido mensagem pelo Messenger. Falta o TESTE empírico: mandar uma mensagem de uma conta comum (sem função no app) para a página e ver se chega em `meta_webhook_logs`.
- **Decisão:** NÃO enviar o app para análise agora. Plano de vídeos/pacote de permissões/usuário revisor fica ARQUIVADO como plano B (só se o teste do Messenger com conta comum falhar).
- **Exigências da submissão (se um dia for necessária), da doc oficial:** descrição de uso específica por permissão; vídeo de tela (1080p, interface em inglês, legendas, sem narração, cursor visível) mostrando o uso; ao menos 1 chamada de API com sucesso por permissão nos últimos 30 dias;
  ícone 1024×1024; URL da política de privacidade; categoria correta; verificação da empresa (feita em 11/06/2026); instruções de teste com contas de teste.
- **O que realmente falta (sem análise):** habilitar `instagram_manage_engagement` (Curtir comentário; está "Adicionar à análise do app" = não habilitada no caso de uso), assinar `message_echoes` no Page, completar "Gerar tokens de acesso" do Instagram se usarmos o login do Instagram,
  corrigir os segredos da assinatura. Checar em Configurações do app → Básico a finalidade do app ("Você mesmo ou sua própria empresa").

### 05/10/2026 (tarde) — Mudanças feitas na Meta (com autorização da Adriana, navegador "laptop") e checagem do app

- **`instagram_manage_engagement` habilitada** (Casos de uso → API do Instagram → Permissões e recursos → "Adicionar à análise do app"): passou a "Pronto para teste" (acesso padrão, 0 chamadas). NÃO foi enviado nada à Meta. Habilita o botão "Curtir" de comentário do Instagram.
- **Page → `message_echoes` assinado em v25.0** (Webhooks → produto Page; versão trocada de v26.0 para v25.0 antes de assinar, para manter a mesma versão dos demais campos assinados). Respostas da equipe no Messenger passam a chegar como `is_echo`.
- **Configurações do app → Básico (só leitura, chave NÃO aberta):** política de privacidade, termos de serviço e instruções de exclusão de dados apontam para `https://www.carroeciamotors.com.br/politica-de-privacidade` (a página cobre LGPD, termos e exclusão); categoria "Negócio e Páginas";
  ícone do app existe (logo "CRM"); namespace `carroecia`; domínios `carroeciamotors.com.br` e `carroeciamotors.com.br/admin/login` (o 2º é um caminho, não um domínio — estranho); e-mail de contato `atendimento.carroecia@hotmail.com` (hotmail, vale trocar por e-mail da empresa).
  O campo "finalidade do app" NÃO apareceu em Básico (pode estar em Avançado) — não confirmado.
- **Pendente: teste do Messenger com conta comum** (sem função no app): mandar mensagem à página "Carro e Cia Veículos" e conferir `meta_webhook_logs` (platform facebook, `entry.messaging`). Resultado decide se a Análise do app (plano B) será necessária.

### 05/10/2026 (11:2x) — Teste do Messenger: mensagem de conta pessoal da Adriana NÃO chegou ao webhook

- Mensagem enviada ao Messenger da página "Carro e Cia Veículos" pela conta pessoal da Adriana (provavelmente com função de administradora no app → conta COM função). Nenhum evento `messaging` do Facebook em `meta_webhook_logs` (último evento de qualquer tipo: 10:57, o teste do console).
- **Implicação:** se uma conta COM função também não entrega, a restrição "só quem tem função" NÃO explica o silêncio do Messenger → a Análise do app (plano B) NÃO está justificada por esse sintoma. A causa é outra.
- **Hipóteses a verificar (nesta ordem):** (1) **Handover Protocol**: o "receptor primário" das conversas da página pode ser o Page Inbox/outro app, e o nosso app só receberia pelo canal `standby` (campo `standby`/`messaging_handovers` NÃO assinados no Page);
  (2) atraso/erro de entrega do lado da Meta (botão "Mostrar erros recentes" da API do Messenger, passo 1 — não consegui abrir); (3) mensagem em "Solicitações"/spam; (4) mensagem de administrador para a própria página tratada de forma diferente — repetir com outra conta pessoal SEM função e sem administrar a página.
- Console da Meta: passos 1 (webhooks) e 2 (página conectada/inscrita) da API do Messenger estão ✅; o passo 3 (análise do app) pede `pages_messaging`. O console ficou instável (cliques por coordenada erraram: um levou à tela "Análise do app → solicitação atual", status continuou "Não enviado"; usar sempre `find` + ref).

### 06/10/2026 — Página inscrita nos campos de mensagens (Messenger) + esteira no ar

- **Causa do Messenger mudo, confirmada:** `GET /{pagina}/subscribed_apps` (token da PÁGINA, obtido de `/{pagina}?fields=access_token` com o token do usuário do sistema) mostrava o app "APP CARRO E CIA" inscrito **só em `feed` e `name`**. O token do sistema já tinha `pages_messaging`, `pages_manage_metadata`, `instagram_manage_messages`.
- **Correção (autorizada pela Adriana, 06/10):** `POST /{pagina}/subscribed_apps` com `subscribed_fields=name,feed,messages,message_echoes,messaging_postbacks,message_reactions,messaging_referrals` → `success:true`; releitura confirmou os 7 campos. **O POST SUBSTITUI a lista do app**, por isso `name` e `feed` foram reenviados junto. `leadgen` NÃO foi incluído (não pedido). Feito por função temporária (`diag-meta-pagina`), já **apagada** (pasta, entrada do config.toml e `supabase functions delete`).
- **Becos:** `GET /{instagram_id}/subscribed_apps` com o token do sistema dá `(#100) Tried accessing nonexisting field (subscribed_apps)` (o campo não existe nesse nó; o Instagram recebe pelo webhook da Página/app do Instagram, não por aqui). `subscribed_apps` exige token da página (o do usuário do sistema dá erro 190).
- **Falta testar:** a Adriana mandar uma mensagem à página pelo Messenger e conferir em `meta_webhook_logs`/`social_mensagens` (e a aba Mensagens) que chegou; a assinatura ainda está em modo `log`.
