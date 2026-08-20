# Origem de leads — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Última atualização: 2026-08-19 — inclui `ai_score`/`temperatura`, vocabulário
padronizado de `origem`, catálogo/pixel do Meta e roteiro do anúncio de
consórcio.

## O problema original (auditoria 18-19/08/2026)

Toda mensagem de WhatsApp que chega pela `receive-leads` vira lead. A origem
só era reconhecida corretamente quando a Meta manda um pacote extra
(`referral`) — isso só acontece em clique de anúncio real (Facebook/Instagram
Ads). Sem isso, **qualquer outro caminho caía no mesmo balde**,
`whatsapp_organico`: cliente que buscou o número por conta própria, indicação
de terceiros, e — o achado que motivou o ajuste — **cliente que clicou num
botão de WhatsApp do próprio site**. Um link `wa.me` é só texto, não carrega
sessão nem parâmetro, então não tinha como saber qual desses três era.

## Mecanismo atual

```
Cliente clica em "Falar no WhatsApp" em qualquer página do site
  └─ handleCommercialCTA() (src/lib/cta-router.ts) — usado pelos 12 pontos
     de clique do site (ficha de veículo, financiamento, menu, botão
     flutuante, páginas de consignação etc.)
     ├─ trackCTAClick/trackWhatsAppClick — GTM + Meta Pixel, só analytics
     └─ buildRefTag() anexa uma linha no fim da mensagem pré-preenchida:
        _ref: site|{página}|{botão}|{veículo}|{utm_source}|{utm_campaign}|{gclid}_
        (utm/gclid vêm de obterAtribuicaoAnuncio(), src/lib/ad-tracking.ts —
        já existia, capturado 1x por 30 dias, só era usado pelos formulários
        de consignação)

  ... cliente manda a mensagem de verdade ...

  └─ receive-leads (webhook do WhatsApp)
     ├─ sem `referral` da Meta E sem a tag → origem 'whatsapp_organico'
     │  (contato espontâneo de verdade — não veio nem de anúncio nem do site)
     ├─ com `referral` da Meta → origem 'facebook_ads'/'instagram_ads'
     └─ sem `referral` MAS com a tag → origem 'site_whatsapp', campanha =
        botão/página, veiculo_interesse = veículo (se veio de ficha),
        utm_source/utm_campaign/gclid preenchidos se existirem
     A tag é removida do texto antes de salvar em `conversation_history` e
     antes de mandar pra Clara (`ai-sdr`) — nunca aparece pro time nem
     entra no contexto da IA.
```

## Testado ao vivo (19/08/2026)

Simulado um payload de webhook do WhatsApp real (telefone de teste) com a
tag no formato exato que `cta-router.ts` gera — confirmado: `origem` virou
`site_whatsapp`, `campanha` e `veiculo_interesse` corretos,
`conversation_history.message_text` salvo **sem** a tag, e a Clara respondeu
normalmente (não viu nem reagiu à tag). Registro de teste apagado depois.

## Achados da auditoria que motivou o ajuste

- Nos 50 leads mais recentes antes do ajuste (10-18/08/2026): 41 de anúncio
  (rastreável até a campanha), 9 "WhatsApp direto" sem nenhuma pista de
  origem, 0 de formulário do site (site tem formulário completo com UTM/
  gclid, mas só é usado nas páginas de **vender** o carro — quem quer
  **comprar** sempre vai pelo WhatsApp).
- `ai_score` (nota de "lead quente") é lido em pelo menos um lugar do
  código mas **nunca é escrito em lugar nenhum** — todo lead tinha
  `ai_score = 0`, sem exceção (123/123 confirmado). `temperatura` tem
  mecanismo real (a Clara pode marcar via tool call), mas raramente é
  usado (121/123 "frio"). **Não corrigido ainda** — próximo item da lista,
  pendente de decisão sobre o critério (Clara calcula vs. regra
  determinística).
- Mercado Livre e Webmotors têm código pronto pra receber lead
  (`ml-webhook`, `webhook-portais`) mas zero lead real chegou — não
  confirmado ainda se o webhook está cadastrado nos painéis desses
  portais (mesmo tipo de achado do Autentique, ver `docs/autentique-integracao.md`).
