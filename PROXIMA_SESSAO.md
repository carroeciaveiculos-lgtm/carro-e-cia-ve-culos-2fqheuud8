# Próxima sessão — Carro e Cia Veículos

Atualizado em: 29/10/2026 (sessão 36, iniciada em 28/10)
Substitui: 27/10/2026 (sessão 35)

## REGRA INEGOCIÁVEL (Adriana, 29/10/2026)
Em TODO pedido, começar com a CONFERÊNCIA INICIAL: ler o estado atual (`git fetch`, consulta
ao banco), rotular "verificado" ou "inferido" e listar os argumentos contra a própria
resposta ANTES de responder ou agir, sem esperar ela perguntar. Está no `CLAUDE.md`
(Autorização e segurança). Mudar algo continua exigindo ANTES → DEPOIS e "autorizo".

## ONDE ESTAMOS (verificado em 29/10/2026 com `git fetch` + `git log`)
- **Branch de trabalho:** `fix/numero-interno-nao-vira-lead`, enviada ao `origin`, 3 commits à
  frente da `main`, SEM PR e SEM merge: `0586d9f` (número interno não vira lead nem recebe
  reengajamento: `receive-leads` + `re-engagement-cron`), `805935e` (`ai-sdr`: sem agendamento
  duplicado no mesmo horário), `672d339` (`CLAUDE.md`: conferência inicial + rito de alteração).
- **`origin/main`:** `3a1e88e` (só documentação). Último código em produção segue `e5e44c0`:
  NADA desta sessão está no ar (o deploy de functions só roda em push na `main`).
- **Conferir o hash:** `git log --oneline -1` pode mostrar um commit de documentação acima de
  `672d339` (a atualização destes arquivos, se foi commitada). É esperado.
- **Merge:** pedido à parte. Ao mesclar entram em produção `ai-sdr`, `receive-leads` e
  `re-engagement-cron`; conferir `gh run view` depois.

## BANCO ALTERADO NESTA SESSÃO (29/10/2026 07:59 BR, com backup e releitura)
- Agendamento duplicado `33d92496-2ca8-4df2-9938-339ffe9d45e6` (lead 829c0150, avaliação 30/10
  16:30 BR) virou `cancelado` com observação; mantido `276e261c-63f3-4577-976b-d72c56d0d5e6`.
- Rollback: `update public.agendamentos_visita set status='agendado', observacoes=null,
  updated_at='2026-10-27 19:35:18.584274+00' where id='33d92496-2ca8-4df2-9938-339ffe9d45e6'
  and status='cancelado';`

## VERIFICAR PRIMEIRO (todas por leitura, com data)
1. **Webmotors / fatura (28/10):** ela disse que o bloqueio era fatura não paga. Em 29/10 11:40
   UTC ainda havia 401 (36 nas últimas 12h). Depois do pagamento: conferir se os 401 param em
   `net._http_response`, se a fila de `estoque_publicacoes` (webmotors) drena (29/10:
   pending_create 7, pending_update 6, pending_close 11, error 25) e se Strada (GHU2B54) e
   Hilux (QQL9J09) ganham `post_id`. Não mexer em secrets antes de perguntar da fatura.
2. **Lembrete único (30/10 ~14:15 BR):** `lembrete-agendamento-cron` deve mandar 1 template ao
   lead 829c0150 (agendamento `276e261c`). Conferir `lembrete_enviado_em` e que saiu só 1.
3. **Teste da janela de 24h (INFERIDA, não provada):** o relatório diário (`daily-report-cron`,
   texto livre, 08:00 BR) só deve chegar se ela escreveu para a Clara nas últimas 24h.
   Perguntar se o de 29/10 chegou; se o de 30/10 chegar sem ela ter escrito, a teoria cai.
4. **Seis itens da sessão 35, ainda NÃO confirmados:** (a) interruptor 0 km e mês de
   referência no painel publicado; (b) avisos de WhatsApp da FIPE chegaram?; (c)
   `fipe-atualizar-estoque` com 0 km real; (d) cron das 07h grava linha em
   `fipe_estoque_execucoes`; (e) conectores Meta logados?; (f) LinkedIn API aprovada?

