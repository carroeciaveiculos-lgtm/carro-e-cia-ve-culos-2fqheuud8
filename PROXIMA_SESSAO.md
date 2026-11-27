# Próxima sessão — Carro e Cia Veículos

Atualizado em: 27/11/2026
Substitui: 25/11/2026

## SESSÃO 26–27/11/2026 — relatório CSV/XML, campo Lugares, limpeza do R2, erro de tradução, PRs #42–#56

Estado verificado em 27/11/2026 ~18:10 UTC: `origin/main` = `d9489a6` (merge do PR #56). Deploys conferidos
(home, `/estoque`, `/admin/login` = 200) a cada merge.

- **Tarde de 27/11 (PRs #51–#56, tudo no ar):**
  - PR #51: `docs/leads-organicos-diagnostico.md` — queda de leads = anúncios clique-para-WhatsApp sem resultado desde
    24/09 (0 `ctwa_clid` em 30 dias); canal da Clara ok; ML webhook 401; simulador não vira lead; Merchant de veículos não
    existe no Brasil. **Decisões dela pendentes:** campanha/orçamento, esteira parada desde 10/11, qual item do plano começar.
  - PR #52–#54: contador de dias em regra única (`src/lib/dias-estoque.ts`); etiquetas "Encalhado"/"Poucas Visualizações"
    retiradas (pedido dela); artigos `20261127152451`.
  - **Gatilho `trg_clear_fotos_on_status_change` REMOVIDO** (migration `20261127174554`): apagava `veiculos.fotos` ao
    vender/devolver (sem migration de origem; 28/30 vendidos e 14/14 devolvidos sem fotos). Mesma migration: `data_venda`
    nunca mais é apagada; nova `data_devolucao`; `entrada_estoque_em` (contagem recomeça do zero ao voltar ao estoque — regra
    dela); histórico em `veiculos_status_historico`. Testado em transação desfeita. Função antiga mantida como backup.
  - PR #55: painel conta a partir de `entrada_estoque_em` ("Vendeu em N dias", "Devolvido em N dias", "—"); `r2-limpeza`
    modo `restaurar_capas` + trava que devolve o status do `ml_listings` ao mexer em fotos de vendido. **9 capas recuperadas**
    da lixeira (nome com "capa"); 33 sem capa identificável. Artigos `20261127180447` (PR #56).
  - Audi PQE7D92: `entrada_estoque_em` gravada em 25/11 12:35 UTC (voltou ao estoque após devolução; inferido pelo ML
    recriado), autorizado por ela; backup 23/06/2026 21:54 UTC. Outros com sinal fraco (só despublicação): GHU2B54, SYI6C55,
    TCQ0B23 — não alterados, ela confirma se voltaram.
  - Lixo antigo do R2: 481 arquivos (1,49 GB) em `lixeira/2026-11-27/` (expira ~27/12). Pastas de veículos: 6,35 → 4,77 GB.

- **No ar (todos mesclados e com deploy verde):**
  - PR #42 (`833f133`): relatório das 8h via template `relatorio_diario_loja` (APROVADO). **Fecha** a nota de 25/11 "só local,
    sem commit/deploy". Envios das 8h **aceitos pela Meta em 26/11 e 27/11** (`marketing_logs` `resumo_leads_pedro` e `daily_report`).
  - PR #43/#46: decisões da busca FIPE (1a nome FIPE na versão, 2b botão opcional, 3a reenvio automático com travas) e
    plano do R2 em `MEMORY_WORK.MD`. Migration `20261126184801` (coluna `veiculos.lugares`).
  - PR #44/#45: Relatório de Estoque → "Exportar completo (CSV/XML)" (cadastro + portais + entrada; proprietário só
    admin_master/gerente; registro em `access_log`). Artigo `20261126180933`.
  - PR #47/#48: campo **Lugares** no cadastro (pré-preenche 7 com "7 Lug./7L"), `wm-mapear-veiculo` filtra 5×7 lugares
    (vazio + modelo com as duas → revisão), etiqueta "7 lugares" no mapeamento. **Limpeza do R2:** fila `r2_limpeza_fila`
    (`20261126200447`), correção dos parênteses nas URLs (`20261126203218`), cron `r2-limpeza-diaria` 03h30 BRT com
    `executar:true` (`20261127000708`), artigos (`20261127000735`). Secret `R2_LIMPEZA_ATIVA=true` criado por ela em 27/11.
    1ª execução real 27/11: OZW5D78 e SYZ4C18, 41 arquivos para `lixeira/2026-11-27/`, capas mantidas (conferido por HTTP).
  - PR #49 (`f923c0f`): `index.html` `lang="pt-BR" translate="no"` + `notranslate` — causa do erro "Algo deu errado"
    (`NotFoundError removeChild`): tradutor do Chrome traduzia a página "do inglês".
  - **PR #50:** envio manual de fotos só reduz (lado maior 1920 px, sem corte; antes 1200×1540 cortado) e modo `orfaos` na
    `r2-limpeza` (lixo antigo opção "a": vendido/devolvido/excluído). **Depois do deploy: rodar ensaio e lotes reais.**
- **Cloudflare:** regra `lixeira-30-dias` (prefixo `lixeira/`, 30 dias) criada via `wrangler` (conta Lgacomerciodeveiculos) em 27/11.
  O conector MCP `cloudflare` está na conta do GuiaLowCarb — **não usar** para a revenda.
- **Hilux SSF5A83:** fotos sumidas na Webmotors (anúncio novo `82664185` de 25/11 sem fotos; resultado do envio não é gravado).
  Corrigido em 27/11 marcando `pending_update` → `wm-sync` reenviou; ela confirmou nas plataformas.
- **Pesquisa ML (27/11):** docs oficiais dão 403 para leitura automática. Trechos oficiais (busca): atributos podem ser alterados em
  item ativo; com vendas, título/condição/modo de compra travam; categoria não muda pela API. Evidência interna: update com versão
  nova em 25/11 deu success. **TRIM específico não confirmado.**
- **Pendências:** ensaio + lotes do modo `orfaos` (após PR #50); aviso de lead novo ainda sem lead real desde 23/11 (último lead
  23/11 20:22 — conferir anúncios); 3a da FIPE (reenvio automático) não implementada; documento de regras de fotos não criado.

## SESSÃO 25/11/2026 — números da equipe, Pedro nos avisos, leads do Roberto descartados

- **SW4 com 7 lugares (25/11, autorizado):** versões trocadas em `wm_mapeamento_veiculos` — PYT5J89 `346612`→`346610`,
  SSF5A83 `346612`→`348557` (backup: ambas `346612`). **Enviado em 25/11 17:50 UTC (autorizo dela): ambos `CodigoRetorno 500`** — SSF5A83 anúncio
  novo `82664185`; PYT5J89 `82427543` editado (a edição aceita troca de versão). **Conferido por ela no painel WM em 25/11/2026.**
  Texto da versão no cadastro corrigido em 25/11/2026 19:41 UTC (autorizo): SSF5A83 e PYT5J89 agora "SRX 4x4 7 Lug. 2.8 TDI 16V
  Dies. Aut." (backup: SSF5A83 sem "7 Lug."; PYT5J89 com espaço duplo). Slug não mudou. O gatilho pôs os 2 no Mercado Livre como
  `pending_update` (MLB7420419026, MLB5138629779) — **conferir na próxima sessão que o ML aceitou**. Detalhe em `docs/webmotors-integracao.md`.
- **Checagem só leitura do estoque (25/11/2026):** 24 veículos disponíveis com versão WM. Problema real: **RUG8F56** (Hilux CD SRX 2022)
  mapeada para `346474` (vale só 2016–2020; mapeada em 10/08, antes da trava de ano); candidata certa `348548` (SRX 2021–2026); anúncio
  `74036318` publicado. **Corrigida em 25/11/2026 com autorizo** (mapeamento → `348548`, backup `346474`; linha
  `af05762d…` → `pending_update`; há 3 linhas WM com o mesmo anúncio, usada a mais recente). **Enviada 19:40 UTC:
  `AlterarCarro` `CodigoRetorno 500`, versão `348548` ecoada, `sync_log` success.** OPZ2408 com versão fora do cache
  (não dá para checar o ano). Tiggo RTP2G79 ok (modelo TIGGO 8).
- **Busca FIPE no cadastro:** ela escolheu (A) em 25/11 — campo "Lugares" no cadastro que guia a escolha da versão WM de 5 ou 7 lugares
  (a FIPE não separa a SW4 SRX 2.8 por lugares: código `002146-6` único). **Plano gravado em `docs/cadastro-busca-fipe.md` (25/11)**;
  3 decisões da busca FIPE em aberto; nada implementado.

Estado em 25/11/2026. `origin/main` = `9ead2e1` no início. **Bloco A NO AR: PR #38 mesclado em 25/11 (`4e4e9d8`)**;
"Deploy producao" e "Deploy Edge Functions" = success; `/`, `/estoque`, `/admin/login` = 200; `receive-leads` publicada tem
`isEquipePhone` e `ai-sdr` publicada tem `WHATSAPP_VENDEDORES_AVISO` (conferido pelo `get_edge_function`). **Não testado:** aviso
chegando de fato no WhatsApp do Pedro (precisa de agendamento real ou teste combinado).

- **Celular da loja (Roberto, `553492893615`) em 23/11 10:56 UTC:** 22 fotos + ficha de uma Evoque → 2 leads em 0,7 s
  (`2df333b9`, `ccc43690`) e 2 respostas da Clara. Causa: número fora da lista interna + "corrida" (busca e cria em paralelo).
  **Descartados em 25/11 com autorizo dela:** status `perdido`, `ai_enabled=false`, nota em `observacoes`. Backup: os dois
  estavam `novo`, `ai_enabled=true`, `observacoes` nulo. Nenhum evento enviado à Meta (sem `ctwa_clid`).
- **Duplicados na base (verificado 25/11):** só 2 telefones em 147 leads (Roberto e um de 07/09, ambos encerrados). Decisão:
  não mexer no banco agora (índice único teria de ignorar encerrados e o 9º dígito); rever se surgir 3º caso.
- **Bloco A (autorizado em 25/11), na branch:** `EQUIPE_PHONES` + `isEquipePhone()` em `_shared/whatsapp-commands.ts`
  (Roberto e Pedro `5534997150409`, sem comandos); `receive-leads` ignora número da equipe; `clara-retomada-cron`,
  `follow-up-2h-cron` e `re-engagement-cron` pulam a equipe; `ai-sdr` manda o aviso de agendamento novo também ao Pedro
  (template aprovado). Testado: regra com 6 números (com e sem o 9) OK; lint 0 erros; build ok; `deno check` com os mesmos 98
  erros antigos antes e depois. **Mexe em `_shared/` → o deploy republica todas as funções.**
- **Artigo da Central de Ajuda:** aplicado em 25/11 depois do deploy, timestamp real `20261125162954` (arquivo renomeado na
  branch `chore/renomeia-migration-artigo-25-11`); passos 3 e 6 conferidos no banco.
- **Bloco B — andamento (25/11/2026 ~20:50 UTC):** decisões dela: conta Meta carroeciaveiculos (templates na conta de
  mensagens CRM_IA `1530053735172401`), resumo focado em leads, aviso só ao Pedro, aviso na hora. Templates `aviso_novo_lead`
  e `resumo_diario_leads` criados e **APROVADOS (UTILITY)**; `teste_claude_apagar` apagado (sem uso no código). Funções
  `aviso-lead-novo` e `resumo-leads-cron` **no ar (PR #41, `fa697bb`)**, verify_jwt=false, ensaio 200 e sem segredo 401;
  números do ensaio batem com contagem direta. Gotcha: 1ª chamada pg_net estourou o timeout padrão de 5 s → usar 30 s.
  **Regra + cron APLICADOS (25/11 ~20:49 UTC, ela liberou a ferramenta):** `trg_aviso_lead_novo` em `leads` e cron
  `resumo-leads-pedro` `0 11 * * *` ativos; arquivo `20261125204906_...` (renomeado ao timestamp real). Artigo da Central
  criado (`5b56d3de…`, migration `20261125205955`). 3º template `relatorio_diario_loja` criado (PENDING) — texto aprovado
  por ela; `daily-report-cron` alterado (template → texto livre se recusado; log com resposta real) ~~só local, sem
  commit/deploy~~ **publicado em `833f133` em 26/11; template APROVADO; envios aceitos em 26 e 27/11**. ML das 2 SW4: `sync_log` success 19:50 UTC (API pública do ML dá 403, não deu para ler direto).
  **Falta:** commit/push/deploy; teste real com o Pedro (lead de teste combinado; conferir `marketing_logs` tipo
  `aviso_lead_novo`); 1º resumo real amanhã 11:00 UTC (conferir `marketing_logs` tipo `resumo_leads_pedro`).
- **Bloco B — respostas dela (25/11):** resumo diário do Pedro **às 8h**; aviso de **todo lead novo**; Luiz Fernando como
  equipe = já está (é o `5534984080000` de `AUTHORIZED_PHONES`, CEO no `brand.ts`) — nada a mudar. **Ainda em aberto:** o
  CONTEÚDO do resumo (o mesmo dela ou focado em leads) — ela respondeu só o horário. Os dois avisos precisam de template novo
  aprovado pela Meta (texto livre só chega na janela de 24 h); criar template = ação externa, pedir autorizo. Achado:
  `daily-report-cron` grava "enviado" sem checar a resposta da Meta — não dá para afirmar que o resumo dela chega.

## SESSÃO 24/11/2026 — exclusão segura, despublicar, 55 no reengajamento, relatório de agendamentos (PR #32 no ar)

Estado verificado em 24/11/2026 ~21:10 UTC. **`origin/main` = `c17b109`** (merge do PR #32).

- **PR #32 MESCLADO em 24/11 (`c17b109`), deploys verdes** (front + `re-engagement-cron`, publicada 21:05 UTC). Conferido no JS publicado:
  "Taxa de comparecimento" (Agendamentos), "Exclusão bloqueada"/"Nenhum dado foi apagado" (Estoque do painel), "Não há código de anúncio
  registrado" (Portais). `/`, `/estoque`, `/admin/login` = 200. **Telas logadas não testadas por mim.**
  - **A1 Excluir veículo:** `getBloqueiosExclusao` + `excluirVeiculo` em `services/veiculos.ts`. Bloqueia se houver anúncio ativo
    (estoque_publicacoes != despublicado e não "error sem post_id"; ml_listings != closed), contrato, consignação, documento, despesa ou
    agendamento. Senão apaga só `veiculos` (cascata/SET NULL do banco). Causa antiga: 9 deletes manuais antes do delete final.
  - **A5 Despublicar WM/NaPista (`Portais.tsx`):** confere ficha com `post_id` ANTES de mudar a flag; sem ficha → aviso e nada muda. Motivo:
    os gatilhos `trigger_*_sync_on_veiculo_change` criam uma 2ª ficha ao mudar a flag e o `maybeSingle` quebrava.
  - **A2:** `re-engagement-cron` prefixa 55 em 10/11 dígitos (erro 131026 de 23/11). `_shared/lead-dedup.ts` NÃO mudou.
  - **A3:** `RelatorioAgendamentos.tsx` + `resumirAgendamentos`. **Regra dela (24/11): visita só conta com status `realizado`;
    remarcação não conta duas vezes.** Taxa = realizado ÷ (realizado + nao_compareceu). Mês do calendário + mesmos filtros; CSV com `;` e BOM.
- **Banco (autorizados por ela em 24/11):**
  - **B1** migration `20261124192223_soltar_fk_backup_modelo_versao_fase4` (FK da tabela de backup removida; 26 linhas intactas).
  - **B2** 3 leads ganharam o 55 (`6588b78d`, `9809ddfa`, `7a7a300e`); desfazer = tirar o "55" do início.
  - **Junção de lead duplicado:** `3f503726` juntado em `829c0150` (carro_km/ano/modelo e observações copiados, 1 mensagem movida,
    duplicado apagado; transação única).
  - **A4** migration `20261124211537_artigos_ajuda_exclusao_despublicar_relatorio_agendamentos` (3 artigos atualizados, conferido).
  - **Audi PQE7D92:** fichas WM (82465232) e NaPista recriadas e encerradas em 24/11 17:20 UTC (WM `CodigoRetorno 500` = sucesso);
    ela conferiu nos portais e devolveu o carro.
- **Land Rover FJK7E17:** tentativa de exclusão em 24/11 18:16 UTC falhou depois de apagar as tabelas ligadas; ela confirmou que não
  tinha documentos. Hoje está "devolvido".
- **Achados sem correção (baixa prioridade):** ~890 pedidos/dia do `wsrv.nl` a URLs antigas do Supabase Storage (400; o código do site
  não usa `wsrv.nl` — quem chama é externo, a descobrir); Facebook nega `pages_read_engagement` (leitura de comentários); `sync-google-drive`
  interrompe por tempo na placa CUR1D89; 0 agendamentos em 12 dias (não investigado); `bulkDelete` em `portais-sync.ts` sem uso.
- **FILA "um de cada vez" — rodada de 24/11 (noite), estado verificado ~22:40 UTC, `main` = `5793938`:**
  1. Ícone do iPhone — **FEITO, PR #34 no ar** (`public/painel-icone-{180,192,512}.png` do .ico oficial; hook `use-painel-pwa.ts`
     no AdminLayout E no Login; manifest/apple-touch-icon testados no navegador; site público sem manifest). Artigo "Usar o painel no
     celular" criado. **Falta: ela testar no iPhone de verdade** (apagar o atalho antigo e adicionar de novo). "Alvo de navegadores"
     (Etapa 3 do plano do celular) NÃO feito: o detalhe do plano não está registrado — perguntar o que era.
  2. PR #23 — **FECHADO** (conteúdo das sessões 43/44 trazido para a memória no PR #34).
  3. Nível "Vendedor" — **NÃO EXISTE no sistema** (níveis: admin_master, gerente, operador, bloqueado; `usuarios.role`='vendedor' é
     outra coisa). Ela escolheu CRIAR o nível: falta ela dizer o que Vendedor pode/não pode em relação a Operador; depois plano +
     migração (pedido separado).
  4. Template `aviso_novo_agendamento` — **APROVADO** pela Meta (verificado 24/11 pelo conector WhatsApp); 4 parâmetros batem com o
     código (`ai-sdr`). Nada a fazer.
  5. E-mail de teste ao Pedro — **ENVIADO** 24/11 21:34 UTC (vendas@ → pedro.cardoso@, Resend status "sent", domínio verificado).
     Falta ele confirmar que chegou.
  6. Filtro de data do Relatório de Estoque — **FEITO, PR #34 no ar** (entrada/venda + De/Até; "venda" marca só Vendidos; aviso de
     vendidos sem data: 18 de 28 vendas são anteriores a 28/09). Artigo atualizado.
  7. `follow-up-2h-cron` — **CORRIGIDO, cron AINDA DESLIGADO** (PRs #35/#36 no ar). Causa do desligamento de 24/09: o follow-up gravado
     como 'bot' zerava a contagem → "tentativa 2" a cada 4 h (até 12 por cliente, 262 envios em 3 dias). Ensaio 2 (`{"ensaio":true}`):
     3 leads receberiam `retomar_conversa`. **Religar = migração com `cron.schedule('follow-up-2h-cron-job','45 * * * *',...)`, só com
     "autorizo" dela.** `config.toml` ganhou `verify_jwt=false` para ela.
- **PR #1 FECHADO** — as 2 correções que faltavam (não-texto de número interno não vira lead; reengajamento pula número interno)
  entraram no PR #35. **Pendente:** as 2 regras de CLAUDE.md do PR #1 (commit `672d339`: "conferência inicial" e "rito de alteração do
  CLAUDE.md") não estão no CLAUDE.md — ela decide se entram.
- **Limpeza 24/11:** 7 branches locais e 29 remotas mescladas apagadas. `.wrangler/` NÃO apagada (comando barrado pela permissão);
  ela pode rodar `! Remove-Item -Recurse -Force .wrangler` na pasta do projeto.
- **Investigações 24/11 (só leitura):** `wsrv.nl` = terceiros (servidores Hetzner do próprio wsrv) pedindo fotos antigas que não
  existem mais no nosso banco; o único campo com URL antiga do Storage é `veiculos.qrcode_url` (29 veículos, 8 disponíveis) — origem
  não identificável (wsrv não repassa referer). Facebook: comentário chega e é salvo; só o link do post falha (token sem
  `pages_read_engagement` — ela gera token novo na Meta). Drive CUR1D89: interrupção por tempo é o previsto; terminou com 20 fotos.
  Agendamentos: último real 27/10; 12 leads conversaram em 12 dias, nenhum erro da ferramenta; padrão = cliente some na pergunta do
  horário (inferido). Achado: o celular da loja (final 3615) mandou 22 imagens para a Clara em 23/11 — ver se virou lead.
- **Fila "um de cada vez" (continua a de 11/11, abaixo).**


## SESSÃO 11–12/11/2026 — painel no iPhone (PR #27), Cloudflare só publica a main, retomada automática da Clara (PR #28)

Estado verificado em 12/11/2026 ~10:10 UTC (git, gh, Supabase, Cloudflare). **`origin/main` = `0c7180d`** (merge do PR #28).
Reconferido em 12/11/2026 ~15:15 UTC: `origin/main` = `b138698` (merge do PR #30, só memória), depois dos PRs #29 e #30.

- **CALENDÁRIO DE AGENDAMENTOS — código pronto em 12/11, branch `feat/agendamentos-calendario` (PR aberto em 12/11; conferir se já foi
  mesclado com `gh pr list` antes de confiar nesta linha).** Ela autorizou o bloco, testou no localhost e autorizou commit e push.
  Feito: `src/services/agendamentos.ts` (novo), `Agendamentos.tsx` (calendário do mês com "( n )" por dia + filtros
  status/tipo/veículo/origem + lista), `components/admin/agendamentos/AgendamentosDoDia.tsx` e `AcoesAgendamento.tsx` (novos),
  `Conversas.tsx` aceita `?lead_id=`. **Regra dela (12/11): o número do dia conta TUDO, inclusive cancelado e "não veio"; nada é apagado,
  para os relatórios gerenciais** (`contaNoNumeroDoDia` em `services/agendamentos.ts`). Artigo da Central de Ajuda atualizado (migrations
  `20261112151727` e `20261112151752`, conferidas no banco). Lint 0 erros e build ok; tela logada testada por ela, não por mim.
  **Pontos avisados a ela, sem decisão ainda:** (a) a tabela não guarda quem marcou (Clara x equipe) — separar exige coluna nova
  (migração, pedido à parte); (b) remarcação conta duas vezes (a antiga vira "Cancelado" e nasce outra) — infla "marcadas" no relatório.
  **Próximo: 2º PR com os relatórios** (marcadas x vieram x não vieram, taxa de comparecimento, gráficos, exportar CSV/PDF) — decidir (b)
  antes de desenhar o relatório.

- **PR #27 (tela branca no iPhone) MESCLADO em 11/11 (`9d400c6`), no ar e confirmado por ela no iPhone.** Causa: arquivo `/assets/*.js`
  ausente devolvia o `index.html` (200 + cache imutável). Correção: `worker/index.ts` (404 `no-store` para asset ausente) + `ErrorBoundary`
  + recarga única em `lazyWithRetry`. Detalhe: memória `tela-branca-iphone-asset-ausente`.
- **Cloudflare publicava QUALQUER branch em produção — RESOLVIDO em 11/11.** Causa: Configurações > Compilações do worker com
  "Compilações para ramificações de não produção" MARCADA e "Comando da versão" = `npx wrangler deploy`. Ela desmarcou e salvou.
  Verificado em 12/11 09:52 UTC: push de branch não gerou publicação nova e o PR #28 não teve check do Workers Builds. A `main` ainda é
  construída pelos dois caminhos (Actions + Workers Builds, mesmo código) — redundância opcional de remover depois.
- **PR #28 (Clara retoma sozinha) MESCLADO em 12/11 09:53 UTC (`0c7180d`).** Regra dela: texto do vendedor PAUSA a Clara
  (`leads.ai_desligada_auto_em`); interruptor do painel = desligamento definitivo; cliente 2 h sem resposta → Clara volta, responde e o sino
  avisa; acima de 22 h religa sem responder. Deploys verdes: `ai-sdr`, `clara-retomada-cron`, `send-whatsapp` e o front ("Manter desligada"
  achado no JS publicado). Ensaio ok; sem `x-internal-secret` = 401.
  **Teste real em 12/11 (número dela 5534984080220, depois de ela mandar MENU para abrir a janela de 24 h):** Clara religou, respondeu no
  WhatsApp (status "lido"), nota `clara_retomada:respondeu` e sino criados; "Manter desligada" impediu a retomada. Dados do teste apagados
  (1 lead, 6 mensagens, 1 notificação). `ai_prompts_config` NÃO foi tocado.
- **Migrations aplicadas:** `20261111195636_leads_clara_pausa_automatica`, `20261112100532_cron_clara_retomada` (job
  `clara-retomada-cron-job`, `*/10 * * * *`, ativo) e `20261112100534_artigo_ajuda_clara_retomada_automatica` (artigo conferido).
  Arquivos renomeados para os timestamps reais na branch `chore/clara-retomada-fechamento` (com esta memória) — **commit/push pendentes.**
- **1ª execução automática do cron: 12/11 10:10 UTC, `succeeded`, resposta 200 com 0 pausados** (verificado).
- **Proteção pedida por ela em 12/11 (branch `chore/clara-retomada-fechamento`, commit/push pendentes):** `clara-retomada-cron` ignora lead
  cujo telefone é de colaborador (`isAuthorizedPhone`, importado de `whatsapp-commands.ts` sem mexer em `_shared/` → só essa function
  redeploya). Motivo: no teste a Clara respondeu como se ela fosse cliente (lead falso criado por mim com o número dela).
- **PR #29 MESCLADO em 12/11 10:14 UTC (`a574a8c`)** — fecha o "commit/push pendentes" acima: proteção no ar, só `clara-retomada-cron`
  republicada; ensaio 200 e teste em modo ensaio com lead falso no número dela SEM o 9 (`553484080220`) → `ignorado:
  telefone_de_colaborador` (lead apagado). Push de branch não mudou o site (2ª confirmação da Cloudflare).
- **"Dryka Digital não aparece em Agendamentos" (pergunta dela em 12/11, verificado):** era o TESTE dela de 11/11 (Tucson, 15h). A Clara
  gravou 3 cópias; em 11/11 ela autorizou "cancelar os 3 agendamentos de teste" e eu cancelei os 3 → status `cancelado`; a tela abre em
  "Próximos", que esconde passados/cancelados (aparecem em "Todos"). Duplicação já corrigida no PR #25. Ponto do prompt (só com "autorizo"):
  a Clara disse "Visita agendada" antes de conferir as vagas e depois desdisse.
- **PLANO APROVADO (12/11) — calendário de Agendamentos (FECHADO em 12/11: código autorizado, feito e commitado na branch
  `feat/agendamentos-calendario`, ver o bloco no topo):** respostas dela: (1) calendário do mês
  mostrando só o NÚMERO de agendamentos no dia, ex. "( 3 )"; clicar no dia abre janela com os detalhes de cada agendamento, os dados do lead
  e botão "Ir para a conversa"; (2) todos da equipe veem tudo (RLS `allow_auth_all_agendamentos_visita` já é assim, sem mudança no banco);
  (3) Etapas 1 e 2 (calendário + filtros) num PR; relatórios (cartões, taxa de comparecimento, gráficos, exportar CSV/PDF) no 2º PR.
  Bloco proposto: `src/services/agendamentos.ts` (novo), `Agendamentos.tsx` (calendário + filtros status/tipo/veículo/origem + lista),
  `components/admin/agendamentos/AgendamentosDoDia.tsx` (novo), `Conversas.tsx` aceitar `?lead_id=` (hoje NÃO aceita), artigo da Central de
  Ajuda. Libs já instaladas: `react-day-picker` 9, `date-fns` 4, `recharts`. Tabela tem só 5 agendamentos (todos cancelados/não veio).
- **Comandos da Clara (análise de 12/11, só leitura):** 18 comandos reconhecidos (`_shared/whatsapp-commands.ts` + sinônimos em
  `whatsapp-intencao.ts`); só LISTAR, PAUSAR, SIM/NÃO e MENU já foram usados de verdade. Riscos achados: SUGERIR grava temas em
  `agenda_conteudo` sem confirmar e usa `gemini-2.0-flash` + só `GEMINI_APY_KEY` (provável quebra, INFERIDO); CORRIGIR dispara
  `gerar-conteudo` sem pedir SIM. `docs/marketing-whatsapp-comandos.md` desatualizado (12/09). Proposta: rodada 1 de teste só leitura (LEADS,
  QUENTES, HOJE, ESTOQUE, BUSCAR, ANUNCIOS, LISTAR, GASTO, VER) e rodada 2 com prévia + NÃO — aguarda ela.
- **Primeiro passo da próxima sessão:** conferir execuções do cron (`cron.job_run_details` do job e `logs_integracao` com
  `portal='clara_retomada'`) e se houve retomada real (`conversation_history` com `clara_retomada:%`).
- **Fila "um de cada vez" (pedido dela de 11/11), na ordem:** (1) Etapas 3 a 5 do plano do celular (alvo de navegadores, ícone no iPhone:
  `apple-touch-icon` 180×180, ícones 192/512, manifesto na tela de login, artigo "Usar o painel no celular"; Etapa 2 FEITA); (2) PR #23
  (memória, base antiga); (3) Item 6 (nível "Vendedor", ler RLS antes); (4) template `aviso_novo_agendamento` (id 3029790040691701, em revisão
  na Meta); (5) e-mail de teste ao Pedro (remetente vendas@carroeciamotors.com.br a confirmar); (6) filtro de data do relatório de estoque
  (`RelatorioEstoque.tsx`); (7) `follow-up-2h-cron` tem migration `20260921174606` mas NÃO está em `cron.job`.
- **Achado sem correção:** `ai-sdr` não tem autenticação interna (qualquer um com a URL chama).
- **Limpeza aguardando OK dela:** `.wrangler/`, branches mescladas (`fix/safari-tela-branca` local+remota, `feat/clara-retomada-automatica`),
  simulador WebKit na pasta temporária do Claude.

> Trazido do PR #23 (branch `docs/memoria-sessao-43`, nunca mesclado) em 24/11/2026. É INDÍCIO de 10–11/11: conferir antes de confiar.

## SESSÃO 44 (10 e 11/11/2026) — conversador: mensagens sumiam e não havia status de entrega (PR #24 MESCLADO, `main` = `7a5ff50`)

**Verificado em 11/11/2026 10:30 UTC:** PR #24 mesclado às 10:03 UTC; "Deploy producao" e "Deploy Edge Functions" = success; só as 6 funções previstas subiram
(`receive-leads`, `ai-sdr`, `send-whatsapp`, `re-engagement-cron`, `lembrete-agendamento-cron`, `agendamento-no-show-cron`; nada em `_shared/`); `/`, `/estoque`, `/admin/login`
= 200 e o passo "anti tela branca" do workflow passou. **NÃO testado:** execução real das funções (sem Deno local) e a tela logada. Ainda não entrou mensagem depois do deploy.

**Causas encontradas (caso Janetty, lead `1b2becd9-b239-4e14-9346-7e56357b5d11`):**
1. `conversation_history` NÃO estava na publicação `supabase_realtime` (só `leads`); nenhuma migration jamais a adicionou. O painel dependia só do Realtime e nunca recebia nada novo.
2. `sendMessage` do `ConversationPanel` não mostrava a mensagem enviada e ignorava o `error` do envio (e limpava a caixa mesmo com falha).
3. Os avisos da Meta (`statuses` entregue/lido/falhou e `reaction`) chegavam no webhook e ficavam só em `meta_webhook_logs`; ninguém os processava. Reação do cliente virava linha-lixo e chamava a Clara (5 vezes entre 10/09 e 14/10).
4. Em 7 dias: 24 `failed`, 7 `sent`, 7 `delivered`, 6 `read`. `131042` (pagamento pendente da conta do WhatsApp Business) nos reengajamentos das 10h; `131047` só para o final 0220 (alerta fora da janela de 24 h). O marcador "[Template Automático de Reengajamento Enviado]" era gravado mesmo quando a mensagem falhava.

**Entregue:** migrations `20261110223614_conversation_history_realtime` e `20261110230758_conversation_history_status_envio` (6 colunas anuláveis `wamid`, `status_envio`, `status_em`,
`erro_codigo`, `erro_texto`, `reacao` + trava + índice; rollback no cabeçalho do arquivo). Painel: ✓ enviado, ✓✓ entregue, ✓✓ azul lido, ⚠ não entregue (com o motivo), reação do cliente,
recarrega após enviar e a cada 10 s, aviso vermelho "Mensagem NÃO enviada" com o texto mantido na caixa. Mensagens antigas ficam sem ícone de propósito. Lembrete de visita e reagendamento
agora aparecem no conversador. Detalhe: o `sent` da Meta é ignorado (a linha já nasce `enviado`); status nunca é rebaixado.

**PENDENTE (esperam resposta/"autorizo" dela):**
1. **Teste dela:** com a conversa aberta, mandar mensagem do número de teste e ver a resposta da Clara aparecer sozinha e o ✓ virar ✓✓. Se não aparecer em 10 s, avisar.
2. **Regra de desligar a Clara ao responder por texto (A/B/C, sem resposta):** hoje texto livre do atendente desliga `ai_enabled` (send-whatsapp, regra de 17/09/2026); template/foto/documento não.
   Foi o que fez o interruptor "parecer quebrado" na Janetty: ela ligava, enviava texto e o sistema desligava de novo. O interruptor em si grava certo (logs 204). A) manter; B) perguntar antes
   (recomendado); C) nunca desligar sozinho. O aviso "Clara desligada" também aparece mesmo se ela já estava desligada (detalhe menor). A Janetty está com `ai_enabled = true` (ela ligou).
3. **Frases de erro da Meta:** `ERROS_META` em `src/lib/whatsapp-status.ts` está VAZIO (único `TODO(human)` desta sessão; há outro antigo em `ad-copy-generator/index.ts`). Sem ele o painel mostra
   "Falha no envio (código N da Meta)". Códigos: 131042, 131047, 131026, 131049, 131048, 130429.
4. **Segurança (achado, nada alterado):** a tabela `leads` tem a política `allow_anon_update_leads` (UPDATE para `anon` com `using true`): quem tem a chave pública altera qualquer lead.
   Investigar quem depende dela (formulários?) e propor migration de correção com rollback (pedido separado).
5. ~~**Pagamento da conta do WhatsApp Business na Meta**~~ **Verificado em 11/11 ~10:30 UTC (`meta_webhook_logs`):** ela pagou em 10/11 e NÃO há mais nenhum `131042` desde as 22:00 UTC de 10/11
   (o reengajamento das 10:00 UTC de 11/11 teve 4 `delivered`, 2 `read` e só `131047` para o final 0220, que é alerta fora da janela de 24 h). NÃO confirmado: quais dessas entregas foram templates de cliente.
   Os `131047` para o 0220 seguem: o alerta interno só chega se ela tiver escrito para o número da Clara nas últimas 24 h (ou se usar template).
6. **Perguntas abertas:** de onde vem o rótulo "sem vendedor" (não existe no código; o lead está `novo`); por que a mensagem de 10/11 22:55 saiu duplicada (22:55:35 e 22:55:36, causa não identificada).
7. **Filtro de data do relatório de estoque (ela autorizou, mas faltam 2 respostas):** marcar "Vendidos" sozinho ao filtrar por venda? e OK do commit. Só front, em `RelatorioEstoque.tsx`
   (`data_venda` já existe em `veiculos`). A branch local `feat/video-narrado-etapa1` foi APAGADA em 10/11 (estava mesclada).
8. **Artigo da Central de Ajuda** "Entender os ✓ e os avisos de falha no conversador" (autorização permanente de 09/11): ainda NÃO escrito.
9. Os pendentes da sessão 43 abaixo continuam valendo (voz do vídeo narrado, esteira Fase 2 e as demais).

**Armadilhas novas:** mexer em `_shared/` redeploya as 87 funções (evitei de propósito); `mcp__supabase__query_logs` não aceita `interval '40 minutes'` (usar `iso_timestamp_start`); no `edge_logs` as chaves
úteis são `request.method`, `request.path`, `request.search`, `response.status_code`; `leads.updated_at` NÃO muda com `ai_enabled` (sem gatilho), então não dá para datar quando a Clara foi desligada;
PRs de memória abertos (#23) colidem com novas branches de documentação: registrar na mesma branch do PR aberto.

## SESSÃO 43 (07 a 10/11/2026) — relatório de estoque, esteira Fase 1, Central de Ajuda, vídeo narrado Etapa 1 (TUDO MESCLADO)

**Estado verificado em 10/11/2026:** `main` = `origin/main` = `6cba797` (merge do PR #22); código sem pendência de commit (os 2 arquivos de memória foram commitados na branch `docs/memoria-sessao-43`). Confie no `git status`. Deploys "Deploy producao" e
"Deploy Edge Functions" do PR #22 terminaram com sucesso; `/estoque` = 200. (Outras telas não reabertas após o PR #22: conferir home e `/admin/login`.)

**Entregue e no ar:**
- PR #18/#19: esteira de criativos estáticos, Fase 1 (4 fotos no cadastro, botão "Gerar criativos", tabela `veiculo_criativos`; migração `20261107204713`).
- PR #20: Relatório de Estoque imprimível (PDF). PR #21: artigos da Central de Ajuda (3 novos + 3 ajustados, conferido no banco).
- PR #22 (`6cba797`): `docs/video-narrado-padrao.md` (PADRÃO obrigatório, também citado no `CLAUDE.md`), `src/lib/roteiro-video.ts` (monta e valida o roteiro; não usado
  por nenhuma tela ainda) e Edge Function `narrar-veiculo` v1 (`verify_jwt = true`, SÓ modo ensaio: áudio mudo, custo ElevenLabs zero; "real" devolve 501).
  Sem login responde 401 (verificado). Chamada AUTENTICADA ao ar: NÃO testada (precisa do JWT dela).
- 8 veículos reais testados no roteiro: todos passam no 9:16; no 4:5 o Pajero tem 72 palavras (mín. 75), o validador avisa.

**Decisões dela (não reverter):** preço NÃO é falado (vai na tela final e na descrição); fecho "Chame a gente no WhatsApp e marque uma visita na loja" sem número;
tom "próximo e confiante"; vídeos 9:16 e 4:5, montados no painel (navegador); sem gastar crédito ElevenLabs em teste; arquivos organizados em
`criativos/<placa>/{imagens,videos,audios}` no R2. Data do relatório: filtrar pelos DOIS (entrada = `created_at`, venda = `data_venda`).
Regra permanente: criar/ajustar artigos da Central de Ajuda com commit e push sem pedir a cada vez (09/11).

**PRÓXIMOS PASSOS (nada disso foi iniciado; esperam resposta/"autorizo" dela):**
1. **Voz:** confirmar com ela se a voz clonada que a Clara usa (secrets `ELEVENLABS_API_KEY`/`ELEVENLABS_VOICE_ID` já no Supabase, inferido) é a dela para os
   vídeos. A chave do CLI em `.env.local` (git-ignorada, final 4190) é de OUTRA conta, só tem 21 vozes padrão: vale só para teste local. Se não for, ela envia o Voice ID.
2. **Filtro de data no relatório** (só front, `RelatorioEstoque.tsx`): mostrar antes→depois e pedir "autorizo". Dois períodos opcionais: entrada (de/até) e venda (de/até).
3. **Esteira Fase 2** (2 veículos/dia às 19:00, 6 linhas/dia; tipo `criativo_estatico` em `social_esteira`; `publicar-social` lê `rede` + trava de duplicidade;
   conferência de preço/dados; "aprovar os 3 posts do veículo"; novo na frente, depois sorteio com descanso de 15 dias; Stories conferido na API da Meta).
   Ela disse "autorizo" para a Fase 2, mas a MIGRAÇÃO DE BANCO exige pedido separado: ler `social_esteira`, trazer o SQL exato e pedir.
4. **Vídeo narrado, Etapa 2** (voz real, cache por hash do texto, teto diário de caracteres, migração de `veiculo_criativos` para vídeo/áudio — pedido separado);
   depois Etapa 3 (botão "Gerar vídeo narrado" no cadastro) e Etapa 4 (envio para aprovação e uso em anúncio).
5. Apagar a branch local `feat/video-narrado-etapa1` (já mesclada; precisa do OK). NÃO mexer em `agents/token-architecture-analysis-and-fixes` nem
   `fix/numero-interno-nao-vira-lead` sem perguntar.
6. Os testes dela: criativos do Hilux ("Gerar criativos" / "Enviar para aprovação") e decisão sobre o rascunho antigo (id `4d60140d-ee51-45a4-acd9-100b04e45f97`).
7. Artigos da Central de Ajuda adiados até ela testar: "Criar textos de anúncio com IA", "Agendador de Redes Sociais", "Ideias com IA". Features novas
   (filtro de data, narração, Fase 2) precisarão de artigo.

**Estado dos crons (verificado 10/11):** 14 `publicar-social-cron-job` ativo (*/15); 19 `post-organico-diario-cron-job` PAUSADO desde 08/11; 20 `esteira-proximo-post-cron-job`
ativo mas `esteira_config.ativa=false` (a esteira só monta carrosséis).

**Outras sobras:** rodapé do criativo (~26–28 px) e layout 1,91:1; operador gerar criativos dos ~29 veículos; regenerar tipos do Supabase e tirar `as any` de
`src/services/ad-copies.ts`; `FRASES_PROIBIDAS` (`TODO(human)` em `ad-copy-generator/index.ts`); preencher nomes de 23 conversas sociais antigas (precisa "autorizo").

**Armadilhas novas:** Git Bash `tar -xzf C:\...` falha (usar PowerShell); `mcp__supabase__list_edge_functions` devolve saída enorme (evitar); sem Deno local, testar
funções com `Deno.serve` simulado em Node + `ffprobe`; `numeroPorExtenso` já corrigido para "um milhão duzentos e cinquenta mil".

## SESSÃO 42 (05/11/2026) — Criador de Anúncios, Fase 1 (bloco A) PRONTA LOCALMENTE, NÃO commitada

- **Branch `feat/gerador-anuncios-fase1` (saiu de `fix/csp-envio-r2`), NADA commitado, NADA no banco, NADA deployado.** 9 arquivos:
  `AdCopyGenerator.tsx` (reescrito), `AdCarrossel.tsx`, `AdVariacoes.tsx`, `src/lib/ad-limites.ts`, `src/lib/criativo-carrossel.ts`,
  `src/services/ad-copies.ts`, `ads-manager.ts` (só removeu `generateAdCopy`), `supabase/functions/ad-copy-generator/index.ts` (reescrita; caminho antigo
  mantido para compatibilidade) e a migration `supabase/migrations/20261105223858_ad_copies.sql` (aplicada em 05/11/2026 22:38 UTC, `migration list` conferido).
- **Verificado em 05/11:** `bun run lint` = 0 erros (92 avisos antigos, nenhum nos arquivos novos); `bun run build` ok; `/admin/anuncios` responde 200 no
  `localhost:8080`. **NÃO testado:** a tela logada, gerar texto (a function nova só roda depois do deploy), carrossel e vídeo no navegador.
- **ORDEM DE EXECUÇÃO (os 4 riscos):** (1) conflito de memória: `MEMORY_WORK.MD`/`PROXIMA_SESSAO.md` mudam em PRs diferentes, mesclar o PR #14 antes (feito,
  `57bd0d5`); (2) migration `ad_copies` aplicada ANTES de mesclar o front que a usa (FEITO em 05/11 com o "autorizo" dela); arquivo renomeado para o timestamp
  real, `migration list`, regenerar tipos e tirar o `as any` de `ad-copies.ts`; (3) a function só pode ser testada depois do deploy (merge dispara
  `deploy-functions.yml`); (4) teste manual logado no painel depois do deploy.
- **ARMADILHA: NUNCA rodar `bun run format` no repositório inteiro.** Ele reescreveu 483 arquivos (fim de linha CRLF/LF + reformatação real) e, se
  commitado, redeploya dezenas de functions. Usar `npx oxfmt <arquivo>` só nos arquivos próprios. Limpo em 05/11 com `git checkout HEAD -- <arquivos>`.
- **Pendências dela:** "autorizo" da migration; "autorizo" do artigo da Central de Ajuda (dado no banco; o artigo antigo "Criar textos de anúncio com IA"
  está desatualizado); "autorizo" de commit+push (perguntar junto); depois PR/merge/deploy (liberados com segurança comprovada). Decidir a lista
  `FRASES_PROIBIDAS` (promessas que a loja nunca pode fazer; único `TODO(human)` em `ad-copy-generator/index.ts`). Padrões usados sem resposta dela: card 1 do
  carrossel com preço, mínimo 3 fotos, RLS "autenticado vê tudo". Limites de caracteres por canal vêm de conhecimento geral, NÃO conferidos na doc oficial.
- **Fase 2 (não iniciada):** catálogo de ofertas de financiamento, consignação, consórcio e seguro; checar categoria especial "Crédito" da Meta.


## SESSÃO 41 (04/11/2026) — PR #12 mesclado e no ar; falha do "Enviar para aprovação" = CSP bloqueia o envio ao R2

- **PR #12 (criativo 4 fotos + selo + logo) MESCLADO em 03/11 22:55 UTC, commit `145f253`; deploy verde (55s); site publicado conferido em 03/11**
  (home, `/estoque`, `/admin/login` renderizam; logo nova servida com 408.542 bytes). ~~SEM merge e SEM deploy~~ nas notas da sessão 40 abaixo = **FECHADO**.
  **Ainda NÃO testado:** o criativo no painel logado (gerar/salvar/exportar, 9:16 com 4 fotos).
- **Falha ao enviar post orgânico para aprovação (diagnóstico de 04/11, causa INFERIDA com evidência forte):** a CSP do site (`public/_headers`,
  `connect-src`) **não listava o R2**, então o navegador bloqueia o `PUT` da imagem só no site publicado. Verificado: logs mostram 2 URLs pré-assinadas
  emitidas (13:44 e 13:45 UTC) e **nenhum `POST` em `social_posts`**; `veiculo_criativos` = 0 registros no total (o "Salvar no sistema" também nunca
  funcionou); o navegador registra `securitypolicyviolation` com `disposition: enforce` para hosts fora da lista. O CORS do bucket está certo
  (permite `PUT` do `www`). **Correção:** acrescentar `https://*.r2.cloudflarestorage.com` ao `connect-src` (branch `fix/csp-envio-r2`, PR a mesclar).
  **Só se confirma depois do deploy** (no localhost não há CSP): conferir o cabeçalho com `curl` e repetir "Enviar para aprovação". Outras 7 telas usam o
  mesmo envio (cadastro de veículo, editor de imagem, conversa de leads...): testar se alguma falhava.
- **Erro `131042` do WhatsApp CONFIRMADO nos logs de 04/11:** "conta com pagamentos pendentes" (a Meta aponta o link de cobrança). Ela precisa
  regularizar o pagamento do WhatsApp Business na Meta; antes era só inferência.
- **Rascunhos apagados:** os 2 posts diários automáticos (03/11 e 04/11) foram apagados às 13:46 UTC pela tela de aprovações.
- **ONDE PARAMOS (fim da sessão 41, 04/11):** branch `fix/csp-envio-r2` com o commit `fdace82` **só local** (arquivos: `public/_headers`,
  `docs/R2_CORS_CONFIGURATION.md`, `MEMORY_WORK.MD`, `PROXIMA_SESSAO.md`). O 1º `git push` falhou por erro de digitação (ponto no fim do nome:
  `invalid refspec`); o 2º, correto (`! git push -u origin fix/csp-envio-r2`), travou 120 s esperando a janela de login do Git (rodava em segundo plano,
  resultado **NÃO verificado**). **Primeiro passo da próxima sessão:** `git fetch` e `git ls-remote origin fix/csp-envio-r2` para ver se subiu; se não,
  ela roda o push de novo e conclui a janela de login. Depois: abrir o PR (autorizado por ela), ela mescla com `! gh pr merge <N> --merge`, conferir
  `gh run list`, `curl -sI https://www.carroeciamotors.com.br/admin/login` (ver `*.r2.cloudflarestorage.com` no `connect-src`), abrir home, `/estoque`,
  `/admin/login`, e ela repete "Enviar para aprovação" (e "Salvar no sistema") no painel. Nada deployado ainda para essa correção.
- **Kit do IX35 não apareceu para aprovação (diagnóstico de 04/11, só leitura, causa verificada nos dados):** (1) a esteira de posts
  (`esteira-proximo-post`, cron a cada 15 min) está **pausada** (`esteira_config.ativa = false`) e o carrossel do IX35 é o 1º da fila (`social_esteira`)
  desde 06/10, então nunca gerou rascunho; (2) a tentativa manual das 13:41 UTC caiu no mesmo bloqueio da CSP acima. Ligar a esteira = mudança em
  produção (2 posts/dia, 10:00 e 18:00, começando pelo IX35): **decisão dela PENDENTE**; recomendo ligar só depois de o envio estar testado.
- **Fila de publicação e cron de 15 min — JÁ EXISTEM (não criar outro):** "fila" = `social_posts` com `status = 'Agendado'` e `data_agendamento <= agora`.
  `publicar-social` roda no cron `publicar-social-cron-job` (jobid 14, `*/15 * * * *`), publica Instagram e Facebook (feed/stories e carrossel).
  Outros crons: `esteira-proximo-post-cron-job` (jobid 20, `*/15`), `post-organico-diario-cron-job` (jobid 19, `0 11 * * *`). Hoje o botão "Aprovar" em
  Central de Redes Sociais → Aprovações move Rascunho → Agendado.
- **PEDIDO DELA AINDA NÃO IMPLEMENTADO (aguarda "autorizo" e 2 respostas):** botão extra **"Enviar para a fila de publicação"** no diálogo "Criar post
  orgânico" (`CriativoAnuncioPanel.tsx`, ao lado de "Enviar para aprovação"): grava como `Agendado` com `data_agendamento` = agora, com confirmação
  "Publicar sem revisar? Sai em até 15 min". Também renomear "Aprovar" → "Aprovar e enviar para a fila" nas Aprovações. Fazer em branch nova **depois** do PR
  da CSP mesclado. Perguntas abertas: (a) sai no próximo ciclo de 15 min ou ela escolhe data/hora? (b) ligar a esteira? Ao entregar, escrever o artigo
  na Central de Ajuda (regra do projeto).
- **Melhorias sugeridas (sem autorização ainda):** mostrar horário da próxima execução e tamanho da fila; mensagem de erro clara no envio em vez de
  "Failed to fetch"; "Aprovar todos" para os rascunhos diários; checar post duplicado por veículo/dia; corrigir o `return` silencioso de
  `criarPostOrganico` (se `!resultado || !canvas` não avisa nada); alerta de rascunho novo (hoje os alertas de WhatsApp falham com `131042`).

## SESSÃO 40 (03/11/2026) — criativo com 4 fotos + selo (commitado), Etapa 0 da marca de IA (teste feito), WABA da Clara

Estado verificado em 03/11 (git, `ls-remote`, banco, API do WhatsApp Business). **`origin/main` = `141a060`** (conferido com `git fetch`).
Branches enviadas/locais: `docs/memoria-sessao-39` (enviada, `5a9b6fa`) e `feat/criativo-4-fotos-selo` (local, `2a4de6c`, ver o push abaixo).

- **Logo do criativo corrigida em 03/11/2026 (commitada na mesma branch, SEM merge e SEM deploy).** Ela viu que o "&" de CARRO&CIA estava branco; o oficial é
  vermelho. O arquivo `public/logo-carro-e-cia-branco-vermelho.png` era idêntico ao que ela enviou (o "&" branco já vinha nele). Recolori só o "&" e o
  "VEÍCULOS" para RGB (227, 50, 42), a cor chapada da logo oficial (`logo carro e cia.png`); tamanho, transparência e letras brancas intactos (conferido
  por número). Em `criativo-padrao.ts` a redução da logo passou a `imageSmoothingQuality = 'high'`. Lint 0 erros, build ok, desenho conferido nos 3 formatos.
  **Limite:** o "VEÍCULOS" da arte de referência é fino e borrado (mede ≈ 98,32,40, escuro por mistura com o preto), então não deu para medir a cor real dele
  ali; usei a da logo oficial. Se ela quiser mais escuro como na referência, é ajuste de cor. Melhor fidelidade: ela enviar o arquivo-fonte da logo. Só o
  criativo usa esse arquivo. **NÃO testado no painel logado.**
- **Criativo "Padrão Carro e Cia" com 4 fotos e selo "Cautelar Aprovada" — commit `2a4de6c`, SEM merge e SEM deploy.** Causa das 3 fotos: painel aceita 4
  (`MAX_FOTOS_CRIATIVO`) e o desenho 3 (`MAX_FOTOS_PADRAO`); agora 4 (1 principal + 3). Selo no canto superior direito da foto principal, nos 3 formatos,
  **sempre ligado** (decisão dela: todo veículo entra com cautelar aprovada). Lint 0 erros, build ok, desenho conferido no Chrome. **NÃO testado no painel
  logado** (nem exportar/salvar). **Teste local não funciona:** o bucket bloqueia por CORS as fotos de `localhost`; testar na prévia do Cloudflare (a
  confirmar se o PR gera) ou no site publicado depois do merge.
- **Erros de texto no CADASTRO (verificado no banco, nada corrigido):** Jaguar F-Pace (TCT5A21) `versao` = "2.0 R-Dynamic SE 404cv (Hibrido)" sem acento;
  Pajero (ETP3C11) `versao` = "TR4 2.0/ 2.0 Flex 16V 4x4 Aut." (repete "2.0"). **Decisão dela PENDENTE** (oferta minha: listar todos os veículos com esse tipo de erro
  e corrigir; alteração de dado de produção = backup + pedido separado). No 9:16 a 3ª linha do título ficou apertada junto do preço (a conferir).
- **Marca de IA nas fotos — decisão REVISADA em 03/11:** ela pediu a ferramenta e disse que "a edição não muda o estado real do carro" (palavra dela, não
  verificável). Salvaguardas combinadas: não apagar o C2PA, original sempre intacta, preencher o canto (sem cortar). **Etapa 0 feita** (foto `OPZ2408`,
  arquivos em `...\scratchpad\etapa0\`): marca some, emendas discretas. **Aguarda o veredito dela.** Se aprovar: itens 1–7 do plano (function
  `tratar-marca-ia` com `verify_jwt = true`, 2 colunas em `veiculo_fotos_ia`, botão na aba "Fotos", carrossel aceitando as tratadas, textos/docs, artigo
  da Central de Ajuda). Os comentários do código e do `CLAUDE.md` ("marcas NÃO são removidas") ficam desatualizados nessa hora.
- **Código de 6 dígitos da Meta para o número da Clara: NÃO encontrado** (Gmail e webhook, falsos positivos de erro 131047/131042). O SMS vai ao chip do
  número; origem do pedido NÃO identificada (o número já está `registered`). Possível problema de pagamento da conta (erro 131042, inferido).
- **WABA da Clara reconfirmado:** `1530053735172401`; Phone Number ID `1231947963330780`; `+55 34 9738-4177`; business `carroeciaveiculos`. O "segundo WABA"
  é provavelmente a conta de teste (inferido).
- **Sujeira de ambiente (verificado 03/11):** 2 servidores Vite de 01/11 ainda rodando (portas 5173 e 5199); não fechei (não são desta sessão).

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
  regras de IA dos 2 modelos antigos (função + `ai_prompts_config`, pedido separado); ~~selo "Cautelar Aprovada"~~ (FEITO em 03/11, commit `2a4de6c`, ver sessão 40); potência (cv); 16:9.
- **Becos sem saída novos:** (1) o MCP não sobe arquivo binário no Storage do Supabase (usado `public/`). (2) `query_logs` com
  `source='function_edge_logs'` FUNCIONA (método/status/URL, sem corpo), contrariando a nota de 29/10. (3) `git switch -c ... origin/main` deixa o
  upstream em `origin/main`: empurrar com o nome explícito. (4) `git push` travou várias vezes no `git-credential-manager` (login do GitHub no
  Windows); resolve-se rodando o push com `!` ou concluindo a janela, nunca trocar credencial/remoto; matar os processos git travados antes de
  tentar de novo. (5) O classificador do Claude Code barra `gh pr merge` feito por mim às vezes ("Merge Without Review"); alternativa:
  ela roda `! gh pr merge N --merge`. (6) Script do PowerShell: `[math]::Min(1, 0.65)` arredonda para inteiro e dá 100%; usar Python para conta.
  (7) Heredoc de Bash com aspas misturadas quebra: usar script `.py` em arquivo.
- **Sujeira de ambiente:** 4 processos do Vite de sessão anterior (portas 5173 e 5199) ficaram rodando. **Verificado em 03/11/2026: continuam rodando** (2 servidores, `bun`+`node` cada).

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
  sem documento; 0 dos 65 veículos marcados; o site público já mostra selo quando marcada. ~~Selo continua desligado.~~ Ligado em 03/11/2026 (commit `2a4de6c`), sem depender da caixinha, por decisão dela.
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