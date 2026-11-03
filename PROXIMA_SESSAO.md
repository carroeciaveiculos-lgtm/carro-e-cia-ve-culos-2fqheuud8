# Próxima sessão — Carro e Cia Veículos

Atualizado em: 02/11/2026 (sessão 39, continuação da 38)
Substitui: 01/11/2026 (sessão 38, fim do dia)

## SESSÃO 39 (02/11/2026) — PR #1 (Clara) pronto para mesclar; contas conferidas

Estado verificado em 02/11 (gh, git ls-remote). **`origin/main` = `141a060`** (último merge, só docs; `5af1382` é o último de código).

- **PR #1 (Clara) PRONTO, FALTA SÓ O MERGE DELA.** Branch `fix/numero-interno-nao-vira-lead` enviada ao GitHub em 02/11 (`1d18c23..a982374`,
  push normal, sem force; ela rodou `! git push origin fix/numero-interno-nao-vira-lead` e concluiu o login). Verificado: `OPEN`,
  `MERGEABLE`, `CLEAN`, check "Workers Builds" = SUCCESS. Altera 5 arquivos (`AGENTS.md`, `CLAUDE.md`, `ai-sdr`, `re-engagement-cron`,
  `receive-leads`; 47 linhas); a memória ficou idêntica à da main.
  **Próximo passo:** ela roda `! gh pr merge 1 --merge` (o `gh pr merge` anterior falhou porque o GitHub ainda tinha a versão antiga com
  conflito). O merge dispara o deploy de 3 funções (`ai-sdr`, `re-engagement-cron`, `receive-leads`) pelo `deploy-functions.yml`.
  Depois: eu conferir `list_edge_functions` (versão e hora das 3), `gh run list`, logs e o site (home, `/estoque`, `/admin/login`).
  O código do PR #1 NUNCA foi executado (sem `deno`): acompanhar os primeiros leads/agendamentos da Clara.
  Se o merge ainda não tiver acontecido ao abrir a sessão: conferir `gh pr view 1` antes de qualquer coisa.
- **Contas (verificado por leitura em 02/11):** GitHub = `carroeciaveiculos-lgtm` (única logada no `gh`, escopos repo/read:org/gist; remoto
  `origin` = `carroeciaveiculos-lgtm/carro-e-cia-ve-culos-2fqheuud8`; commits como "Adriana Araújo" `lgacomerciodeveiculos@gmail.com`).
  Cloudflare = conta "Lgacomerciodeveiculos@gmail.com's Account" (`96c599909cb2c55408eceedc08a01aca`), acesso por token de conta na variável
  `CLOUDFLARE_API_TOKEN` (permissões do token NÃO verificadas); Worker `carro-e-cia-ve-culos-2fqheuud8`. O Claude Code está logado com outro
  e-mail (`nutriadrianaaraujo22@gmail.com`), que não é nenhuma dessas contas.
- **Aviso de assinatura (02/11):** o Claude Code mostrou "não consegue usar sua assinatura, pagamento em atraso"; ela rodou `/login` e deu
  sucesso. Se voltar: claude.ai/settings/billing.
- **Dúvida dela SEM resposta:** "corrigiu a imagem da logo no modelo?" no teste do Compass. O banco mostra 0 criativos salvos e nenhum post
  novo (o teste não gravou nada). Pedir a captura ou a descrição do que ela viu.
- **Notas de 28 e 29/10 PERDIDAS** ao ficar com a memória da main no PR #1 (defeitos conhecidos da Clara: remarcar deixa a linha antiga
  `agendado`/dupla reserva; lead duplicado 1093; `sendWhatsApp` do `ai-sdr` ignora a resposta da Meta; `daily-report-cron` não confere `res.ok`;
  pendências de fotos NaPista/WM; lead 0151; Paolo; facebook_ads/instagram_ads sem lead). Decisão dela pendente: reinserir via PR de documentação?
- **Conectores desta sessão:** os do claude.ai (Cloudflare Developer Platform, Supabase, Vercel, Windsor) desconectaram; `supabase`, `cloudflare`
  e `meta-ads` seguem. `brevo` (401) e `n8n` (404) falham ao conectar.
- **Becos sem saída novos:** (1) `gh pr merge` antes do push da versão corrigida não adianta (o PR continua `CONFLICTING`). (2) Dois `git push`
  seguidos travaram no `git-credential-manager`; funcionou quando ela rodou com `!` e concluiu a janela.

## SESSÃO 38 (01/11/2026, tarde/noite) — criativo no ar (Stories 9:16, modelo único, foto sem corte), CSP, auditoria Meta