- NaPista não tem webhook de lead nenhum — só um endpoint de consulta
  (`GET /seller/{id}/leads`), nunca implementado do nosso lado (precisa de
  cron, não de webhook).

## `ai_score` e `temperatura` — leads quentes (19/08/2026)

**Achado antes de corrigir**: não era só o `ai_score` que nunca era escrito
— `atualizar_estagio_lead` e `agendar_visita` (as únicas ferramentas que a
Clara tem pra marcar temperatura/status) praticamente nunca eram chamadas
na prática. Achei um lead com **36 mensagens trocadas** e outro com **34**,
ambos de conversas depois da correção de 12/08/2026 que fez o function
calling da Clara funcionar de verdade (antes as chamadas eram descartadas)
— e mesmo assim `status` continuava "novo", `temperatura` "frio", `ai_score`
0. `agendamentos_visita` tinha **0 registro em todo o histórico do banco**,
apesar da function existir e funcionar quando testada isoladamente. Ou
seja: comportamento do modelo (raramente decide chamar), não bug de código.

### Correção 1 — `ai_score` calculado por código, sem depender da Clara

`_shared/lead-score.ts` (`recalcularAiScore`) — roda sempre, com sinais
objetivos, teto 100:

| Sinal | Pontos |
|---|---|
| `veiculo_interesse` preenchido | +20 |
| 5 ou mais mensagens trocadas (`conversation_history`) | +15 |
| E-mail salvo | +10 |
| Visita agendada (`agendamentos_visita` existe pro lead) | +40 |
| Origem paga (`facebook_ads`/`instagram_ads`/UTM/gclid) | +10 |

Chamado depois de cada resposta da Clara (`ai-sdr`, `continue_conversation`)
e depois de cada mensagem de DM do Instagram/Messenger (`receive-leads`,
ramo que não passa pela Clara e nunca tinha esse cálculo).

### Correção 2 — prompt da Clara reforçado

Adicionada seção "QUALIFICAÇÃO DO LEAD" no prompt (`ai_prompts_config`,
slug `sdr_whatsapp`, e replicada em `social_configuracoes.ai_system_prompt`
pra manter os dois em sincronia) — gatilhos concretos amarrados aos mesmos
passos do fluxo que a Clara já segue bem: marcar `morno` ao identificar o
veículo ou confirmar interesse, marcar `quente` ao agendar visita.

### Correção 3 — bug pequeno no relatório de WhatsApp

`_shared/whatsapp-crm.ts` (`handleQuentes`) filtrava por
`temperatura.eq.Quente` (Q maiúsculo) — o valor real salvo é sempre
minúsculo (`quente`), então o filtro nunca batia com nada. Corrigido.

### Testado ao vivo (19/08/2026)

Simulada uma conversa completa de 4 mensagens (telefone de teste): pergunta
sobre veículo → confirma modelo e pergunta preço → confirma interesse e
pede visita → informa o nome. Resultado real, sem nenhuma intervenção
manual: `ai_score` subiu 0 → 15 (5+ mensagens, mecanismo determinístico,
antes mesmo de qualquer chamada de ferramenta) → 75 (veículo + mensagens +
agendamento) — `temperatura` virou `quente`, `status` virou `agendamento`,
`veiculo_interesse` capturado ("Honda HR-V EXL 2020"), e um registro real
em `agendamentos_visita` foi criado pela Clara — o primeiro da história do
banco. Registros de teste apagados depois.

## Vocabulário padronizado de `origem` (19/08/2026)

Antes desta correção, `origem` tinha um valor diferente por arquivo que
escrevia nele — maiúscula/minúscula misturada, português e inglês
misturados (`'LP'`, `'Página Contato'`, `'Manual'`, `'homepage_formulario'`,
`'Portal - webmotors'`). Padronizado pra um conjunto fechado, sempre
minúsculo, snake_case:

