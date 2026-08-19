# Origem de leads — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Última atualização: 2026-08-19.

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

## Becos sem saída

- Não dá pra rastrear clique de WhatsApp por sessão/cookie — o link
  `wa.me` não carrega nada, a única forma viável é embutir informação no
  próprio texto da mensagem.
- Não confiar que o cliente sempre manda a mensagem pré-preenchida sem
  editar — quem apagar a tag antes de enviar volta a cair em
  `whatsapp_organico` (degradação aceitável, não é regressão do
  comportamento anterior).

## Em aberto

- `ai_score` nunca é calculado — decidir critério antes de corrigir.
- Confirmar cadastro dos webhooks de lead no painel do Mercado Livre e da
  Webmotors.
- NaPista precisa de um cron pra puxar `GET /seller/{id}/leads`
  periodicamente — não existe hoje.
- Padronizar vocabulário de `origem` (hoje mistura `'LP'`,
  `'Página Contato'`, `'site_whatsapp'`, `'whatsapp_organico'` sem
  convenção única).
- Alerta de canal silencioso (ex: portal sem nenhum lead há X dias) —
  poderia entrar no `daily-report-cron` já existente.