Estado verificado em 01/11 ~22h BRT (git, gh, MCP Supabase, MCP Meta, site publicado). **`origin/main` = `5af1382`** (merge do PR #10).
Todos os PRs abaixo foram mesclados e o `Deploy producao` de cada um terminou com sucesso; site conferido (home, `/estoque`,
`/admin/login` = 200) e o chunk `Estoque-*.js` publicado contém o código novo.

- **PR #7** (`f651f0e`, 21:13 UTC): 3 estilos de IA, `size` validado, logo branca/vermelha transparente (`public/logo-carro-e-cia-branco-vermelho.png`).
  Função `gerar-criativo-anuncio` **v11** (21:14 UTC). O 400 que ela viu antes foi front local x função antiga em produção (INFERIDO; corpo
  da resposta não lido).
- **PR #8** (`8f3a349`): regra no CLAUDE.md "lembrar de commit e push a cada alteração, em toda resposta".
- **PR #5** (`cba7158`, 22:00 UTC): CSP libera Google Ads/Clarity/GA4. Decisão dela: "mesclar assim". **Pendente (LGPD):** GTM, GA4
  (`G-BMYR1WXTT2`) e Pixel da Meta carregam no `index.html` SEM consentimento; o `CookieConsent` só cobre o Clarity. Com o CSP liberado o
  Google Ads/GA4 passam a coletar sem consentimento. Ligar o consentimento às tags NÃO foi feito.
- **PR #9** (`289a9db`, 23:55 UTC; mesclado por ela com `! gh pr merge`): **Stories 9:16** (1080x1920, área segura 250 px topo / 340 px base,
  regra prática a conferir na prévia real do Instagram; IA em `1536x1008`) e **modelo único "Padrão Carro e Cia"** (os 2 antigos saíram do painel;
  `criativo-anuncio.ts` de 343 para 94 linhas). Modelo antigo confirmado ausente no JS publicado.
- **PR #10** (`5af1382`, 00:57 UTC de 02/11): **foto sem corte.** No 1:1 a janela é 2,06:1 e as fotos de celular são 4:3 (4000x3000): o `cover`
  cortava 35% da altura. `fotoCover` virou `fotoInteira` (foto inteira + sobras desfocadas; foto da IA, já na proporção da janela, não muda).
  Testado com as 3 fotos reais do Pajero (1:1 e 4:5).
- **NÃO testado:** painel logado (gerar, "Salvar e copiar link", "Criar post orgânico"); 9:16 com fotos reais; Safari antigo (sem `ctx.filter`,
  as sobras ficam pretas).
- **PRIMEIRO PASSO DA PRÓXIMA SESSÃO — teste no Jeep Compass** (`13ee117d-e038-4fc3-beec-c1a0e2cc51c0`, ela escolheu): ela clica no site publicado
  (Ctrl+F5): 1:1/4:5/9:16 sem IA, Salvar e copiar link, Criar post orgânico (fica Rascunho; NÃO aprovar). Eu confiro `veiculo_criativos` e
  `social_posts` e apagamos o que for do teste só com "autorizo". Antes do teste: 0 criativos salvos; o único rascunho do Compass é o post
  automático `post_organico_diario` (cron), não é do teste.
- ~~**PR #1 (Clara) segue ABERTO**, único PR aberto. Branch local `fix/numero-interno-nao-vira-lead` tem 2 commits NÃO enviados: merge da main
  (`f98bba4`, conflitos só nos arquivos de memória) e um commit de memória (`e9428f6`) que ficou VENCIDO por este arquivo. Ao retomar: trazer a
  main de novo, ficar com a memória da main, revisar e pedir o push. Código revisado e coerente (`ai-sdr` agendamento idempotente;
  `re-engagement-cron` e `receive-leads` não tratam número interno como lead); sem teste de execução (sem `deno`).~~
  **Superado em 02/11 (sessão 39):** a branch foi enviada (`a982374`) e o PR está CLEAN; falta só o merge dela.
- **Auditoria Meta (só leitura), conta `4333456556917039`:** 2 campanhas, gasto R$ 0 em toda a vida. "Consórcio Auto" ATIVA mas SEM nenhum
  anúncio (objetivo Tráfego x meta Conversas, destino indefinido, público aberto); "Consórcios Carro e Cia" PAUSADA pelo `carroecia_bot` em
  31/10 13:36 (parece o teste ao vivo da Clara, INFERIDO). Pixel, página/IG e saldo NÃO checados. Decisão dela pendente (recriar com objetivo
  Mensagens, WhatsApp `5534998037651`, público restrito = pedido separado; gasto real = pedido separado).
- **Pendências sem destino:** stash de 28/09 "fix sync video" (4 arquivos, não revisado); worktree `agents/token-architecture-analysis-and-fixes`
  (≥10 arquivos preparados, branch nunca enviada); artigo da Central de Ajuda do gerador (inserção em banco = pedido separado); limpeza dos slugs e
  regras de IA dos 2 modelos antigos (função + `ai_prompts_config`, pedido separado); selo "Cautelar Aprovada"; potência (cv); 16:9.
