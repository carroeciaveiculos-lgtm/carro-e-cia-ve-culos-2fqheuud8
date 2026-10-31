# Próxima sessão — Carro e Cia Veículos

Atualizado em: 31/10/2026 (sessão 36)
Substitui: 27/10/2026 (sessão 35)

## SESSÃO 36 (31/10/2026) — Clara: frases + confirmação SIM/NÃO (PR #2 ABERTO, NÃO MESCLADO)

Estado verificado em 31/10/2026 (git/gh):
- `origin/main` = `3a1e88e` (sem o código novo). Branch `feat/clara-confirmacao-comandos` empurrada, PR #2 aberto;
  contém `d657e23` (remove fallback do número alheio dos avisos) e `b849aa2` (confirmação SIM/NÃO). O merge foi barrado
  pelo classificador de segurança ("merge sem revisão"); **precisa ser feito pela Adriana** (GitHub ou `! gh pr merge 2 --merge`).
- Migração `20261031131357_comandos_pendentes_whatsapp` JÁ APLICADA no banco (tabela vazia, RLS ligada, sem policy) —
  arquivo local no PR. Rollback: `drop table public.comandos_pendentes_whatsapp;`.
- Validado antes do PR: `tsc` (stub do Deno) ok, 75 casos das regras de frase ok, `bun run lint` 0 erros, `bun run build` ok.
- Merge em `main` publica as 87 pastas de function (mexe em `_shared/`); deploy geral igual rodou com sucesso em 10/10.

Pendente / com a Adriana:
- [ ] Mesclar o PR #2 e conferir `gh run list` (deploy-functions) + `list_edge_functions` (versão nova de `receive-leads`).
- [ ] **Teste ao vivo (D)**: LISTAR; "Clara pausar [alvo]" → "não" (nada muda) → de novo → "sim" (confirmação real);
  alvo seguro: campanha do Google (só registra solicitação) ou campanha Meta sem anúncio ativo, a combinar.
  Conferir depois em `comandos_pendentes_whatsapp` e `agente_interacoes`.
- [ ] Artigo da Central de Ajuda (`ajuda_conteudos`) sobre os comandos da Clara — inserção de dado = pedido separado.
- [ ] Mensagem "anúncios ativos no Meta" (de +55 34 9738-4177 para a Adriana) NÃO foi enviada (aguardava "enviar").
- [ ] Em pausa: filtro "equipe não vira lead" (5 pessoas/6 números), avisos proativos por template, 401 do `ml-webhook`, FIPE 1/3/4.
- Observação: o aviso do CLAUDE.md sobre `populate-cache-test` está defasado (a pasta não existe mais); em produção
  `send-lead-email`, `sync-drive-videos` e `sync-google-drive` estão `verify_jwt:false` apesar de sem entrada no `config.toml`.

## AO ABRIR O CLAUDE CODE — VERIFICAÇÕES OBRIGATÓRIAS

Estas 6 pendências estavam abertas em 09/10 e NÃO foram confirmadas depois.
Verificar cada uma antes de assumir que estão resolvidas.
Marcar como RESOLVIDO, PENDENTE ou BLOQUEADO.

- [ ] **1. Interruptor 0 km e "mês de referência" testados no PAINEL PUBLICADO**
  (o teste em localhost foi feito; o teste em produção ficou pendente)
  Como verificar: cadastrar um veículo de teste no admin publicado,
  conferir se o interruptor aparece, se o mês é gravado e o que
  /tabela-fipe mostra depois.

- [ ] **2. Os 2 avisos de WhatsApp da FIPE chegaram no celular da Adriana**
  Como verificar: perguntar a ela diretamente; não há como confirmar
  por código.

- [ ] **3. A function fipe-atualizar-estoque foi rodada com um 0 km REAL**
  (só a regra foi testada em script isolado; a function real nunca rodou
  com um 0 km. Rodá-la envia WhatsApp de verdade para a Adriana.)
  Como verificar: marcar um veículo de teste como is_zero_km=true e
  disparar a function. Confirmar o valor 32000 aplicado e o aviso enviado.

- [ ] **4. O cron das 07h grava linha em fipe_estoque_execucoes quando não há novidade**
  (disparou em 09/10 mas nenhuma linha nova apareceu na tabela)
  Como verificar: ler o código da function e verificar se o caminho
  sem_novidade faz INSERT. Se não faz, decidir se deve fazer
  (registrar que rodou sem novidade é útil para auditoria).

