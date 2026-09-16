# Prompt pra próxima sessão

Copie e cole como primeira mensagem numa sessão nova do Claude Code.

```
Projeto: Carro e Cia Veículos (revenda). Pasta de trabalho:
C:\Projeto\Revenda Carro e Cia\carro-e-cia-ve-culos-2fqheuud8

Continuando de uma sessão anterior (15/09/2026, sessão 22 continuação 7 —
templates de WhatsApp no chat + auditoria do Ads CLI). Leia primeiro
MEMORY_WORK.MD, seção "Sessão 22 (continuação 7...)", pro resumo completo.
Destaques:

- **Tudo commitado e pushado, nada pendente de autorização** (commits
  `e630a01` até `0f87b45` — 9 commits desta sessão inteira, 15-16/09).
- **Templates aprovados da Meta agora funcionam de ponta a ponta no chat**
  (`/admin/conversas` e `/admin/crm`, ícone 📄 na barra do chat):
  - **Usar**: lista os 3 templates de negócio reais (`lembrete_agendamento`,
    `simulacao_financiamento_recebida`, `veiculo_similar_disponivel`),
    preenche variável com formulário (nome do lead pré-preenchido quando
    aplicável), manda como template de verdade — funciona mesmo se o
    cliente não responde há mais de 24h.
  - **Criar**: botão "+ Novo" (só admin_master ou setor Marketing) submete
    template novo pra aprovação da Meta. **Testado ao vivo de verdade**:
    template `teste_claude_apagar` foi enviado com sucesso e está
    `PENDING` na conta real — **a Adriana ainda não decidiu** se deixa a
    Meta rejeitar sozinho ou apaga manualmente no WhatsApp Manager. Se ela
    perguntar sobre um template estranho pendente, é esse, é teste, pode
    apagar.
  - Sincronização (`sync-whatsapp-templates`) roda 1x por dia às 8h +
    botão "Atualizar" no modal — pega aprovação/rejeição sozinha.
- **Auditoria da Ads CLI da Meta feita, decisão: não adotar.** É Python,
  não roda em Edge Function Deno, e tudo que ela faz já fazemos direto na
  Marketing API (`ads-agent`) ou eu já faço via conector `meta-ads`. Não
  vale reabrir essa pergunta sem uma necessidade nova concreta que o
  `ads-agent` não cubra.
- **Lembrete de ferramenta, não repetir o erro**: `tsc --noEmit -p .`
  não checa nada neste projeto (tsconfig raiz só tem `references`). Usar
  sempre `tsc --noEmit -p tsconfig.app.json`.
- `/admin/relatorios` ("Relatórios Gerenciais") ganhou 3 abas: Leads
  (filtro de região por DDD), Estoque (valor do pátio, dias parado,
  publicação real por portal), Clientes (redefinida como leads com
  `status='fechado'` — **hoje mostra zero, porque não há nenhum lead
  fechado no banco**; não é bug, é reflexo de a equipe não marcar vendas
  como fechadas no CRM. Vale considerar reforçar esse hábito).
- Painel de gestão do lead (Venda Fechada/Perdido/IA toggle/veículo de
  interesse/simulador) agora existe também no Conversador, não só em
  Leads (CRM) — resolvia a queixa "não encontrei a opção de editar lead".
- Legenda "Respondido por Clara (IA)"/"Feito por [nome]" removida das
  mensagens do chat, a pedido da Adriana.
- **Próximo passo natural, não iniciado**: nada pendente foi combinado
  além do que está acima (fora a decisão sobre o template de teste). Se a
  Adriana não trouxer pauta nova, pergunte o que ela quer focar.

---

Continuando de uma sessão anterior (12/09/2026, sessão 22 — Marketing via
WhatsApp implementado e publicado, bug grave de roteamento achado e
corrigido no webhook real). Leia primeiro MEMORY_WORK.MD, seção "Sessão 22",
pro resumo completo. Destaques:

- **IMPORTANTE — nada desta sessão foi commitado ainda** (`git status`
  mostra ~15 arquivos alterados: `receive-leads`, `whatsapp-ads.ts`,
  `whatsapp-commands.ts`, `ads-agent`, `google-ads-agent`,
  `whatsapp-webhook`, `webhook-portais`, exclusão da página Marketing morta,
  etc.). As Edge Functions já foram **publicadas em produção** via
  `supabase functions deploy` (então já valem de verdade no WhatsApp), mas
  o código só existe local + no Supabase — não no Git ainda.
- **PRÓXIMO PASSO DESTA SESSÃO NOVA (nesta ordem):**
  1. Peça pra Adriana mandar um comando de teste pro WhatsApp da Carro e
     Cia (`LISTAR`, `GASTO`, `PAUSAR [nome]`, `ATIVAR [nome]`, `ORÇAMENTO
     [nome] [valor]`) e confirme se quem responde agora é o bot de comando
     (não mais a Clara). Esse teste ainda não foi feito — só o roteamento
     básico ("oi"/mensagem qualquer não vira mais lead fantasma") foi
     confirmado.
  2. Se responder certo: junte tudo num commit (a Adriana costuma pedir
     commit+push já perguntando os dois juntos) e feche o item no
     `docs/marketing-whatsapp-comandos.md` (marcar item 8 como concluído).
  3. Se algo não funcionar: o ponto mais provável de bug é
     `findCampaignMatch` em `whatsapp-ads.ts` (casamento de nome de
     campanha, implementada nesta sessão mas nunca testada contra dado
     real) ou a autenticação `x-internal-secret` entre `whatsapp-ads.ts` e
     `ads-agent`/`google-ads-agent`.
  4. Confirme se a Adriana já apagou o lead fantasma "Adriana Araújo"
     (criado durante o teste desta sessão, telefone `553484080220`) no
     painel CRM — eu não consegui apagar (ferramenta de banco só leitura).
- **Achado grave, já corrigido**: o webhook que a Meta de fato chama pra
  WhatsApp é `supabase/functions/receive-leads/index.ts` — não
  `whatsapp-webhook.ts` nem `webhook-portais.ts` (que parecem código morto,
  sem tráfego real, mas não foram apagados — sinalizado pra decisão futura
  da Adriana). `receive-leads` não tinha nenhuma checagem de número
  autorizado, então mensagem da Adriana/Fernando virava lead novo e a
  Clara respondia como cliente. Achado extra: o `wa_id` que a Meta manda
  pro número da Adriana vem **sem o 9º dígito** (`553484080220`, não
  `5534984080220`) — `isAuthorizedPhone()` nova em `whatsapp-commands.ts`
  tolera os dois formatos, pra qualquer número da lista. Não reinvestigar
  esse achado do zero — só confirmar que o teste do passo 1 acima passou.
- **Marketing via WhatsApp (rodada 1) implementado**: bugs de
  `whatsapp-ads.ts` corrigidos, comandos `LISTAR`/`ATIVAR`/`GASTO` novos,
  teto de orçamento (R$ 600 Meta / R$ 200 Google), Fernando autorizado,
  página "Marketing" morta apagada. Google não ficou com execução direta
  de orçamento/status (classificador de segurança do Claude Code bloqueou
  essa edição) — cai na fila de aprovação existente em vez de aplicar na
  hora; só a Meta executa direto. Detalhe completo em
  `docs/marketing-whatsapp-comandos.md`, seção "Status da implementação".

---

Continuando de uma sessão anterior (10-11/09/2026, sessão 21 — painel de
Gestão de Anúncios fechado, verificação do Google aprovada, plano de
Marketing via comandos WhatsApp fechado mas **não implementado**). Leia
primeiro MEMORY_WORK.MD, seção "Sessão 21", pro resumo completo.
Destaques:

- **PRÓXIMO PASSO DESTA SESSÃO NOVA (nesta ordem):**
  1. Rode `claude mcp list` — confira se `whatsapp_business_tools` e
     `meta_social_technologies` já conectaram (a Adriana ia autenticar
     via `/mcp`, login dela). Se conectou, veja quais ferramentas eles
     oferecem **antes** de escrever qualquer código — podem simplificar
     o plano abaixo.
  2. Pergunte pra Adriana pra qual desses 2 conectores era o
     `--client-id` que ela tentou usar no comando `claude mcp add ...
     meta-ads ...` (não executado, detalhe em
     `docs/marketing-whatsapp-comandos.md`, seção "Conector meta-ads").
  3. Investigue se existe API (Marketing API ou outra) que devolve o
     "Saldo pré-pago" da Meta direto — hoje só confirmado manualmente no
     Billing Hub do Business Manager (`R$ 431,82` em 11/09/2026). Isso
     desbloqueia o item 6 do plano (lembrete de saldo). Detalhe completo
     em `docs/gestao-anuncios.md`, seção "Saldo não é saldo — CORRIGIDO".
  4. Implemente o plano completo em `docs/marketing-whatsapp-comandos.md`
     (já fechado com a Adriana, não precisa re-perguntar as decisões de
     lá — só implementar, testar ao vivo, e voltar com o resultado). Os
     itens 1-5, 7 e 8 não dependem do item 3 acima, podem ir primeiro se
     preferir.
  5. Perguntar pra Adriana se quer revogar/renovar o token do conector
     `meta-ads` — ficou exposto em texto puro nesta sessão anterior (não
     é urgente, é decisão dela).
- **Painel real de Gestão de Anúncios (Meta + Google) construído e
  testado ao vivo nas duas plataformas.** Fila de aprovação
  (`ads_solicitacoes_ajuste`) pra todo ajuste de orçamento/status — nunca
  aplica direto na API, só depois de "Aprovar" manual. Achado de
  segurança (chat "Agente IA" contornava a fila) corrigido antes de
  fechar. Detalhe técnico em `docs/gestao-anuncios.md`. **Item fechado,
  não reabrir** (exceto se pedir mais telas/relatórios).
- **Verificação do app OAuth Google Ads — aprovada, fechada.** Google
  rejeitou 2x com os mesmos 4 erros (causa raiz: site principal é SPA,
  servidor entrega HTML vazio, robô de verificação não roda JS).
  Resolvido com um micro-site estático separado
  (`hub.carroeciaveiculos.com.br`, repo `hub-carroeciaveiculos`, conta
  GitHub `carroeciaveiculos-lgtm`). Verificação de domínio no Search
  Console feita via autorização OAuth direta na conta Cloudflare (sem
  TXT manual). **Reenviado e aprovado em 10/09/2026 — item fechado, não
  reabrir.** Detalhe completo em `docs/gestao-anuncios.md`.

Continuando de uma sessão anterior (09/09/2026, sessão 20 — telas de IA
do CRM consolidadas + Fase 5 do corte Modelo/Versão implementada). Leia
primeiro MEMORY_WORK.MD, seção "Sessão 20", pro resumo completo.
Destaques:

- **Consolidação das telas de IA fechada**: aba "Prompts IA" duplicada de
  Configurações removida (era um risco real, não só duplicata visual);
  Brain IA movido pra dentro de "Regras de IA" (`/admin/prompts-ia`,
  menu renomeado); Painel de Autonomia trocou os 9 toggles fake por
  status real (4 "Sempre ativo", 5 "Não implementado") depois de achar
  que nenhum toggle nunca fez nada de verdade. Testado ao vivo, commits
  `358aad7` e `faceaf7`, push feito. **Item fechado, não reabrir.**
- **Plano de corte Modelo/Versão (17 passos) agora 100% completo.**
  Achado importante: as Fases 1-4 já estavam prontas desde 27/08/2026 —
  a nota antiga deste arquivo (abaixo) tinha ficado desatualizada.
  Reconferido direto no Supabase de produção antes de confiar na memória
  (migrations aplicadas, functions com deploy real, 27 veículos ativos
  sem regressão). Só faltava a **Fase 5** (auditoria mensal da FIPE),
  implementada e testada nesta sessão: function
  `fipe-auditoria-modelo-versao` + cron dia 15 às 9h Brasília, avisa por
  WhatsApp sem nunca alterar `modelo_versao_excecoes` sozinha. Primeira
  auditoria real rodou: 19 marcas, 4630 modelos, ~90 candidatos (ruído
  conhecido: nomes de linha de acabamento tipo "Comfortline"/"Vision"
  passam no filtro por parecerem nome próprio — decisão consciente de
  não curar isso à mão, é julgamento que fica pra Adriana revisar no
  WhatsApp mensal). **Plano inteiro fechado, não reabrir — próximo passo
  é só esperar o aviso do dia 15 e decidir candidato por candidato, se
  quiser.**

Continuando de uma sessão anterior (04/09/2026, sessão 19 — sync de
vídeo do Drive corrigido na raiz, migrado pra Cloudflare Worker).
Leia primeiro MEMORY_WORK.MD, seção "Sessão 19", pro resumo completo.
Destaques:

- Causa raiz real do vídeo grande travando: Supabase Edge Function só
  tem 2s de CPU por chamada, o SDK da AWS estourava esse limite
  calculando checksum de vídeo de ~99MB. Corrigido movendo o
  download-do-Drive+upload-pro-R2 pra um Cloudflare Worker novo
  (`cloudflare/sync-drive-videos-worker/`), com 5 min de CPU e binding
  nativo do R2. A Edge Function `sync-drive-videos` virou só uma porta
  de entrada fina — nada mudou pro front-end.
- Testado ao vivo, resultado final: 15 de 15 pastas de vídeo válidas
  sincronizaram com sucesso (SYR9D60 de ~99,6MB que travava, TFF8I00
  depois de corrigir o nome da pasta, e o PYT5J89 que apareceu novo
  durante a sessão). 0 erros.
- **Incidente resolvido — não reconectar Git nesse Worker**: a Adriana
  conectou o Worker novo a um repositório Git no painel da Cloudflare
  ("Workers Builds"); o build automático do push seguinte sobrescreveu
  o código do Worker (usando a config do site por engano) e apagou os
  5 secrets. Corrigido (código restaurado, secrets recriados) e a
  Adriana já desconectou o Git no painel. Deploy desse Worker continua
  sendo só manual via `wrangler deploy --config`. Detalhe em
  `docs/google-drive-integracao.md`.
- Lição registrada: `wrangler deploy` sem `--config` explícito é
  arriscado neste repo (dois wrangler.toml/.jsonc diferentes) — sempre
  usar o caminho completo do arquivo certo.
- **Nova regra permanente**: sempre que a Adriana avisar que vai abrir
  um chat novo, antes de encerrar atualizar memória/documentação,
  conferir o que falta commitar, e deixar tudo pronto pra continuar sem
  perda de contexto — sem precisar ela pedir de novo.
- **Estado no fechamento**: tudo commitado e no `origin/main` (commits
  `68f123f` e `e59f7e7`). Nada pendente de autorização.

**Ainda pendente da sessão 18** (adiado pra depois do vídeo, ainda não
retomado): voltar nos ajustes das seções de IA do CRM — consolidar
Regras de IA + Automação, remover aba "Prompts" duplicada em
Configurações, corrigir toggles em Autonomia.

---

Continuando de uma sessão anterior (02-03/09/2026, sessão 18 —
mapeamento Webmotors/NaPista corrigido na raiz + descrição por
plataforma + 2 veículos travados resolvidos + auditoria de estoque).
Leia primeiro MEMORY_WORK.MD, seção "Sessão 18", pro resumo completo.
Destaques:

- Causa raiz real do Volvo XC60 publicado errado (XC40) na Webmotors
  corrigida (`match_wm_modelo` ignorando espaço) — testado ao vivo,
  reenviado em lote pra 19/21 veículos publicados.
- NaPista tinha causa raiz diferente (dois modelos "XC 60"/"XC60" no
  catálogo deles) — corrigido em `napista-sync-catalogo` e
  `napista-mapear-veiculo`, testado ao vivo.
- Webmotors passa a usar sempre o mesmo parágrafo institucional fixo
  (500 chars, decisão da Adriana); outras plataformas somam até 900
  chars (texto IA + rodapé). **Confirmação visual na página pública da
  Webmotors ainda pendente** — precisa reconferir se já apareceu.
- `GTN5D81` (RAM Rampage): trava de exclusão manual removida (sem
  motivo técnico documentado), ficou em revisão de modelo (Webmotors
  não tem "RAMPAGE" cadastrado) — não publicado ainda, como pedido.
- `QXH1J94` (Hilux SW4): causa raiz real era bug nosso (corrida entre
  2 tarefas fechando o anúncio sem recriar), não travamento da
  Webmotors — anúncio novo criado e confirmado.
- Auditoria completa do estoque em ML/NaPista: só 1 veículo sem
  publicação (Hyundai ix35 `MWV1232`, bug de `pending_update` sem
  post_id) — corrigido e publicado.
- **Achado, não corrigido ainda**: o gatilho que marca
  `pending_update` depois de editar um veículo não checa se já existe
  um id publicado — pode travar um veículo recém-cadastrado pra
  sempre (mesmo padrão em Webmotors e Mercado Livre). Vale corrigir o
  gatilho na raiz.

**Pedido pela Adriana no fim da sessão 18, ainda não iniciado**:
auditar por que o vídeo do cadastro do veículo (seção junto das fotos)
não está sincronizando — investigar e trazer o resultado antes de
corrigir qualquer coisa.

---

Continuando de uma sessão anterior (28-29/08/2026 — unificação de
regras de IA por botão + consolidação de telas). Leia primeiro:

**O que foi feito e testado (Fases 1 a 4, todas commitadas e
pushadas — `c2cf42e`, `0c7618c`, `e5f564c`):**

- **Fase 1**: tabela `ai_prompts_config` ganhou 3 colunas —
  `onde_fica`, `api_provider` (fixo: imagem sempre openai, texto/
  pesquisa sempre gemini — decisão da Adriana, sem seletor na tela),
  `formato_resposta` (parte técnica protegida, sempre visível mas não
  editável). 4 linhas novas criadas com o texto exato que já estava
  craveiro no código: `gerar_vaga_texto`, `gerar_resumo_vaga`,
  `gerar_imagem_vaga`, `gerar_imagem_generica`.
- **Fase 2**: "Gerar Descrição com IA" do veículo ganhou prompt
  dedicado (`vehicle_description`), separado do prompt genérico
  "Assistente Interno" que também servia SEO Copilot/Optimizer/
  Heading-draft. Novo branch `is_vehicle_description` em
  `gerar-conteudo/index.ts`, resposta simples (`texto_html`) em vez
  do esquema pesado de "seções de site". Texto institucional fixo
  (pedido dela) colado por CÓDIGO depois da resposta da IA (nova
  coluna `rodape_fixo`), nunca gerado pela IA — pra nunca sair
  parafraseado. Testado ao vivo no Honda Fit LX (PUQ3A75): antes
  cortava no meio da palavra "elétrica" em 1000 caracteres, depois
  saiu completo (971 chars, sem corte).
- **Fase 3**: os 4 botões da Fase 1 pararam de usar texto craveiro no
  código das edge functions e passaram a ler `prompt_text`/
  `formato_resposta` do banco (fallback pro texto antigo só se a
  linha sumir). Testado ao vivo cada um (vaga com cargo real
  "Vendedor de Veículos", resumo, imagem de vaga incluindo o branch
  de AJUSTE de imagem existente, otimização de foto de veículo).
  Depois de autocrítica pedida pela Adriana, 6 correções feitas:
  removido texto técnico ("Modelo: gpt-image-2...") que vazava pro
  prompt de imagem enviado à IA; 15 arquivos de teste apagados do
  bucket R2 de produção; confirmado que o teste do botão de ajuste de
  imagem não tinha chamado a API de verdade da primeira vez (erro de
  sequência no teste manual, não bug no código — refeito com sucesso
  real, 200 OK confirmado via rede); fallback testado trocando o slug
  temporariamente; pasta órfã `diag-temp-wm-publicar-3` (de outra
  sessão, vazia, não deployada) removida.
- **Fase 4**: `/admin/prompts-ia` reescrita como página única — 12
  regras realmente usadas hoje, cada uma com card próprio (regra
  editável + formato protegido visível + badge de API); avisos
  automáticos quando um botão é usado em mais de um lugar (ex: Gerar
  Imagem de Veículo/Blog) e quando o "Assistente Interno" serve de
  base pra outros botões; a Clara (SDR WhatsApp, prompt de 14.711
  caracteres) ganhou editor separado em modal de tela cheia com
  aviso de que atende clientes reais; os 5 slugs sem uso real
  (`negociacao`, `gerar_conteudo_social`, `gerar_conteudo`,
  `re_engagement`, `ai_sdr`) ficam numa seção "Sem uso hoje" à parte.
  Testado ao vivo: salvei uma regra de teste, confirmei no banco que
  gravou, usei "Restaurar Padrão", confirmei que voltou ao original.
  `bun run lint` e `bun run build` limpos.

**O que ficou em aberto (pedido mais recente dela — consolidar as
telas de IA em 1-2 páginas no máximo):**

- Achado importante: existem **4 superfícies de IA**, não 3 — além de
  `/admin/prompts-ia` e `/admin/autonomia`, tem `/admin/configuracoes`
  com DUAS abas relevantes: "Brain IA" (base de conhecimento +
  AI Playground) e **uma aba "Prompts" duplicada** (linhas 262 e 477
  de `Configuracoes.tsx`) editando a MESMA tabela `ai_prompts_config`
  de um jeito antigo/simples, sem nenhum dos avisos/cuidados da tela
  nova.
- Minha recomendação: **2 páginas** — "Regras de IA" (a atual,
  unindo com Brain IA, já que o conteúdo dela é injetado nos
  prompts) + "Automação" (ex-Autonomia, renomeada, mas só DEPOIS de
  corrigir os toggles enganosos — 5 dos 9 já fazem a coisa sempre,
  independente do toggle, e 4 não têm nenhum código por trás; achado
  de sessão anterior à unificação, ainda não corrigido).
- A Adriana pediu 3 verificações antes de decidir a ordem — **2
  resolvidas, 1 bloqueada**:
  - ✅ Permissão: `/admin/configuracoes`, `/admin/prompts-ia` e
    `/admin/autonomia` exigem exatamente o mesmo setor
    ("Desenvolvedor e TI", `src/lib/setor-acesso.ts`) — remover a
    duplicata não tira acesso de ninguém.
  - ✅ Referências: só o próprio `Configuracoes.tsx` referencia a
    aba "prompts"; nenhum artigo da Central de Ajuda (`ajuda_conteudos`)
    menciona essa aba especificamente. Achado à parte: o doc técnico
    `docs/admin-ia-conteudo.md` está desatualizado desde 18/08 (não
    reflete nada das Fases 1-4) e revelou que a function `ai-assistant`
    (usada pela Central de Ajuda pública e pelo onboarding do site,
    não só pelo AI Playground) lê o MESMO slug `ai_assistant` já
    documentado na tela nova — ou seja, **o aviso de "efeito
    cascata" que a tela mostra hoje está incompleto**: só menciona
    SEO Copilot/Optimizer/Heading-draft, mas o alcance real inclui
    também a Central de Ajuda pública e o onboarding. Isso precisa
    ser corrigido no texto do card `ai_assistant` em `PromptsIA.tsx`.
  - ❌ Teste ao vivo: **bloqueado** — a extensão do Chrome desconectou
    no meio da sessão e não reconectou. Nunca cheguei a abrir
    `/admin/configuracoes` no navegador pra confirmar visualmente a
    aba duplicada antes de recomendar removê-la. **Primeiro passo da
    próxima sessão**: tentar reconectar a extensão e fazer esse teste
    antes de mexer em qualquer coisa.
- Depois do teste ao vivo confirmado, ordem sugerida: (1) apagar a
  aba duplicada de Configurações — baixo risco; (2) mover Brain IA
  pra dentro de "Regras de IA" — risco médio, é refatoração de
  componente; (3) corrigir os toggles de Autonomia — mais delicado,
  precisa decisão dela sobre cada um dos 9.
- **Fase 6, ainda não iniciada**: decidir o destino dos 5 slugs "sem
  uso hoje" — excluir de vez ou reconectar a algum código real.
- **Doc técnico a atualizar**: `docs/admin-ia-conteudo.md` não reflete
  nada desta sessão (Fases 1-4, achado da aba duplicada, achado do
  alcance real de `ai_assistant`). Vale atualizar como fonte de
  referência técnica, seguindo o padrão de "becos sem saída" já usado
  nesse arquivo.

Continuando de uma sessão anterior (27/08/2026, sessão 16 — áudio da
Clara + plano de corte Modelo/Versão). Leia primeiro:
- MEMORY_WORK.MD, seção "Sessão 16": áudio da Clara publicado e testado
  (ElevenLabs + Gemini + dedup de webhook duplicado da Meta) + toda a
  investigação de por que Modelo/Versão duplicam no cadastro (origem
  real: texto de ajuda do formulário, não bug de sincronização) + plano
  completo de 17 passos pra separar Modelo de Versão, validado com dados
  reais (auditoria completa da FIPE, simulação nos 26 veículos ativos,
  teste ao vivo confirmando que NaPista/Webmotors não quebram).
  **NADA desse plano foi implementado ainda** — toda decisão de escopo
  já foi tomada pela Adriana (lista de exceção fechada, busca versão
  completa com correção de acento, migração em 2 lotes com backup). Só
  falta ela dizer "autorizo" pra eu começar pela Fase 1 (tabela de
  exceções + função de corte + teste a seco — risco zero, não mexe em
  nada que já existe). Se ela já tiver decidido, começar direto por ali,
  sem reabrir nenhuma das perguntas já respondidas (listadas na seção
  "Sessão 16" com a palavra "Decisão da Adriana").

Continuando de uma sessão anterior (24/08/2026, sessão 14 — Clara/SDR e
tokens Meta). Leia primeiro:
- MEMORY_WORK.MD, seção "Sessão 14": diagnóstico de conversão da Clara
  (padrão robótico, zero funil funcionando) + plano A-F implementado e
  publicado (regra de prioridade pra pergunta direta, forma de pagamento
  qualificada, trava de temperatura, trava anti-duplicidade, contador de
  convite único, encaminhamento humano com critério explícito,
  reengajamento morno/quente 48h). Achado grande: template
  `reengajamento_frio` usado pelo `re-engagement-cron` NUNCA existiu de
  verdade na Meta — função rodava há semanas só gerando erro silencioso,
  zero mensagem de reengajamento saiu. Pausado no código (flag
  `REENGAJAMENTO_PAUSADO`) até aprovação. Dois templates novos
  (`reengajamento_quente`, `reengajamento_pos_visita`) já submetidos à
  Meta, status PENDING em 24/08. Descoberto de brinde: `lembrete_agendamento`
  (lembrete de visita, 2 variáveis) e `agendamento_reagendar` (na real é
  follow-up de no-show, apesar do nome) já tinham função pronta desde
  13/08 (`lembrete-agendamento-cron`, `agendamento-no-show-cron`),
  publicadas e agendadas via pg_cron — mas voltavam 401 sempre, porque
  publicadas com `verify_jwt: true` (cron não manda JWT, só o segredo
  interno). Corrigido pra `false` e testado de verdade (HTTP 200 via
  `net.http_post` manual) — rodam de hora em hora desde 24/08/2026. Não
  precisou construir nada do zero, só corrigir essa flag.
  `WHATSAPP_TOKEN` novo confirmado com permissão
  `whatsapp_business_management` funcionando (testado via function
  temporária, já apagada).

Continuando de uma sessão anterior (23-24/08/2026, sessão 13). Leia primeiro:
- MEMORY_WORK.MD deste projeto (15 seções "Sessão 13" no topo: "Gerar com
  IA" da vaga agora pesquisa de verdade no Google + gera SEO/JobPosting
  (achado: search + JSON estrito do Gemini não funcionam juntos, testado
  antes de usar); texto do post diferente por rede (Instagram não deixa
  link clicável, ganhou CTA com WhatsApp) + confirmação real do markdown
  em produção (criei e
  apaguei vaga de teste no site real); editor de texto reescrito de
  contentEditable pra markdown depois de achar bug real de perda de
  dados — testado ao vivo de verdade dessa vez; teste
  real de publicação da vaga SDR — Instagram funcionou, achado bug real no
  token do Facebook (publish_actions descontinuada); editor de
  texto na descrição + resumo automático pra redes sociais (limite de
  caracteres) + CTA com link + imagem cortada corrigida + layout com
  formulário à direita; logo só em fundo branco + texto da vaga escrito
  de verdade no cartão + ajuste sempre visível; achado de que a geração de
  imagem de vaga demorava 45-90s sem avisar e por isso "sumia" da tela;
  padrão único de imagem de vaga com 2 pessoas + 2 opções pra escolher;
  gpt-image-2 em todo o sistema + rotina mensal de checar modelos novos;
  modelo gpt-image-2 + fidelidade da logo na imagem da vaga; página
  dedicada por vaga + formulário vinculado; regras da Clara sincronizadas
  + confirmação de envio de foto de veículo; imagens no chat da Clara
  corrigidas — recepção e envio; menu lateral reorganizado por setor +
  fix do item faltando na tela de permissões; usuário Roberto Junior
  resolvido)

- docs/leads-e-sdr.md — detalhe técnico completo do fix de imagem no
  chat da Clara (seção "Fatos confirmados")
- docs/clara-prompt.md — prompt da Clara, agora sincronizado com o que
  está em produção (tinha ficado desatualizado desde 19/08)
- docs/linkedin-integracao.md — conexão OAuth, pivô de escopo (member
  vs organização) e o que muda no código quando a LinkedIn aprovar o
  Community Management API

## Lembrete agendado (recorrente, mensal) — não precisa fazer nada até lá
Rotina mensal `trig_01Ngz5GoZGfEPrxrSCj36ztp` roda todo dia 1º às 9h
(Brasília), verifica se saiu modelo de IA mais novo que o gpt-image-2
(OpenAI) ou a família Gemini atual (texto), e só avisa a Adriana se tiver
novidade oficial de verdade. Não precisa lembrar ela nem checar
manualmente — a rotina mesma avisa quando tiver algo.

## Lembrete agendado — não precisa fazer nada até lá
Rotina cloud `trig_01TXYbwdUr6yMcRnMMrwBJxq` dispara em **26/08/2026 09h**
avisando a Adriana pra checar se a LinkedIn aprovou o "Request Access" do
"Community Management API" (feito em 21/08/2026). Se ela mencionar que já
foi aprovado antes disso, pular direto pro item 1 de "Precisa de decisão".

## Precisa de decisão/ação da Adriana

**Lista triada em 15/09/2026** (sessão 22) — reconferido status real de
cada item antes de manter na lista. 5 itens antigos removidos por estarem
resolvidos ou obsoletos (ver `MEMORY_WORK.MD`, sessão 22, se quiser o
histórico de por que saíram: H6 placa SGI9C15 publicado sem erro agora,
vaga "Consultor(a) de Consórcios" não existe mais, Canva MCP conectado,
botão "Gerar com IA" já testado em sessão posterior, travas de conversa da
Clara rodando 3 semanas em produção sem incidente). Não reabrir esses 5.

1. **RAM Rampage (placa da unidade `7c3a8c92-9f20-4c70-aec0-
   e628b86b875f`) com anúncio desatualizado na Webmotors** — ainda em
   estoque, km/revisão/IPVA do anúncio real não batem com o cadastro
   atual, mapeamento sem código salvo. Precisa a Adriana autorizar
   remapear + forçar resync pra esse veículo específico.
2. **Reativar `re-engagement-cron` quando a Meta aprovar os templates
   novos** (`reengajamento_quente`/`reengajamento_pos_visita`, PENDING
   desde 24/08) — **reconfirmado ainda pausado em 15/09**. Quando aprovar:
   trocar `REENGAJAMENTO_PAUSADO` pra `false` em
   `supabase/functions/re-engagement-cron/index.ts` e trocar o nome do
   template hardcoded (`reengajamento_frio`, que não existe) pelo nome
   aprovado de verdade.
3. **WhatsApp — publicação de post ainda não implementada**: **(a) e (b)
   resolvidas em 15/09** — 3 templates de negócio aprovados existem de
   verdade, e `sync-whatsapp-templates` já sincroniza (usado também pelo
   chat individual, ver "Sessão 22 continuação 7"). Falta só **(c) conectar
   `publicar-social` ao `send-whatsapp`** pra publicação em massa/post via
   WhatsApp — isso é diferente do envio individual no chat, que já
   funciona. Não mexer até a Adriana pedir esse recurso especificamente.
3b. **Template de teste pendente na conta real da Meta**
   (`teste_claude_apagar`, categoria Utility, criado 15/09 pra testar a
   Etapa 3 de templates) — a Adriana ainda não disse se prefere deixar a
   Meta rejeitar sozinho (sem uso real, deve cair natural) ou apagar ela
   mesma no WhatsApp Manager. Não é urgente, só pra não deixar acumular teste.
4. **Quando a LinkedIn aprovar o Community Management API**: mudar o
   escopo OAuth pra incluir `w_organization_social`, reescrever a busca de
   organização em `linkedin-oauth-callback` (usar `/rest/organizationAcls`,
   não `/v2/userinfo`), trocar o `author_urn` usado em `publicar-social`
   pela URN da organização. Passo a passo em `docs/linkedin-integracao.md`,
   seção "Quando for aprovado". Não mexer até ela confirmar a aprovação.
5. **Triagem de candidatos do LinkedIn Hiring (22/08/2026)** — mais de 3
   semanas paradas (Kathyuça Melo e Larissa Felix, topo do ranking em
   `MEMORY_WORK.MD` sessão 12), provavelmente obsoleto por tempo — fica a
   critério da Adriana se ainda quer contatar ou se descarta.
6. **Facebook Stories** — decisão dela (20/08) foi tratar como etapa
   separada do Instagram Stories (já no ar). Só mexer se ela pedir
   explicitamente.
7. **Automações de e-mail de nutrição de lead** — precisa de decisão de
   escopo (o que dispara o e-mail, frequência) e da chave de API do Brevo
   (nada configurado ainda, sem conector oficial).
8. **Confirmar se já trocou o `client_secret` do app Meta** ("APP CARRO
   E CIA") colado em texto puro no chat em 16/08/2026 — ainda não
   confirmado (developers.facebook.com/apps/1369928368361968/settings/basic/).
9. **PDF de contrato/proposta sem placeholder de Versão** (achado sessão
   16) — sem impacto real hoje (nenhum modelo salvo usa isso ainda),
   combinado que fica pra depois do plano de corte Modelo/Versão.

## Conferir, sem precisar perguntar
- **Push em dia**: confira `git log -1` — todo commit de 23/08 foi
  pushado no mesmo bloco de autorização, sem exceção.
- **Auditoria mensal FIPE (Fase 5, 09/09/2026)**: cron
  `fipe-auditoria-modelo-versao-cron-job` roda todo dia 15 às 12h UTC
  (~9h Brasília) sozinho — não precisa fazer nada até lá. Se a Adriana
  perguntar por que recebeu um WhatsApp de "Auditoria mensal FIPE", é
  isso, é normal e mensal. Resultado completo sempre em
  `fipe_auditoria_modelo_versao_runs` (Supabase) se precisar olhar mais
  fundo que a mensagem manda.
- **Página dedicada por vaga no ar** (23/08) — `/vagas/:id` (aceita id ou
  slug) mostra imagem + descrição completa + formulário já vinculado à
  vaga. Testado ao vivo no navegador (localhost), sem erro. IA de imagem
  da vaga já era `gpt-image-1` da OpenAI em 1024x1024 (formato seguro pra
  Instagram/Facebook/LinkedIn) — não precisou trocar nada, só confirmado.
  Não reabrir a pergunta "qual IA gera a imagem" — já é a atual.
- **Menu lateral reorganizado por setor** (23/08) — "Menu Principal" virou
  submenus colapsáveis (Vendas, Estoque/Portais, Financiamentos,
  Financeiro/Administrativo, Marketing, Institucional); abre sozinho o
  grupo da rota atual. Junto, corrigido `/admin/ml-diagnosis` faltando no
  mapa `ROTA_SETORES` (sumia da tela de permissões E ficava liberado geral
  pra qualquer login — rota irmã de `/admin/portais`, não sub-rota, não
  batia no match por prefixo). **Não testado logado** (sem credencial
  nesta sessão) — só confirmado que carrega sem erro até a tela de login.
  Se a Adriana comentar algo estranho no menu, é primeiro lugar a olhar;
  não reabrir a investigação do ml-diagnosis do zero, já está documentado
  aqui e em `src/lib/setor-acesso.ts`.
- **Imagens no chat da Clara corrigidas e testadas** (23/08): cliente
  mandando foto pro WhatsApp agora funciona de verdade (antes virava
  mensagem vazia e a Clara nunca respondia — 52 casos reais confirmados
  no banco antes da correção). Painel também ganhou botão de anexo pra
  atendente humano mandar foto. Não reabrir essa investigação — se
  aparecer relato de imagem que não chegou, é caso novo (ex.: falha
  pontual de download da Graph API), não regressão do que foi corrigido.
  Detalhe em `docs/leads-e-sdr.md`.
- **Clara já manda foto/vídeo de veículo sozinha** — ferramenta
  `enviar_midia_veiculo`, confirmado em 23/08 que já funciona e é usada
  por decisão própria da IA (não precisa o cliente pedir).
- **Usuário Roberto Junior resolvido** (23/08) — o problema real era um
  cadastro que travou no meio (login existia, perfil não). Completado e
  senha nova definida. **Achado à parte, sem ação pendente**: existia uma
  conta Roberto ANTIGA (`roberto@carroecia.com`, domínio antigo) que foi
  apagada de verdade em algum momento do histórico, sem nenhum rastro de
  quem/quando — não existe tabela de auditoria de usuários no projeto.
  Não é mais um problema (a conta atual, `@carroeciamotors.com.br`, está
  funcionando), só fica registrado como achado.
- **`docs/clara-prompt.md` sincronizado com produção** (23/08) — estava
  desatualizado desde 19/08 (faltava a seção "Qualificação do Lead").
  Reforçar esse hábito sempre que `ai_prompts_config` for editado de novo.
- **LinkedIn publicando como membro pessoal, testado ao vivo** (21/08):
  post de teste real publicado e confirmado (`urn:li:share:...`), depois
  apagado via API (DELETE, 204) — não sobrou rastro. Não confunde com
  publicar na página da empresa, que ainda não existe (ver acima).
- **Instagram Stories no ar e testado ao vivo de verdade** (20/08):
  primeira tentativa deu "sucesso falso" do próprio Meta (media_id
  retornado, mas Story não existia — corrigido fazendo Stories esperar
  o processamento terminar, igual vídeo já esperava). Segunda tentativa
  confirmou via `GET /{ig-id}/stories`, não só pelo status no banco.
  Não reabrir essa investigação — se aparecer relato de Story que não
  publicou, é caso novo, não regressão do que foi corrigido.
- **Tela "Redes Sociais" de dentro de Marketing.tsx removida** (20/08)
  — era duplicata da Central de Redes Sociais desde 14/08. Marketing.tsx
  agora só tem WhatsApp e Analytics.
- **Webmotors — 4 veículos limpos da fila** (20/08, cota estourada desde
  13/08) e **2 veículos excluídos permanentemente** (Hilux `PYT5J89`,
  RAM Rampage `GTN5D81`, pedido direto da Adriana) — não reabrir sem
  ela pedir. Regra nova em `wm-sync` limpa a fila sozinha da próxima vez.
- Meta Ads MCP **resolvido em 16/08/2026** — não reinvestigar.
- **NaPista — produção liberada, 25/25 veículos publicados** desde
  18/08/2026. **Documentação de API — CONCLUÍDA** (18/08/2026). Nenhum
  dos dois é mais item em aberto.
- Regra em vigor (pedido direto da Adriana): sempre que eu aplicar uma
  mudança autorizada, perguntar se ela quer que eu já commite e dê push
  em seguida — não deixar acumular.
- Regra em vigor (17/08/2026): ao fechar qualquer tarefa que tocar o
  painel admin, checar `docs/manual-operacional-contexto.md` e já
  escrever o artigo que faltar relacionado à mudança.

## Deploy — como funciona
- **Frontend**: automático via Cloudflare Workers Builds a cada push
  pro `main`. Não rodar `wrangler deploy` manual por rotina.
- **Edge Functions**: **não é automático** — precisa `supabase
  functions deploy <nome>` manual depois do push. Toda function tocada
  numa sessão precisa desse passo antes de considerar a mudança "no ar".

## Segurança — não esquecer
- **Achado 12/09/2026**: a ferramenta `execute_sql` (MCP Supabase) roda em
  transação **só leitura** nesta sessão — `DELETE`/`UPDATE`/`INSERT` dão
  erro `cannot execute DELETE in a read-only transaction`. Pra apagar/
  alterar dado direto, ou pedir pra Adriana fazer no painel (mais rápido
  pra 1 registro), ou criar uma migration formal (`supabase db push`) —
  não adianta insistir em `execute_sql` achando que é erro de sintaxe.
- **Achado 12/09/2026**: o classificador de segurança do Claude Code
  bloqueia edição que adiciona mutação financeira direta (orçamento/status
  de campanha) sem aprovação humana, mesmo espelhando um padrão que já
  existe em produção pra outra plataforma (aconteceu tentando dar ao
  Google Ads a mesma execução direta que a Meta já tinha). Não é bug —
  não insistir tentando reformular a mesma mudança; a alternativa segura
  é cair numa fila de aprovação existente, como foi feito pro Google em
  `docs/marketing-whatsapp-comandos.md`.
- Nunca usar `execute_sql` direto pra mudança de **schema/cron** —
  sempre via migration. Mudança de **dado** (update/delete/insert em
  linha existente) pode ser direto, com cautela, a pedido explícito —
  foi assim que o perfil do Roberto foi completado em 23/08 (senha via
  `auth.admin.updateUserById` numa function temporária, nunca em
  arquivo versionado). **Atualizado 12/09/2026**: isso vale quando a
  ferramenta disponível permite escrita — nesta sessão o acesso ao banco
  era só leitura (ver achado acima).
- Nunca escrever senha/segredo em texto plano numa migration.
- Antes de propor mudança em produção, autocrítica proativa própria
  ("o que um especialista atacaria nisso?") sem esperar ser perguntado.
- Ao criar function de diagnóstico temporária (ex.: checar permissão de
  token direto numa API externa, ou completar um cadastro), sempre
  remover a function E a entrada em `config.toml` depois de usar.
- Senha da conta kmzero (Webmotors) continua exposta numa migration
  antiga — decisão da Adriana foi não mexer. (A senha do Roberto que
  estava na mesma migration não é mais um risco — a conta que ela
  pertencia foi apagada, ver "Conferir" acima.)

## Não repetir do zero
- **O webhook que a Meta de fato chama pra mensagem de WhatsApp é
  `supabase/functions/receive-leads/index.ts`** (confirmado 12/09/2026,
  via `meta_webhook_logs` + criação real de lead). `whatsapp-webhook.ts` e
  `webhook-portais.ts` também têm código pra `whatsapp_business_account`
  mas não recebem tráfego real — parecem duplicata morta de uma versão
  anterior do sistema, ainda não apagados (decisão de apagar é da
  Adriana). Qualquer mudança de comportamento em mensagem recebida de
  WhatsApp (comando admin, atendimento da Clara, etc.) precisa ir em
  `receive-leads`, não nos outros dois — não reinvestigar isso do zero.
- A investigação de integridade de migrations (16/08) já está
  documentada — não reinvestigar.
- A causa raiz do mapeamento incompleto da Webmotors (cor/câmbio/
  combustível nunca gravados por `wm-confirmar-mapeamento`) já foi
  corrigida e testada ao vivo em 20/08.
- O pivô de escopo do LinkedIn (member vs organização) já foi
  investigado a fundo com a doc oficial — não repetir essa pesquisa,
  só consultar `docs/linkedin-integracao.md`.
- O bug de imagem/áudio sumindo em silêncio no chat da Clara (causa
  raiz: `receive-leads` só lia `msg.text?.body`) já foi achado,
  corrigido e testado — não reinvestigar do zero, só consultar
  `docs/leads-e-sdr.md`.
- **Cliques por coordenada de screenshot no navegador de teste erram o
  alvo** (achado 24/08/2026): a ferramenta de automação tira screenshot
  numa resolução diferente do tamanho real da página (devicePixelRatio ≠
  1 nesta máquina) — clicar em pixel do screenshot é impreciso e pode
  achar "bugs" fantasmas. Pra testar interação de verdade (digitar,
  clicar botão, selecionar texto), usar `javascript_tool` com
  `getBoundingClientRect()` pra achar a posição real, ou melhor,
  disparar os eventos direto via JS (`element.focus()`,
  `element.dispatchEvent(...)`, `botao.click()`) em vez de clique por
  coordenada. Não repetir esse fio de investigação do zero.
- **Como testar publicação real no Facebook/Instagram sem precisar do
  login da Adriana** (achado 24/08/2026): o cron `publicar-social-cron-job`
  chama a function via `net.http_post` direto no Postgres, pegando o
  segredo sozinho com `public.get_internal_service_secret()`. Dá pra
  disparar a mesma chamada manualmente por SQL (`execute_sql`) pra testar
  publicação de verdade na hora, sem esperar os 15 min do cron e sem
  precisar saber o valor do segredo. Não reinvestigar esse método do
  zero — só repetir o `SELECT net.http_post(...)` com a mesma URL/headers
  do `cron.job` (`select command from cron.job where jobname =
  'publicar-social-cron-job'` pra conferir o comando exato).
```

Depois de usar, atualize este arquivo antes de fechar a sessão (regra no
`CLAUDE.md`) — não precisa apagar, só manter em dia.
