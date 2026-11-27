# Leads da Clara — diagnóstico e plano para atrair mais leads orgânicos

Criado em 27/11/2026, a pedido da Adriana. Levantamento só de leitura (código, banco e logs) feito em 27/11/2026 ~12:25 UTC.
Nada foi alterado. Marcação: **[V]** verificado (fonte citada) · **[I]** inferido · **[?]** só a Adriana/fonte oficial confirma.

## 1. Por que não entrou lead desde 23/11

- **[V]** O canal está funcionando: `meta_webhook_logs` recebe eventos todo dia, sem erro; `receive-leads` respondeu 200 nas
  8 chamadas das últimas 24 h. Desde 24/11 só chegaram **confirmações de entrega** de mensagens que a Clara mandou e 1 mensagem
  da equipe. **Nenhum cliente escreveu**: última mensagem de cliente em `conversation_history` = 23/11 20:25 UTC.
- **[V]** O filtro de números da equipe (25/11) compara o número inteiro (tolera só o 9º dígito); não bloqueia cliente.
- **[V]** 4 dias sem contato já aconteceu antes (05→10/11, 19→23/11).
- **[V] A queda real é antiga:** leads de **anúncio da Meta que abre o WhatsApp** (`ctwa_clid`) — 57 em 90 dias, **0 em 30 dias,
  último em 24/09/2026**. Antes eram 18 a 36 leads/semana; desde 21/09 são 0 a 7/semana, quase todos orgânicos. Total em 30
  dias: 18 leads.
- **[I]** Causa provável: **não há campanha de clique para WhatsApp rodando desde a troca da conta de anúncio** (15/09, conta
  `4333456556917039`). **[?]** Confirmar no Gerenciador de Anúncios.

## 2. De onde vêm os leads hoje (pontos do código que criam lead)

| Canal | `origem` gravada | Onde | Estado |
|---|---|---|---|
| WhatsApp da Clara (cliente escreve) | `whatsapp_organico`, `site_whatsapp`, `facebook_ads`, `instagram_ads` | `receive-leads` | **ativo** |
| Lead Ads da Meta (formulário) | `meta_lead_ads` | `receive-leads` | ativo, sem uso recente |
| Formulário de contato / consignação do site | `site_formulario`, `site_consignacao` | `Contato.tsx`, `Consignment.tsx` | ativo (1 lead em 30 dias) |
| Cadastro manual / avaliação | `manual`, `avaliacao_avulsa` | painel | ativo |
| Google Ads (formulário) | `google_ads` | `google-ads-leads`, `lead-automation` | sem uso recente [I] |
| Mercado Livre (pergunta/contato) | `mercadolivre` | `ml-webhook` | **QUEBRADO: responde 401 sempre** (52 vezes em 24 h) [V] |
| Webmotors / portais | portais | `wm-process-lead`, `webhook-portais` | portais nunca geraram lead (achado antigo) |
| Simulador de financiamento | — | `FinanciamentoAuto.tsx`, `Veiculo.tsx` | **não vira lead**: grava só em `simulacoes` (3 em 30 dias, 1 em 26/11) [V] |

## 3. O que já leva o cliente até a Clara

| Ativo | Estado |
|---|---|
| Botões de WhatsApp no site (botão fixo, card do veículo, página do veículo, estoque, blog, landing pages, pop-up de saída — 28 arquivos, número padrão da Clara em `src/lib/whatsapp.ts`) | **ativo** [V] |
| Anúncios Meta clique-para-WhatsApp | **sem resultado desde 24/09** [V]; provavelmente sem campanha [I] |
| Esteira de posts (Facebook/Instagram, 2/dia) | ligada, mas **travada na prática**: 7 posts em 45 dias (último 25/11); 21 na fila, 22 pulados, 1 aguardando aprovação desde 10/11, 2 rascunhos parados [V] |
| Post orgânico diário (cron) | **desligado** desde 08/11 [V] |
| Feed do catálogo da Meta (`public-inventory-feed`, CSV) | ativo — o robô do Facebook lê 25 vezes/dia [V] |
| `crm-inventory-feed` | 411 chamadas/24 h de um cliente no Google Cloud + 2 de outro projeto Supabase — **origem não identificada** [V] |
| Sitemap / busca orgânica | ativo [V] |
| Google Merchant Center | **não existe** [V] |
| Retomada, follow-up e reengajamento da Clara | ativos [V] |