| Valor | Significado | Onde é gravado |
|---|---|---|
| `whatsapp_organico` | Contato espontâneo real (sem anúncio, sem clique do site) | `receive-leads` |
| `site_whatsapp` | Clicou em botão de WhatsApp do site | `receive-leads` (ver seção do item 1 acima) |
| `facebook_ads` | Anúncio Facebook, clique-para-WhatsApp | `receive-leads` |
| `instagram_ads` | Anúncio Instagram, clique-para-WhatsApp | `receive-leads` |
| `meta_lead_ads` | Formulário nativo Facebook/Instagram (Lead Ads) | `receive-leads` |
| `facebook_dm` / `instagram_dm` | Mensagem direta no Messenger/Instagram (fora do WhatsApp) | `receive-leads` |
| `comentario_facebook` / `comentario_instagram` | Comentário público virado lead manualmente | `SocialComments.tsx` |
| `google_ads` | Anúncio Google (gclid presente) | `Hero.tsx`, `lead-automation` |
| `site_formulario` | Formulário genérico do site (Contato, Home) | `Contato.tsx`, `Hero.tsx` |
| `site_consignacao` | Formulário de vender/consignar carro | `LeadForm.tsx`, `ConsignacaoLPForm.tsx`, `Consignment.tsx` |
| `mercadolivre` / `webmotors` / `icarros` | Portal (via `portal` na URL do webhook) | `ml-webhook`, `webhook-portais` |
| `avaliacao_avulsa` | Pedido de avaliação avulso | `avaliacoes.ts` |
| `manual` | Cadastro manual pelo time no painel | `LeadFormModal.tsx` |
| `clara` | Lead interno criado pela IA durante o atendimento (ex: encaminhamento pra seguro/consórcio) — sempre nasce dentro de uma conversa que já tem seu próprio lead com origem correta | `ai-sdr`, `criar_lead_crm` |

**Removida** a pergunta "Como nos conheceu?" do formulário de consignação
da home (`Consignment.tsx`) — coletava resposta livre do cliente
(Google/Instagram/Indicação/Outro) direto em cima do mesmo campo `origem`
técnico, colidindo com o rastreio automático. Decisão da Adriana: remover
em vez de mover pra outro campo.

**Registros antigos padronizados** (`UPDATE` direto, sem perda de dado):
`'whatsapp'` (78 registros, formato anterior à correção de 12/08/2026) →
`whatsapp_organico`; `'LP'` (2 registros) → `site_consignacao`.

## Imagem do anúncio no Conversador (19/08/2026)

**Achado**: o `referral` que a Meta manda na primeira mensagem de
clique-para-WhatsApp sempre trouxe `thumbnail_url` (imagem do criativo) e
`video_url` (link pro post, quando o anúncio é vídeo) — mesmo padrão do
achado de `referral.body` (17/08/2026): sempre chegou, sempre foi
descartado.

- Duas colunas novas em `leads`: `anuncio_thumbnail_url`,
  `anuncio_video_url` (migration `20260819140000_leads_anuncio_thumbnail`).
- **`thumbnail_url` da Meta expira** (CDN assinada do Facebook) — por isso
  `receive-leads` baixa a imagem e re-hospeda no R2
  (`leads-anuncios/{timestamp}_{id}.{ext}`, mesmo padrão de
  `gerar-imagem`) antes de gravar. `video_url` é um link permanente pro
  post, grava direto sem baixar nada.
- Se o download/upload falhar por qualquer motivo, não bloqueia a criação
  do lead — só fica sem thumbnail (`try/catch` isolado).
- `ConversationPanel.tsx` (o Conversador): mostra a imagem no lugar do
  avatar quando existe — clicável, abre o vídeo/post do anúncio no
  Facebook em aba nova se `anuncio_video_url` estiver preenchido.

**Testado ao vivo (19/08/2026)**: payload de webhook simulado com
`referral.thumbnail_url` real — imagem baixada, re-hospedada no R2,
confirmada acessível publicamente (`200 OK`, JPEG real). Registro de
teste apagado depois (o arquivo de teste no R2 ficou, é pequeno e sem
dado sensível — baixa prioridade).

## Alerta de canal silencioso (19/08/2026)

