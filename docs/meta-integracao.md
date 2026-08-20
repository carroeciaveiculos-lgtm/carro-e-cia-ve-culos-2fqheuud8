# Meta (WhatsApp/Facebook/Instagram) — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa. Complementa `docs/leads-e-sdr.md` (o caminho de um
lead até a Clara) e `docs/meta-ads-mcp.md` (conector de gestão de campanhas)
— este documento é sobre as Edge Functions que conversam direto com a API
Graph do Meta.

Última atualização: 2026-08-18.

## Mapa das 9 functions

| Function | Direção | O que faz |
|---|---|---|
| `receive-leads` | Recebe (webhook) | **Único webhook do Meta realmente ativo hoje** — mensagens do WhatsApp, comentários públicos, leads de anúncio (leadgen) |
| `whatsapp-webhook` | Recebe (webhook) | Webhook alternativo pra mensagens do WhatsApp — **código morto, nunca recebeu tráfego real** (ver achado abaixo) |
| `webhook-portais` | Recebe (webhook) | Webhook genérico "de portais" que também sabe processar payload do Meta — **também nunca recebeu tráfego real** |
| `send-whatsapp` | Envia | Manda mensagem de WhatsApp (texto, template, documento, imagem, vídeo) — usada pelo CRM/Clara |
| `social-actions` | Envia | Curtir/descurtir, responder, ocultar/desocultar, excluir comentário do Facebook/Instagram — usada pela tela de moderação |
| `publicar-social` | Envia | Publica post agendado (`social_posts`) no Facebook/Instagram — texto, imagem ou vídeo |
| `meta-capi-postback` | Envia | Manda evento de conversão "Purchase" pro Meta Ads quando um veículo é marcado como Vendido |
| `public-inventory-feed` | Serve dado | Feed CSV público do estoque, formato exigido pelo Facebook Commerce Manager (Catálogo de Veículos) |
| `crm-inventory-feed` | Serve dado | Mesmo estoque, em JSON — consumidor não identificado no código deste repositório |

## O caminho de uma mensagem/comentário do Meta

```
Meta (WhatsApp Business API / Facebook Page / Instagram)
  └─ webhook único registrado no app do Meta (ver achado abaixo)
     └─ receive-leads
        ├─ field='messages'   → cria/atualiza lead, grava conversation_history
        │                       (extrai veiculo_interesse do referral.body
        │                       quando a mensagem veio de anúncio — ver
        │                       docs/leads-e-sdr.md)
        ├─ field='leadgen'    → lead de formulário de anúncio (Meta Lead Ads)
        └─ field='feed'/'comments' → social_comments (fila de moderação,
                                      não vira lead)
        + toda mensagem também grava em meta_webhook_logs (log bruto)
```

## O caminho de uma venda até o Meta Ads

```
veiculos.status → 'Vendido' (trigger de banco, ver migration
20260709170722_slugify_unaccent_capi_trigger.sql)
  └─ meta-capi-postback
     ├─ POST graph.facebook.com/{pixelId}/events   evento Purchase (CAPI)
     └─ dispara ads-agent (action: pause_sold_ads) — pausa anúncio do
        veículo vendido (ver docs/documentacao-api.md, grupo IA)
```

## Fatos confirmados