- [ ] **5. Conectores Meta (meta_social_technologies e whatsapp_business_tools) — todos logados?**
  (funcionam, mas a Adriana ainda não tinha logado em tudo)
  Como verificar: perguntar a ela; se algum não estiver logado, orientar
  a logar pelo painel.

- [ ] **6. Pedido da Community Management API do LinkedIn (w_organization_social) — aprovado?**
  (pedido feito em 21/08/2026; lembrete era para checar em 26/08/2026)
  Como verificar: perguntar a ela o status no LinkedIn Developers.
  Se aprovado: trocar escopo no linkedin-oauth-start/callback e no
  publicar-social (detalhe em docs/linkedin-integracao.md).

## ONDE ESTAMOS (verificado pelo git log em 28/10/2026)

- **Último commit:** `e327c1f` — "docs: consolida regras de leitura e memoria (sessao 35)"
  (só documentação; último código em produção segue `e5e44c0`)
- **Último commit de código de produção:** `e5e44c0` — "feat: function google-ads-leads
  recebe leads do formulario do anuncio do Google Ads"
- **Estado do working tree:** LIMPO (`git status --short` vazio em 27/10)
- Tudo commitado e enviado ao `origin/main`

## O QUE ESTÁ NO AR (confirmado por commits)

- FIPE 0 km (linha 32000) e mês de referência no cadastro — commit `127ab2a`
- FIPE do estoque fase 2 — commit `fb19a48`
- FIPE Fase 3: gráfico do histórico junta guardado + automação — commit `0659147`
- ML não cria mais anúncio duplicado e avisa quando preço diverge — commit `7495c07`
- Contador Diamante (12/15) e filtro de publicação dos portais pelo estado real — commit `c143fc4`
- Pajero sem vaga na Webmotors (documentado) — commit `09502ec`
- Function google-ads-leads recebendo leads do formulário — commit `e5e44c0`
- /tabela-fipe no site publicado mostrando "0 km Flex" e R$ 91.910,00 (Argo) —
  confirmado em 09/10

## DECISÕES RECENTES (não reverter sem pedir)

- **27/10** — `AUDIT_REPORT.md` restaurado (a exclusão de `46e6798` foi acidental).
  Tratar como "histórico antigo, não atualizado" (conforme CLAUDE.md do projeto).
- **27/10** — `.codex/` adicionado ao `.gitignore` (config local de ferramenta,
  sem segredo, não deve ser versionado).
- **27/10** — `CLAUDE.md` geral ajustado: nomes de memória flexíveis,
  hierarquia geral vs. projeto definida, ciclo de vida de anotação.
- **28/10** — `AGENTS.md` consolidado no `CLAUDE.md`. Regras por assunto agora vivem
  no `CLAUDE.md`; o `AGENTS.md` virou stub de redirecionamento.
- **10/10** — Diamante: critério 12/15, filtro dos portais pelo estado real.

## PENDÊNCIAS DE MEMÓRIA (não urgentes)

- `MEMORY_WORK.MD` tem 357 KB e o bloco "O que está no ar hoje" está na
  linha 3451 de 4443 (78% do caminho). Precisa reorganizar.
- A codificação parece estar quebrada na leitura (UTF-8 lido como Latin-1:
  "estÃ¡" em vez de "está"). Busca por palavras acentuadas falha.
  Verificar antes de reorganizar: o problema é do arquivo ou do terminal?
- ~~`AGENTS.md` comparado com `CLAUDE.md`~~ — **RESOLVIDO em 28/10/2026**:
  consolidado no `CLAUDE.md` (seção "Regras do projeto por assunto") e o
  `AGENTS.md` virou stub de redirecionamento.
- `.claude/skills` tem 2 junctions quebradas (supabase e
  supabase-postgres-best-practices) apontando para `.agents/skills` que
  não existe mais. Não afeta produção, mas polui comandos recursivos.

## REGRAS DO PROJETO

- Seguir `CLAUDE.md`.
- Nada de `git push --force`.
- Não commitar direto em `main` sem preview quando afetar o site.
- Detalhe técnico vai para `docs/`.