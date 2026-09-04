# Prompt pra próxima sessão

Copie e cole como primeira mensagem numa sessão nova do Claude Code.

```
Projeto: Carro e Cia Veículos (revenda). Pasta de trabalho:
C:\Projeto\Revenda Carro e Cia\carro-e-cia-ve-culos-2fqheuud8

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
- Testado ao vivo: 13 de 14 vídeos sincronizaram com sucesso (inclusive
  o SYR9D60 de ~99,6MB que travava). 1 pendência: pasta "TFF8IOO" no
  Drive tem erro de digitação (placa real é TFF8I00, com zero) —
  renomear a pasta resolve.
- **Confirmar antes de qualquer `git push`**: a Adriana conectou o
  Worker novo a um repositório Git no painel da Cloudflare ("Workers
  Builds") — ainda não confirmamos se o diretório raiz do build está
  certo (`cloudflare/sync-drive-videos-worker`, não a raiz do repo, que
  é o Worker do site). Checar nas configurações de Build do Worker no
  painel da Cloudflare antes do próximo push.
- Lição registrada: `wrangler deploy` sem `--config` explícito é
  arriscado neste repo (dois wrangler.toml/.jsonc diferentes) — sempre
  usar o caminho completo do arquivo certo.
- **Nova regra permanente**: sempre que a Adriana avisar que vai abrir
  um chat novo, antes de encerrar atualizar memória/documentação,
  conferir o que falta commitar, e deixar tudo pronto pra continuar sem
  perda de contexto — sem precisar ela pedir de novo.

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
-3. **Consolidação das telas de IA (sessão de 28-29/08/2026)**: extensão
   do Chrome desconectada, teste ao vivo da aba duplicada em
   `/admin/configuracoes` ficou pendente. Reconectar e testar antes de
   decidir a ordem de execução (apagar duplicata → mover Brain IA →
   corrigir toggles de Autonomia). Ver bloco completo no topo deste
   arquivo. Não redesenhar a análise do zero — já está pronta.
-2. **Plano de corte Modelo/Versão (17 passos, sessão 16)**: pronto,
   todas as decisões de escopo já tomadas — só falta o "autorizo" pra
   começar pela Fase 1. Ver MEMORY_WORK.MD seção "Sessão 16" pro plano
   completo. Não redesenhar do zero nem reabrir as perguntas já
   respondidas.
-1.5. **H6 19 (o que NÃO é o de placa SIQ-5H93)**: não consegue ser
   publicado na Webmotors em nenhuma modalidade hoje — VIP é rejeitado
   por um motivo do lado da própria Webmotors (testado isolando a
   variável, confirmado ao vivo), Básica aceitaria mas não tem vaga
   livre. Precisa a Adriana escolher entre abrir chamado no suporte da
   Webmotors ou liberar 1 vaga Básica despublicando outro veículo. Não
   reabrir a investigação — causa já isolada e documentada.
-1.4. **RAM Rampage (placa da unidade `7c3a8c92-9f20-4c70-aec0-
   e628b86b875f`) com anúncio desatualizado na Webmotors**: km, "revisões
   pela concessionária" e IPVA pago no anúncio real batem com o cadastro
   antigo, não com o atual (achado comparando o anúncio ao vivo com o
   banco) — o mapeamento desse veículo também está sem nenhum código
   salvo (versão/cor/câmbio/combustível), então nenhuma atualização
   automática vai sair até alguém rodar o mapeamento de novo. Precisa a
   Adriana autorizar remapear + forçar um resync pra esse veículo
   específico.
-1.3. **PDF de contrato/proposta sem placeholder de Versão** (achado
   sessão 16): a tela de editar modelo já mostra `{{versao}}` como
   disponível, mas o motor de gerar PDF não lê esse dado — hoje sem
   impacto real (nenhum modelo salvo usa isso ainda), mas combinado que
   fica pra depois do plano de corte Modelo/Versão, não antes.
-1. **Reativar `re-engagement-cron` quando a Meta aprovar os templates
   novos** (24/08/2026) — `reengajamento_quente` e `reengajamento_pos_visita`
   estão PENDING. Quando aprovar: trocar `REENGAJAMENTO_PAUSADO` pra
   `false` em `supabase/functions/re-engagement-cron/index.ts` e trocar o
   nome do template hardcoded (`reengajamento_frio`, que não existe) pelo
   nome aprovado de verdade — hoje a função só tem 1 template usado pros
   2 públicos (frio e morno/quente), pode fazer sentido usar
   `reengajamento_quente` só pro público morno/quente e manter frio à
   parte, decisão dela quando aprovar.
-0.5. **Testar em conversa real** as travas publicadas em 24/08 (C, D, E,
   regra de prioridade do A, forma de pagamento do B, critério de
   encaminhamento humano) — só revisão de código até agora, não
   observado em atendimento de cliente de verdade ainda.
0. **Testar o botão "Gerar com IA" de verdade no painel** (24/08/2026) —
   a lógica foi testada por fora (function de diagnóstico), mas o botão
   em si dentro do formulário de Vagas ainda não foi clicado por ninguém.
   Abra Vagas → Nova Vaga → digite só um cargo (ex: "Consultor(a) de
   Financiamentos") → Gerar com IA → espere uns 20-40s (agora pesquisa de
   verdade, é mais lento que antes) → confira se veio título, descrição
   formatada (títulos/listas) e palavras-chave preenchidas.
1. **Facebook não publica mais — token com permissão descontinuada**
   (achado 24/08/2026, testando a publicação real da vaga SDR): toda
   publicação no Facebook via `publicar-social` falha com "(#200) The
   permission(s) publish_actions are not available. It has been
   deprecated." — confirmei que já estava falhando desde pelo menos
   19h15 de 23/08 (não é bug de hoje, é achado novo). **Afeta qualquer
   post no Facebook, não só vaga** — o Instagram continua funcionando
   normal. Precisa reconectar/gerar de novo o token de acesso da Página
   do Facebook (`META_PAGE_ACCESS_TOKEN`) com a permissão atual
   (`pages_manage_posts` ou equivalente) no Meta Business Suite — não é
   algo que dá pra resolver só no código, precisa da Adriana (ou de quem
   administra a Página) gerando o token novo.
   — **Já testado e confirmado funcionando** (24/08/2026, publicação
   real): resumo automático da vaga (limite de caracteres) + Instagram —
   publiquei de verdade a vaga SDR no Instagram como teste (post real,
   ficou no ar a pedido dela). Logo em fundo branco + texto do cargo
   escrito na imagem, e imagem sem corte na página pública — tudo
   confirmado com a vaga SDR real. Não precisa retestar nenhum desses.
2. **Regenerar a imagem do "Consultor(a) de Consórcios"**: essa vaga saiu
   com um logo inventado (não é o oficial). Já corrigido o prompt + trocado
   pro modelo `gpt-image-2` (23/08) — só falta ela entrar em Vagas → editar
   essa vaga → "Gerar do zero de novo" pra sair certo. Não é um bug
   pendente de código, só uma ação manual que precisa do login dela.
3. **Triagem de candidatos do LinkedIn Hiring (22/08/2026)**: perguntei se
   ela quer que eu já mande mensagem pra alguma candidata recomendada
   (Kathyuça Melo e Larissa Felix, no topo do ranking) — sem resposta
   ainda. Ver ranking completo em `MEMORY_WORK.MD`, seção "Sessão 12".
4. **Quando a LinkedIn aprovar o Community Management API**: mudar o
   escopo OAuth pra incluir `w_organization_social`, reescrever a busca de
   organização em `linkedin-oauth-callback` (usar `/rest/organizationAcls`,
   não `/v2/userinfo` — são permissões diferentes), e trocar o `author_urn`
   usado em `publicar-social` pela URN da organização quando publicar como
   página. Passo a passo completo em `docs/linkedin-integracao.md`, seção
   "Quando for aprovado". Não mexer nisso até ela confirmar a aprovação.
5. **LinkedIn e WhatsApp — WhatsApp ainda não implementado**: LinkedIn já
   funciona (membro pessoal). WhatsApp: ela decidiu que "publicar" significa
   mandar o post como mensagem de template (não Status, não Canal — ver
   `docs/meta-integracao.md` pro porquê). Falta: (a) ela aprovar pelo menos
   1 template no WhatsApp Manager da Meta, (b) eu criar uma function de
   sincronização de templates aprovados (não existe nenhuma hoje — a
   tabela `whatsapp_templates` está vazia), (c) conectar `publicar-social`
   ao `send-whatsapp` (que já sabe mandar template). Não implementado
   ainda, esperando ela aprovar o template primeiro.
6. **Facebook Stories** — decisão dela em 20/08 foi tratar como etapa
   separada do Instagram Stories (já no ar). Usa endpoint diferente
   (`/photo_stories`/`/video_stories`) e a permissão do app pra isso
   ainda não foi confirmada. Só mexer se ela pedir explicitamente.
7. **Automações de e-mail de nutrição de lead** — único item do
   backlog de 17/08 que ainda não foi implementado. Precisa de decisão
   de escopo (o que dispara o e-mail, frequência) e da chave de API do
   Brevo (nada configurado ainda, sem conector oficial).
8. Rodar `claude mcp list` — conferir se o Canva aparece conectado. Se
   ainda "Needs authentication", pedir pra ela rodar /mcp e autenticar.
9. Confirmar se ela já trocou o `client_secret` do app Meta ("APP
   CARRO E CIA") que foi colado em texto puro no chat em 16/08/2026 —
   ainda não confirmado (developers.facebook.com/apps/1369928368361968/
   settings/basic/).

## Conferir, sem precisar perguntar
- **Push em dia**: confira `git log -1` — todo commit de 23/08 foi
  pushado no mesmo bloco de autorização, sem exceção.
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
- Nunca usar `execute_sql` direto pra mudança de **schema/cron** —
  sempre via migration. Mudança de **dado** (update/delete/insert em
  linha existente) pode ser direto, com cautela, a pedido explícito —
  foi assim que o perfil do Roberto foi completado em 23/08 (senha via
  `auth.admin.updateUserById` numa function temporária, nunca em
  arquivo versionado).
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