| Fato | Como se sabe |
|---|---|
| **Achado 18/08/2026 — `whatsapp-webhook` é código morto.** As tabelas que essa function escreve (`crm_mensagens`, `agente_interacoes`) têm **0 linhas desde sempre**. Enquanto isso, `conversation_history` (escrita por `receive-leads`) tem 87 linhas, a mais recente de ontem (17/08). Conclusão: o Meta está configurado pra chamar `receive-leads`, não `whatsapp-webhook` — inclusive o recurso de "comando por WhatsApp pro número autorizado" (`processWhatsAppCommand`) dentro dela nunca foi executado de verdade | `select count(*), max(created_at) from crm_mensagens/agente_interacoes/conversation_history`, 18/08/2026 |
| **Achado 18/08/2026 — `webhook-portais` também nunca recebeu tráfego do Meta.** Ela logaria em `meta_webhook_logs` com `event_type: 'webhook_event'` — esse valor não existe **nenhuma vez** na tabela (os `event_type` reais que aparecem são `page`/`whatsapp_business_account`/`instagram`, que é o padrão de log do `receive-leads`, com timestamp de hoje) | `select event_type, count(*), max(created_at) from meta_webhook_logs group by event_type`, 18/08/2026 |
| `social-actions` traduz a mesma ação (curtir, responder, ocultar, excluir) pra rotas **diferentes** da Graph API dependendo se é Facebook ou Instagram — não é uma chamada genérica | leitura de `social-actions/index.ts`, bloco de roteamento por `action`/`isInstagram` |
| `publicar-social` espera vídeo do Instagram terminar de processar (`waitForInstagramMediaReady`, até 10 tentativas de 3s) antes de publicar — publicar cedo demais falha | leitura de `publicar-social/index.ts`, linhas 24-55 |
| `publicar-social` teve um bug real corrigido em 14/08/2026 (import faltando quebrava toda chamada com `ReferenceError`) e **nunca existiu cron chamando ela** até então — publicação agendada não disparava sozinha | comentário no próprio código, linhas 57-62 |
| `public-inventory-feed` e `crm-inventory-feed` fazem a mesma consulta (`veiculos` disponíveis e visíveis no site) em formatos diferentes (CSV vs JSON) — nenhuma achou motivo de existirem separadas além do formato de saída | leitura comparada dos dois arquivos |
| `meta-capi-postback` só dispara com `status === 'Vendido'` — qualquer outro valor é rejeitado (400) | leitura de `meta-capi-postback/index.ts`, linha 16 |
| **Instagram Stories implementado, Facebook Stories não (20/08/2026).** `publicar-social` lê `social_posts.content_type` (seletor "Formato" em `RedesSociais.tsx`, Central de Redes Sociais → Publicações) — `content_type='stories'` manda `media_type: 'STORIES'` pro Instagram (aceita foto ou vídeo, sem `caption` — Stories não exibe legenda via API). Facebook Stories usa endpoint totalmente diferente (`/photo_stories` ou `/video_stories`, não `/feed`/`/photos`) e provavelmente exige permissão extra do app ainda não confirmada — não implementado; se vier `stories` + Facebook marcado, `publicar-social` registra erro claro em vez de publicar errado no feed. Removida a duplicata: a aba "Redes Sociais" que existia dentro de `Marketing.tsx` (formulário próprio, `redes` em formato array incompatível, opção "google" nunca implementada) devia ter saído quando a Central de Redes Sociais foi criada em 14/08/2026 — nunca saiu. Removida agora; criar/agendar post social só existe em `/admin/central-social` | código em `publicar-social/index.ts` e `RedesSociais.tsx`, 20/08/2026 |
| **Achado 20/08/2026 — post criado por "Ideias com IA" nunca era publicado de verdade, mas o painel mostrava "Publicado".** `IdeiasSociais.tsx` gravava `social_posts.redes` como lista (`['facebook','instagram']`); `publicar-social` sempre leu esse campo no formato objeto (`{facebook:true,...}`) usado pelo resto do sistema. Sem bater o formato, `redes.facebook`/`redes.instagram` ficavam `undefined` — nenhuma chamada de API acontecia, e como "nenhuma rede tentada" não gera erro, o post virava "Publicado" com sucesso vazio. Corrigido: `IdeiasSociais.tsx` já salva no formato objeto certo; `publicar-social` normaliza lista→objeto se receber o formato antigo (defensivo, cobre posts já salvos errado). Junto, `logs_integracao.payload_erro` agora grava sempre o resultado real (`post_id`/`link` do Facebook, `media_id` do Instagram, ou o erro) — antes só gravava algo quando dava erro, sem jeito de confirmar link do post depois de um sucesso | teste ao vivo, 20/08/2026; código em `IdeiasSociais.tsx` e `publicar-social/index.ts` |

## Becos sem saída — não repetir

- Não adianta procurar no código deste repositório qual sistema externo
  consome `crm-inventory-feed` — não há chamador no `src/`, não foi
  encontrado nesta sessão.
- Não vale a pena depurar `whatsapp-webhook`/`webhook-portais` achando que
  tem bug impedindo o recebimento — o problema não é bug de código, é que
  **o Meta simplesmente não chama essas URLs** (a URL registrada no app é
  outra). Ver achados acima.

## Em aberto

- **Decisão pendente da Adriana**: `whatsapp-webhook` e `webhook-portais`
  parecem código morto — candidatas a remoção, no mesmo espírito das
  functions "inertes" já achadas antes (`wm-sync-test`,
  `wm-sync-validator-test`, ver `docs/edge-functions-rules.md`). Não
  removidas nesta sessão — decisão de apagar não é automática, ver
  `.claude/skills/manual-operacional/SKILL.md` (mesmo princípio: achado se
  reporta, não se decide sozinho).
- Não confirmado se `crm-inventory-feed` tem algum consumidor externo ativo
  — antes de mexer nela (ou remover), valeria confirmar com a Adriana se
  algum parceiro/CRM externo usa essa URL.
- Não confirmado quais variáveis de ambiente (`META_PAGE_ACCESS_TOKEN`,
  `META_PIXEL_ID`, `META_ADS_TOKEN`, `FACEBOOK_PAGE_ID`,
  `INSTAGRAM_BUSINESS_ID`) estão de fato configuradas hoje — fora do
  escopo desta sessão (só documentar).
