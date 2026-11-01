# Próxima sessão — Carro e Cia Veículos

Atualizado em: 01/11/2026 (sessão 37)
Substitui: 31/10/2026 (sessão 36)

## SESSÃO 37 (continuação, 01/11/2026) — novo padrão de criativo (Feed) + incidente do Compass

Branch `feat/criativo-padrao-feed` (criada de `origin/main` = `d764a17`), commit e push autorizados em 01/11. Merge e deploy: NÃO pedidos.
- **Feito (verificado):** novo `src/lib/criativo-padrao.ts` (Feed 1080x1350 na linha da arte de referência da pasta
  `Fotos\IMAGENS PARA ANUNCIOS`) e 3º cartão "Padrão Carro e Cia (novo)" em `CriativoAnuncioPanel.tsx`. Os 2 modelos antigos
  (`criativo-anuncio.ts`) ficaram intactos. `bun run lint` 0 erros (92 avisos, nenhum novo), `bun run build` ok.
- **Regras combinadas com a Adriana:** só Feed (Stories depois, se houver uso real); foto ORIGINAL, sem IA; SEM selo até haver registro
  verificável da vistoria; "à vista" é campo editável (começa em "à vista", pode apagar); manter os 2 modelos antigos até ela aprovar.
- **Testado:** o desenho com 3 casos reais do estoque (Chrome, página temporária já apagada). Achou e corrigiu defeito: título muito
  longo era cortado, agora quebra em 2 linhas. **NÃO testado:** o painel real (exige login dela), exportar PNG, "Salvar no sistema",
  "Criar post orgânico".
- **Achado (verificado no console, 01/11):** `imagens.carroeciamotors.com.br` bloqueia por CORS as fotos pedidas de `localhost:5173` e
  `localhost:5199`. `docs/R2_CORS_CONFIGURATION.md` diz que o 5173 está liberado: está desatualizado ou não cobre esse domínio.
  Vale para TODOS os modelos do gerador: no localhost a prévia não monta. Para testar de verdade: prévia do Cloudflare (se o PR gerar:
  NÃO verificado) ou liberar `localhost:5173` no R2 (config externa, pedido separado).
- **Selo "Cautelar Aprovada":** emblema salvo em `Fotos\IMAGENS PARA ANUNCIOS\Emblema Cautelar Aprovada.png` (1254x1254, fundo BRANCO,
  sem transparência: precisa remover o fundo antes de usar no preto). `veiculos.laudo_cautelar` é caixinha manual (`VehicleFormModal`),
  sem documento; 0 dos 65 veículos marcados; o site público já mostra selo quando marcada. Selo continua desligado.
- **Cadastro:** não existe coluna de potência (cv); no novo padrão é texto digitado. Existe `cilindrada`.
- **Fonte:** a Montserrat só estava declarada no tailwind, o app não a carregava; o padrão novo carrega do Google Fonts (CSP já permite).
- **Incidente ABERTO — Jeep Compass `13ee117d-e038-4fc3-beec-c1a0e2cc51c0`:** em 01/11 11:48:22 BRT passou de `disponivel` para
  `rascunho` (sessão logada dela, durante o teste ponta a ponta do gerador antigo); reconferido em 01/11, ainda `rascunho`. Causa NÃO
  provada (clique da ferramenta ou ação dela). Demais campos idênticos. Restaurar só com "autorizo": opção A (Editar Veículo → Validar
  e Salvar, recomendada) ou B (UPDATE direto, pula a validação e dispara gatilhos ML/WM). O teste gastou 2 chamadas da OpenAI.
- **Próximos passos:** Pedido B (abrir PR + checar prévia do Cloudflare); aprovação visual dela; depois merge/deploy (pedidos dela);
  selo (remover fundo do emblema); Stories; PR #5 (CSP) e PR #1 (divergido) seguem como descritos abaixo.

## SESSÃO 37 (01/11/2026) — conferência do estado real (nenhum código novo)