- **Becos sem saída novos:** (1) o MCP não sobe arquivo binário no Storage do Supabase (usado `public/`). (2) `query_logs` com
  `source='function_edge_logs'` FUNCIONA (método/status/URL, sem corpo), contrariando a nota de 29/10. (3) `git switch -c ... origin/main` deixa o
  upstream em `origin/main`: empurrar com o nome explícito. (4) `git push` travou várias vezes no `git-credential-manager` (login do GitHub no
  Windows); resolve-se rodando o push com `!` ou concluindo a janela, nunca trocar credencial/remoto; matar os processos git travados antes de
  tentar de novo. (5) O classificador do Claude Code barra `gh pr merge` feito por mim às vezes ("Merge Without Review"); alternativa:
  ela roda `! gh pr merge N --merge`. (6) Script do PowerShell: `[math]::Min(1, 0.65)` arredonda para inteiro e dá 100%; usar Python para conta.
  (7) Heredoc de Bash com aspas misturadas quebra: usar script `.py` em arquivo.
- **Sujeira de ambiente (não verificado se ainda existe):** 4 processos do Vite de sessão anterior (portas 5173 e 5199) ficaram rodando.

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
- ~~**Incidente ABERTO — Jeep Compass**~~ **FECHADO em 01/11/2026 (noite):** ela republicou o veículo; conferido no banco, `status` = `disponivel`
  (preço R$ 109.897,00, 20 fotos). Em 01/11 11:48:22 BRT ele tinha passado de `disponivel` para `rascunho` durante o teste do gerador antigo.
  **Causa NUNCA provada** (clique da ferramenta ou ação dela). Verificado que o gerador não escreve na tabela `veiculos`: a função
  `gerar-criativo-anuncio` só grava `logs_ia` e o painel não faz `update` em `veiculos`. O teste gastou 2 chamadas da OpenAI.
- ~~**Próximos passos:** Pedido B; aprovação visual; selo; Stories; PR #5 e PR #1~~ — SUPERADO pela sessão 38 acima (PR #5 mesclado, Stories feito,
  PR #1 ainda aberto, selo ainda desligado).

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
- **PR #4** (legenda por IA): ~~merge autorizado~~ → FECHADO em 01/11/2026: mesclado às 14:13 UTC (`d764a17`), `Deploy producao` e
  `Deploy Edge Functions` com sucesso; só `gerar-conteudo-social` (v103) e `montar-post-veiculo` (v15) ganharam versão nova.
  A correção NÃO foi testada em uso real — pedir para ela ver uma legenda gerada.
- **CSP bloqueando rastreamento** (bloqueio VERIFICADO no console e no cabeçalho publicado; impacto INFERIDO): vem de
  `public/_headers` (idêntico ao publicado em 01/11); CSP existe desde `fbe7f26` (06/07). Bloqueia Google Ads
  (`AW-18085065720`, `AW-869570436`), GA4 (`analytics.google.com`), Clarity, Cloudflare Insights e gateway de conversões da Meta.
  Correção proposta no PR `fix/csp-liberar-rastreamento`: libera `googleads.g.doubleclick.net`, `www.clarity.ms`, `www.google.com`,
  `analytics.google.com` e `*.clarity.ms`. **Fica de fora, por decisão dela:** gateway da Meta (`*.on.aws`, `conversionsapigateway.com`)
  — pode duplicar o `meta-capi-postback`. Pendente antes de mesclar: testar a pré-visualização do Cloudflare e ler o `CookieConsent`
  (LGPD: confirmar que o consentimento segura as tags). Cloudflare Insights e iframe do Facebook também ficaram fora.
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

## ONDE ESTAMOS (verificado pelo git e gh em 01/11/2026, ~22h BRT)

- **Atualização de 02/11 (sessão 39):** `origin/main` = `141a060` (merge do PR #11, só docs). Último código em produção: `5af1382`
  (PR #10). **PR #1 (Clara) aberto, CLEAN, aguardando o merge dela** (ver sessão 39). Branch desta memória: `docs/memoria-sessao-39`.
- ~~**`origin/main`:** `5af1382`~~ — superado por `141a060` (PR #11 de memória da sessão 38).
- **PRs abertos:** só o **#1** (Clara, ver sessão 39). Mesclados em 01/11: #4, #5, #6, #7, #8, #9, #10, #11.
- **Funções:** `gerar-criativo-anuncio` v11 (21:14 UTC); nenhum PR após o #7 mexeu em `supabase/functions/**`.
- ~~Anterior (08:50 de 01/11): `origin/main` = `d764a17`, PR do CSP aberto~~ — superado.
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