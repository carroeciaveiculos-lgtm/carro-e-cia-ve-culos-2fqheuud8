# Memória de trabalho — Carro e Cia

Este arquivo existe pra responder uma pergunta: **"onde paramos?"** — sem
precisar reler o histórico inteiro de conversas. Diferente do
`AUDIT_REPORT.md` (mantido como está, não é mais atualizado), este arquivo é
pra ser mantido em dia de verdade. Detalhe técnico por integração continua
nos arquivos `docs/*.md` — aqui é só o resumo de estado + pendências.

Última atualização: 2026-08-14.

## O que está no ar hoje

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
  no ar, formato correto pro catálogo de veículos da Meta. **Configuração no
  Commerce Manager (lado Meta) não confirmada como concluída** — ver
  pendências.
- **Meta Ads MCP**: conector conectado via token (não OAuth — ver
  `docs/meta-ads-mcp.md`). Não validado ainda que as ferramentas aparecem
  numa conversa nova.

## Pendências abertas

1. **NaPista** — e-mail de solicitação de `client_id` enviado, resposta já
   recebida (14/08/2026). Ainda não lida/processada nesta sessão. Próximo
   passo: revisar a resposta e continuar o desenho da integração
   (`napista-auth`, seguindo o padrão de `ml-auth`).
2. **Meta Ads MCP** — confirmar, na primeira conversa nova, que as
   ferramentas `mcp__meta-ads__*` carregaram. Se não, ver
   `docs/meta-ads-mcp.md`.
3. **Catálogo Facebook** — confirmar com a Adriana se ela terminou de
   cadastrar o feed agendado no Commerce Manager (ficou em andamento,
   sem confirmação final de que o catálogo foi criado e conectado).
4. **`criar_lead_crm` sem enum de `tipo` amplo** — hoje só aceita
   `comprador`/`vendedor` (default `comprador`); os valores legados
   `compra`/`interesse` que existem na tabela `leads.tipo` não são gerados
   por essa ferramenta, só por caminhos antigos. Não é bug, só inconsistência
   de dado histórico — avaliar se vale unificar algum dia.

## Referências técnicas por assunto

`docs/webmotors-integracao.md` · `docs/mercadolivre-integracao.md` ·
`docs/leads-e-sdr.md` · `docs/meta-ads-mcp.md` · `docs/edge-functions-rules.md`
· `docs/R2_CORS_CONFIGURATION.md`
