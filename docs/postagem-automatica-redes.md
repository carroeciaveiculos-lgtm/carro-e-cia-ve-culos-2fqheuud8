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
