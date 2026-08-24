# Prompt pra próxima sessão

Copie e cole como primeira mensagem numa sessão nova do Claude Code.

```
Continuando de uma sessão anterior (23-24/08/2026, sessão 13). Leia primeiro:
- MEMORY_WORK.MD deste projeto (13 seções "Sessão 13" no topo: editor de
  texto reescrito de contentEditable pra markdown depois de achar bug
  real de perda de dados — testado ao vivo de verdade dessa vez; teste
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
0. **Facebook não publica mais — token com permissão descontinuada**
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
1. **Regenerar a imagem do "Consultor(a) de Consórcios"**: essa vaga saiu
   com um logo inventado (não é o oficial). Já corrigido o prompt + trocado
   pro modelo `gpt-image-2` (23/08) — só falta ela entrar em Vagas → editar
   essa vaga → "Gerar do zero de novo" pra sair certo. Não é um bug
   pendente de código, só uma ação manual que precisa do login dela.
2. **Triagem de candidatos do LinkedIn Hiring (22/08/2026)**: perguntei se
   ela quer que eu já mande mensagem pra alguma candidata recomendada
   (Kathyuça Melo e Larissa Felix, no topo do ranking) — sem resposta
   ainda. Ver ranking completo em `MEMORY_WORK.MD`, seção "Sessão 12".
3. **Quando a LinkedIn aprovar o Community Management API**: mudar o
   escopo OAuth pra incluir `w_organization_social`, reescrever a busca de
   organização em `linkedin-oauth-callback` (usar `/rest/organizationAcls`,
   não `/v2/userinfo` — são permissões diferentes), e trocar o `author_urn`
   usado em `publicar-social` pela URN da organização quando publicar como
   página. Passo a passo completo em `docs/linkedin-integracao.md`, seção
   "Quando for aprovado". Não mexer nisso até ela confirmar a aprovação.
4. **LinkedIn e WhatsApp — WhatsApp ainda não implementado**: LinkedIn já
   funciona (membro pessoal). WhatsApp: ela decidiu que "publicar" significa
   mandar o post como mensagem de template (não Status, não Canal — ver
   `docs/meta-integracao.md` pro porquê). Falta: (a) ela aprovar pelo menos
   1 template no WhatsApp Manager da Meta, (b) eu criar uma function de
   sincronização de templates aprovados (não existe nenhuma hoje — a
   tabela `whatsapp_templates` está vazia), (c) conectar `publicar-social`
   ao `send-whatsapp` (que já sabe mandar template). Não implementado
   ainda, esperando ela aprovar o template primeiro.
5. **Facebook Stories** — decisão dela em 20/08 foi tratar como etapa
   separada do Instagram Stories (já no ar). Usa endpoint diferente
   (`/photo_stories`/`/video_stories`) e a permissão do app pra isso
   ainda não foi confirmada. Só mexer se ela pedir explicitamente.
6. **Automações de e-mail de nutrição de lead** — único item do
   backlog de 17/08 que ainda não foi implementado. Precisa de decisão
   de escopo (o que dispara o e-mail, frequência) e da chave de API do
   Brevo (nada configurado ainda, sem conector oficial).
7. Rodar `claude mcp list` — conferir se o Canva aparece conectado. Se
   ainda "Needs authentication", pedir pra ela rodar /mcp e autenticar.
8. Confirmar se ela já trocou o `client_secret` do app Meta ("APP
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