`daily-report-cron` (já existia, roda diariamente e manda relatório pro
WhatsApp da Adriana) ganhou uma checagem nova: se um dos canais que hoje
geram lead de verdade (`facebook_ads`, `instagram_ads`,
`whatsapp_organico`, `site_whatsapp`) ficar **7 dias ou mais** sem nenhum
lead, entra uma linha de alerta no relatório. Mercado Livre/Webmotors/
NaPista ficam de fora de propósito — nunca geraram lead nenhum (achado já
documentado, agendado pro futuro), incluir eles geraria alerta repetido
todo dia sobre a mesma coisa já conhecida, não uma quebra nova.

O relatório também passou a agrupar por `origem` em vez de `source`
(19/08/2026) — `source` é genérico demais (tudo que vem de WhatsApp cai
junto, sem distinguir anúncio de contato espontâneo), `origem` agora que
está padronizado é mais útil pro resumo diário.

## Catálogo do WhatsApp e Pixel com match rate zero (19/08/2026)

**Dois catálogos no app do WhatsApp Business.** Em Configurações →
Ferramentas comerciais → Catálogo aparecem dois: `776725003388779` (real,
saudável, 25 veículos, sincroniza sozinho a cada hora via
`public-inventory-feed`) e `573459484725077` (vazio, sem marca de "Ativo" —
criado automaticamente pelo próprio app na primeira vez que alguém abriu
essa tela, nunca usado). Conta do WhatsApp usada: `1530053735172401`
(WABA — não existe ferramenta no Meta Ads MCP pra consultar isso
diretamente, só o que a Adriana confirma olhando o app).

**Ação pendente (manual, feita pela Adriana, fora do código):** reconectar
o WhatsApp ao catálogo `776725003388779` — pelo próprio app (Configurações
→ Ferramentas comerciais → Catálogo → trocar) ou pelo Gerenciador de
Negócios (Contas do WhatsApp → aba Catálogo). Depois de reconectado, o
catálogo vazio (`573459484725077`) pode ser excluído pelo Gerenciador de
Comércio (não tem API pra isso).

**Pixel com match rate 0% por 30 dias — causa raiz e correção.** O Pixel
(`917411362618696`, conectado ao catálogo `776725003388779`) mostrava
`matched_content_ids_count: 0` em todo evento (`ViewContent`, `Lead`,
etc.) todo dia, por 30 dias seguidos. Causa: `index.html` carrega o script
do Pixel com 2s de atraso proposital (otimização de performance), e
`trackMetaEvent` (`src/lib/tracking.ts`) descartava silenciosamente
qualquer evento disparado antes de `window.fbq` existir — sem fila, sem
retry. Como a página de veículo dispara `ViewContent` quase imediatamente
ao montar, a corrida contra os 2s quase sempre era perdida. Corrigido com
uma fila (`window._fbqPending`): evento é guardado se `fbq` ainda não
existe, reenviado assim que o script termina de carregar. Commit
`1b938a6`. **Follow-up pendente**: conferir se o match rate subiu, alguns
dias depois do fix — lembrete salvo na memória do Claude.

## Anúncio de consórcio — roteiro pronto e fluxo de criação (19/08/2026)

Página de destino já existe no site: `/consorcio-auto` (parceria Carro e
Cia × Km Zero Corretora / Adriana Araújo), com CTA "Simular consórcio pelo
WhatsApp" (WhatsApp da Adriana, não passa pelo `cta-router.ts` — link
direto `wa.me` fixo na página).

**Roteiro decidido:**
- Destino do anúncio: clique direto pro WhatsApp (Click-to-WhatsApp),
  não passa pelo site.
- Conta de anúncio: "Ca - Carro e Cia" (`515820120462587`).
- Orçamento sugerido: R$30–40/dia, 7 dias de teste.
- Texto principal: "Troque de carro sem pagar juros. 🚗 Use seu veículo
  atual como lance e saia do grupo antes de todo mundo. Consórcio sem
  entrada obrigatória, com +20 anos de experiência da Adriana Araújo (Km
  Zero Corretora, em parceria com a Carro e Cia)."