## 4. Ferramentas — o que dá e o que não dá (fontes oficiais, consultadas em 27/11/2026)

- **Google Merchant Center — anúncios de veículos: NÃO disponível no Brasil.** Lançado em Austrália, Canadá, Japão e EUA; beta
  em Reino Unido, Alemanha, França, Itália, Espanha e Holanda ([Vehicle ads overview](https://support.google.com/merchants/answer/11189169?hl=en)).
  O Brasil aparece só nos programas comuns de Shopping/listagens gratuitas e no de estoque local
  ([países e moedas](https://support.google.com/merchants/answer/160637?hl=en-GB), [estoque local](https://support.google.com/merchants/answer/14615117?hl=en)).
  **[?]** Se carro pode ir no Shopping comum no Brasil depende da política de produtos do Google — não confirmado; a tendência
  é veículo ser restrito ao programa próprio (inferido).
- **Meta — catálogo de veículos / anúncios de estoque automotivo:** a configuração pelo Business Suite está marcada como
  **só EUA** ([vehicle catalog](https://www.facebook.com/business/help/685696635352394)); a listagem de veículos de parceiros no
  Marketplace foi **encerrada em 2021, inclusive no Brasil** ([aviso](https://en-gb.facebook.com/business/help/442276120199473)).
  **[?]** Não achei lista oficial atual confirmando anúncios de estoque automotivo para revendas no Brasil. O que **funciona no
  Brasil** é o anúncio comum de clique para WhatsApp e o anúncio de catálogo genérico (o feed `public-inventory-feed` já existe).
- **Anúncio clique-para-WhatsApp** (o que trazia 18–36 leads/semana até setembro): disponível e já integrado — o `ctwa_clid`
  identifica a campanha no lead.

## 5. Plano sugerido (ordem por impacto ÷ esforço) — interpretação minha

1. **Religar anúncios clique-para-WhatsApp** (maior impacto; o histórico mostra o efeito). Ação da Adriana no Gerenciador
   (conta `4333456556917039`) ou via `ads-agent` com autorizo; orçamento é decisão dela.
2. **Destravar a esteira de posts** (já existe, custo zero): limpar o que está parado na aprovação desde 10/11, entender os 22
   "pulados" e fazer os 2 posts/dia saírem de fato, cada um com CTA para o WhatsApp da Clara.
3. **Consertar o `ml-webhook` (401)**: pergunta do Mercado Livre virar lead da Clara.
4. **Simulador vira lead**: quem simula financiamento deixa nome/telefone → lead `site_simulador` e a Clara chama.
5. **"Anúncio automático do dia"** (o pedido dela): todo dia 1–2 veículos, criativo padrão já existente + legenda com link
   `wa.me` da Clara (mensagem pré-pronta com o modelo, para a Clara saber o interesse) → Facebook/Instagram pela esteira; no site,
   faixa "Destaque do dia" na home. Google: ver item 6.
6. **Google sem Merchant de veículos:** Perfil da Empresa no Google (posts e produtos, gratuito) **[?] disponibilidade de
   "produtos" para revenda a confirmar**; páginas por modelo no site (SEO) com botão da Clara; Google Ads de pesquisa/Performance
   Max para WhatsApp (pago).
7. **Medir:** link `wa.me` com texto diferente por origem (site, Instagram, post do dia) para a Clara gravar a origem certa
   — hoje boa parte cai como `whatsapp_organico`.

## 6. Para confirmar com a Adriana / fonte oficial

1. Há campanha clique-para-WhatsApp ativa na conta `4333456556917039` desde 15/09? Qual orçamento ela aceita?
2. A esteira está esperando aprovação dela (post em aprovação desde 10/11)? Quer aprovação manual ou automática?
3. Quem consome o `crm-inventory-feed` (411 chamadas/dia de um servidor no Google Cloud e de outro projeto Supabase)?
4. Política do Google para veículos no Shopping comum no Brasil (Central de Ajuda do Merchant Center ou suporte Google).
5. Anúncios de estoque automotivo da Meta para revendas no Brasil (suporte Meta ou parceiro Webmotors).