## PENDENTE: AVISOS NO WHATSAPP DELA (pedido 29/10; só desenho, nada criado)
Eventos: lead novo, agendamento, pedido de humano, lead quente; cada aviso com origem, data e
hora (Brasília), nome, telefone e resumo do interesse. Desenho v2: gatilhos só gravam em
`alertas_admin_fila`; cron a cada 2 min aciona a function `notificar-admin-whatsapp`
(`x-internal-secret` lido do Vault, nunca escrito em migration); envio por template Meta
`aviso_equipe_lead` (UTILITY) com texto livre de reserva; lead novo espera ~3 min; lead que
já nasce `quente` vira 1 aviso; dedupe de 30 min; teto de 10 avisos por rodada; ignora
`origem='manual'` e números internos. Passos, cada um com "autorizo" separado: (1) submeter o
template (listar negócios com `whatsapp_biz_businesses` e ela escolher); (2) migration
(tabela com RLS, 3 gatilhos, cron) com `DROP` de volta; (3) function + `config.toml`
(`verify_jwt=false`) + `docs/edge-functions-rules.md`; (4) só depois de confirmar os novos
avisos, remover os antigos (`ai-sdr`: agendamento enviado 2× ao mesmo número e atendimento
humano; `receive-leads`: Meta Lead Ads).

## O QUE O DIAGNÓSTICO DAS MENSAGENS ESTRANHAS MOSTROU (28–29/10)
- Menu "Comando não reconhecido": respondeu a 3 textos dela em 27/10 (verificado em
  `agente_interacoes`). O roteador compara palavra exata (`LISTAR`, `ANUNCIOS` sem acento);
  "Anúncios" e "listar campanhas" não batem. "listar campanhas" nem consta na tabela (causa
  não descoberta). Melhoria sugerida, não feita: normalizar acento e aceitar o 1º termo.
- 4 avisos de agendamento = 2 linhas duplicadas × 2 envios ao mesmo número (verificado).
- Lead com o número dela (`c3851748`, criado 19/10 por mensagem tipo `system`) recebeu o
  template de reengajamento em 27/10 07:00 BR. Corrigido na branch, ainda não em produção. A
  IA desse lead segue ligada (desligar = alteração de dado, pedir).
- Logs das Edge Functions não saem pelo `query_logs` (tabelas `function_logs`/`edge_logs`/
  `function_edge_logs` não existem; `logs` é do Postgres). Usar o painel do Supabase.

## PENDÊNCIAS ABERTAS (todas abertas em 28–29/10/2026)
- **Defeitos conhecidos, sem correção:** remarcar deixa a linha antiga `agendado` (dupla
  reserva); lead duplicado 1093; `sendWhatsApp` do `ai-sdr` ignora a resposta da Meta; o
  `daily-report-cron` não confere `res.ok` (pelo grep).
- **Fotos/publicação:** gatilhos do NaPista e da Webmotors não observam `fotos` (o do ML
  observa); WM só reenvia fotos se o anúncio tem 0; Strada ML `gold_pro` (MLB1744) dá erro;
  Strada NaPista sem mapeamento de catálogo; Compass ML sem fotos (rascunho); Hilux ML não
  ressincronizou após a edição de 28/10 00:05 (sem explicação). Corrigir exige migration.
- **CRM:** lead 0151 em sofrimento (revisão humana e desligar IA); Paolo mal classificado;
  facebook_ads sem lead desde 24/09 e instagram_ads desde 17/09.
- **Higiene:** template Meta `teste_claude_apagar` aprovado (só apagar a pedido);
  `x-internal-secret` escrito nos comandos dos crons (observação de segurança, fora de
  escopo); hook PreToolUse contra commit/push/merge na `main` (proposto, deixado PENDENTE por
  ela em 28/10); 2 junctions quebradas em `.claude\skills`; 4 anotações "NÃO COMMITADO" no
  `MEMORY_WORK.MD`.

## DECISÕES RECENTES (não reverter sem pedir)
- **29/10** — Conferência inicial em todo pedido é inegociável.
- **29/10** — Duplicata de agendamento: cancelar, não apagar. Push só da branch, nunca da `main`.
- **28/10** — `AGENTS.md` consolidado no `CLAUDE.md`. **27/10** — `AUDIT_REPORT.md` restaurado.

## REGRAS DO PROJETO
- Seguir `CLAUDE.md`. Nada de `git push --force`. Detalhe técnico vai para `docs/`.
