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
| 2 — Carrossel | Carrossel IG (contêineres filhos + pai) e várias fotos no FB | pendente |
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