- Título: "Consórcio de carro sem juros — simule agora". Descrição:
  "Resposta em menos de 10 minutos". CTA: "Enviar mensagem".
- Mensagem pré-preenchida: "Olá! Quero simular um consórcio de veículo e
  entender como usar meu carro atual como lance."
- Imagem: logo oficial já enviada pro Canva (asset `MAHSvw7a9Vs`), 4
  modelos de template gerados a partir dela — aguardando a Adriana
  escolher um pra finalizar na conta dela.

**Duas travas encontradas na tentativa de criar direto pela integração:**
1. Nenhuma conta de anúncio real da Carro e Cia tem "Ads MCP" liberado
   pela Meta ainda (nem leitura funciona, só a conta de teste tem acesso)
   — a Meta está liberando aos poucos, sem prazo definido.
2. Mesmo tentando criar assim mesmo (`ads_create_campaign`), um
   classificador de segurança do modo automático bloqueia qualquer ação
   que envolva gasto real, independente da liberação da Meta.
   **Decisão: não configurar uma permissão permanente pra contornar isso**
   — abriria uma porta que ficaria valendo pra sempre, contra a prática de
   sempre pedir autorização antes de gastar. O caminho certo: pedir a
   criação numa conversa em modo interativo normal (não modo automático) —
   aí aparece um prompt de aprovação na hora, a Adriana aprova uma vez, a
   campanha é criada pausada, e ela revisa/publica no Gerenciador de
   Anúncios quando quiser.

## Encaminhamento de consórcio/seguro — corrigido (19/08/2026)

**Achado em autocrítica** (a pedido da Adriana, pra revisar o mapeamento
completo dos fluxos da Clara): `encaminharParaParceiro()`
(`supabase/functions/ai-sdr/index.ts`) só mandava um aviso interno pro
parceiro (Gabriel ou Adriana) — o cliente nunca recebia link nenhum, e a
Clara continuava ativa no mesmo chat depois de dizer "vou te encaminhar",
com risco de tentar responder sobre um assunto que ela não domina.

**Correção:** `encaminharParaParceiro()` agora também manda o cliente uma
mensagem com link `wa.me` pro número certo, e desliga a IA pra esse lead
(`ai_enabled = false`) — mesmo mecanismo já usado em
`solicitar_atendimento_humano`. Aplicado aos dois tipos que passam por
esse encaminhamento: `consorcio` e `seguro_auto`.

**Número novo dedicado a consórcio:** `5534998037651` (WhatsApp Business,
atendido manualmente pela Adriana/equipe Km Zero — sem IA). Substituiu o
celular pessoal da Adriana (`5534984080220`) em todo lugar que apontava
pra consórcio: `PARCEIROS_ENCAMINHAMENTO` (`ai-sdr/index.ts`),
`ConsorcioAuto.tsx` e o card "Falar com Adriana" em `Sobre.tsx` (esse
último cobre também "seguros gerais e financiamentos", não só consórcio —
decisão da Adriana foi padronizar mesmo assim). O celular pessoal dela
continua sendo o destino dos alertas administrativos internos (novo
agendamento, relatório diário, etc.) — isso não mudou.

## Becos sem saída

- Não dá pra rastrear clique de WhatsApp por sessão/cookie — o link
  `wa.me` não carrega nada, a única forma viável é embutir informação no
  próprio texto da mensagem.
- Não confiar que o cliente sempre manda a mensagem pré-preenchida sem
  editar — quem apagar a tag antes de enviar volta a cair em
  `whatsapp_organico` (degradação aceitável, não é regressão do
  comportamento anterior).

## Em aberto

- **Agendado pro futuro (decisão da Adriana, 19/08/2026)**: confirmar
  cadastro dos webhooks de lead no painel do Mercado Livre e da
  Webmotors; NaPista precisa de um cron pra puxar `GET /seller/{id}/leads`
  periodicamente — não existe hoje. Quando isso for resolvido, adicionar
  `mercadolivre`/`webmotors`/`napista` na lista de canais monitorados do
  alerta de silêncio (`daily-report-cron`).
