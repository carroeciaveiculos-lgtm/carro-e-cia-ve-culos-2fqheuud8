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