Verificado em 01/11/2026, ~08:50 (git, gh, MCP do Supabase e Chrome):
- `origin/main` = `9a754fa` (merge do PR #3). PR #2 mesclado em 31/10 13:31 UTC; PR #3 mesclado em 31/10 17:20 UTC.
  `Deploy producao` e `Deploy Edge Functions` com sucesso nos dois (runs `41217993787` e `41243510847`).
- Functions: todas ACTIVE; `receive-leads` v244 atualizada ~21:26 UTC de 31/10 (pós PR #3).
- Site publicado: home, `/estoque` (58 links, 0 imagens quebradas) e `/admin/login` renderizam.
  Painel por dentro NÃO testado (sem login).
- **PR #1** (número interno não vira lead; aberto desde 29/10): DIVERGIU da main (6 atrás / 6 à frente) e mexe em
  `receive-leads`, `ai-sdr`, `AGENTS.md`, `CLAUDE.md` e nestes dois arquivos de memória. Conflito provável.
  **Não mesclar sem trazer a main para dentro dele e revisar.** O `AGENTS.md` virou stub em 28/10 e o PR pode reverter isso.
- **PR #4** (legenda por IA): limpo e mesclável; merge autorizado pela Adriana em 01/11. Conferir o resultado com
  `gh pr view 4` e `gh run list`. A correção NÃO foi testada em uso real — pedir para ela ver uma legenda gerada.
- Achado (INFERIDO, não investigado a fundo): o CSP do site publicado bloqueia Google Ads (`AW-18085065720`,
  `AW-869570436`), GA4 (`G-BMYR1WXTT2`), Microsoft Clarity, gateway de conversões da Meta e beacon do Cloudflare.
  Falta descobrir de onde vem o CSP e desde quando. Possível impacto na medição das campanhas.
- Pedido da Adriana sobre "imagem padrão + prompt que ela enviou": NÃO localizado no repositório (só imagem de vaga,
  `a57c72f`, e criativos de anúncio, `1e2ce22`). Pode estar em sessão paralela — perguntar a ela onde foi pedido.

## SESSÃO 36 (31/10/2026) — Clara: frases + confirmação SIM/NÃO (PR #2 MESCLADO em 31/10, verificado em 01/11)

Estado registrado em 31/10/2026 (git/gh) — superado pela sessão 37 acima:
- ~~`origin/main` = `3a1e88e`, PR #2 aberto~~ → FECHADO em 01/11: PR #2 mesclado em 31/10 13:31 UTC, deploys ok.
  Branch `feat/clara-confirmacao-comandos` empurrada; continha `d657e23` (remove fallback do número alheio dos avisos) e
  `b849aa2` (confirmação SIM/NÃO). Na época o merge foi barrado pelo classificador de segurança ("merge sem revisão").
- Migração `20261031131357_comandos_pendentes_whatsapp` JÁ APLICADA no banco (tabela vazia, RLS ligada, sem policy) —
  arquivo local no PR. Rollback: `drop table public.comandos_pendentes_whatsapp;`.
- Validado antes do PR: `tsc` (stub do Deno) ok, 75 casos das regras de frase ok, `bun run lint` 0 erros, `bun run build` ok.
- Merge em `main` publica as 87 pastas de function (mexe em `_shared/`); deploy geral igual rodou com sucesso em 10/10.

Pendente / com a Adriana:
- [x] ~~Mesclar o PR #2 e conferir `gh run list` + `list_edge_functions`~~ — FECHADO em 01/11/2026: mesclado em 31/10,
  deploy ok (run `41217993787`), `receive-leads` v244 no ar.
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

## ONDE ESTAMOS (verificado pelo git em 01/11/2026, ~08:50)

- **`origin/main`:** `9a754fa` — merge do PR #3 (Clara: Google origem válida e cortesia). Último código em produção.
- **Branch de trabalho:** `fix/legenda-ia-sem-preambulo` (PR #4). Working tree limpo antes desta atualização.
- **PRs abertos:** #1 (divergido, ver sessão 37) e #4 (legenda por IA, merge autorizado em 01/11).
- Histórico anterior (28/10): último commit era `e327c1f` (docs) e o último código era `e5e44c0` (google-ads-leads) — superado.

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