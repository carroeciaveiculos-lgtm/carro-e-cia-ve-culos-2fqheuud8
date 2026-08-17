# Memória de trabalho — Carro e Cia

Este arquivo existe pra responder uma pergunta: **"onde paramos?"** — sem
precisar reler o histórico inteiro de conversas. Diferente do
`AUDIT_REPORT.md` (mantido como está, não é mais atualizado), este arquivo é
pra ser mantido em dia de verdade. Detalhe técnico por integração continua
nos arquivos `docs/*.md` — aqui é só o resumo de estado + pendências.

Última atualização: 2026-08-17 (sessão 7).

**Pasta de trabalho deste projeto:** `C:\Projeto\Revenda Carro e Cia\carro-e-cia-ve-culos-2fqheuud8`
(sempre abrir sessão nova aqui pra continuar — ver também `CLAUDE.md`).

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
  no ar, catálogo confirmado ativo no Commerce Manager com 27 veículos.
- **Meta Ads MCP**: conector conectado via token (não OAuth — ver
  `docs/meta-ads-mcp.md`). Ferramentas `mcp__meta-ads__*` confirmadas
  carregando em conversa nova.
- **NaPista**: autenticação + fluxo completo de publicação (catálogo →
  mapeamento → revisão → `napista-sync`) no ar e testado com dado real. Falta
  só automação (enfileiramento automático + cron) — ver pendência 1.
- **Site institucional**: bug de layout corrigido em 14/08/2026 — imagens
  dos cards de "Veículos em Destaque" na home estouravam a altura do
  contêiner e cobriam o texto (título/preço/botão), tamanho diferente por
  veículo. Causa: regra CSS global em `src/main.css`
  (`img { height: auto !important }`) sobrescrevia qualquer `h-full`/altura
  fixa do Tailwind em QUALQUER imagem do site, não só nesses cards — corrigido
  removendo o `!important` (era redundante com o preflight do Tailwind, que
  já faz o mesmo sem `!important`). Rodapé do site também ganhou razão
  social (TRANSLUGA ADMINISTRADORA DE VEÍCULOS LTDA, CNPJ
  10.196.974/0001-46) e endereço (Av. Guilherme Ferreira, 1119, Uberaba -
  MG) em `src/components/PublicLayout.tsx`. Divergência de endereço (1131 vs
  1119) **corrigida em 15/08/2026** em todos os pontos (`ml-client.ts`,
  `public-inventory-feed`, `Configuracoes.tsx`, `PoliticaPrivacidade.tsx`,
  `Termos.tsx`, `Sobre.tsx`) — ver pendência 6 fechada abaixo.
- **Mercado Livre — bug "not modifiable"** (achado e corrigido em
  15/08/2026): anúncio local apontava pra item já `closed`/`deleted` do lado
  do ML — todo PUT falhava com "not modifiable" em todos os campos, porque a
  API do ML não deixa editar anúncio fechado, só criar um novo. Corrigido em
  `_shared/ml-sync-core.ts` E `sync-plataforma/index.ts` (código duplicado,
  não compartilhado — os dois precisaram do mesmo fix): checagem de
  status antes do PUT, cai pra POST (cria novo) se estiver stale. Testado ao
  vivo com o veículo SW4 Hilux, novo anúncio `MLB7420419026`, modalidade
  prata. `sync-estoque` e `admin-plataformas-api` redeployados pra pegar o
  fix (mesmo shared file, precisa redeploy de cada consumidor).
- **Regra de roteamento de números de WhatsApp/telefone** — definida e
  documentada em 15/08/2026 no `CLAUDE.md` (seção "A PREENCHER pela
  Adriana"): Clara (`5534997384177`) = atendimento geral do site; Adriana
  (`5534984080220`) = só consórcio + alertas administrativos internos;
  Gabriel (`5534992000300`) = só seguro auto; Fixo (`553433159400`) +
  Celular da loja (`5534992893615`) = só ligação direta (`tel:`), nunca
  `wa.me`. Corrigido em ~15 arquivos do site (a maioria já usava a Clara por
  padrão via `getWhatsAppLink()`; só os pontos com link direto hardcoded
  estavam errados). Também corrigidos 3 bugs de backend que vazavam o
  celular pessoal da Adriana pro público: `ai-sdr` (Clara se apresentando
  com o número dela), `gerar-conteudo` (posts de IA com o número dela),
  `receive-leads` (alerta de lead Meta Ads pro número morto antigo).
- **Jessica Germano removida** do site inteiro (não trabalha mais na
  empresa): `brand.ts`, `Sobre.tsx`, `VenderMeuCarro.tsx` e também do JSON
  salvo em `site_configuracoes.brand_config` no banco (é o que alimenta o
  rodapé de verdade).
- **Razão social corrigida**: "LGA COMÉRCIO DE VEÍCULOS LTDA" (antiga, errada)
  → "TRANSLUGA ADMINISTRADORA DE VEÍCULOS LTDA, CNPJ 10.196.974/0001-46" em
  `PoliticaPrivacidade.tsx` e `Configuracoes.tsx`.
- **Página "Trabalhe Conosco"** (`/trabalhe-conosco`, nova, 15/08/2026):
  formulário público (nome, telefone, e-mail, texto livre até 20.000
  caracteres, currículo em PDF obrigatório) + card "Temos vaga" (lista
  títulos das vagas ativas). Link no menu principal do site. Admin em
  `/admin/vagas`: aba "Vagas Abertas" (CRUD, botão "Gerar com IA" via
  Gemini pra redigir a vaga, botão "Gerar imagem" via IA pra imagem padrão
  de post, botão "Postar nas redes" que reaproveita a fila existente de
  `social_posts`/`publicar-social`) e aba "Candidaturas Recebidas" (lista
  com filtro por vaga). Tabelas novas: `vagas`, `candidaturas` (com
  `vaga_id`, nulo = candidatura espontânea). 3 functions novas:
  `enviar-candidatura` (verify_jwt=false, sobe currículo pro R2 direto
  — client não tem login —, valida só PDF, máx 8MB), `gerar-vaga-ia`,
  `gerar-imagem-vaga` (as duas últimas verify_jwt=true, admin). Página
  `/obrigado` agora aceita `state: { tipo: 'candidatura' }` do
  `navigate()` pra mostrar mensagem própria (sem empurrar candidato pro
  WhatsApp do Luiz) — `tipo` ausente continua caindo no comportamento
  antigo ("venda"), nada quebrou pros outros formulários.

- **E-mail de candidatura e de lead do site corrigido** (15/08/2026, fecha a
  pendência 7 abaixo): domínio `carroeciamotors.com.br` verificado no Resend
  (confirmado via MCP oficial do Resend, conectado nesta sessão). Remetente
  trocado de `onboarding@resend.dev` (modo sandbox, só entregava pro dono da
  conta) pra endereços do próprio domínio em `enviar-candidatura/index.ts`
  (`rh@carroeciamotors.com.br`) e `send-lead-email/index.ts`
  (`contato@carroeciamotors.com.br`). Testado ao vivo via curl no endpoint
  real — `emailStatus: {enviado:true}` confirmado. As duas functions
  redeployadas. **Achado à parte — resolvido em 15/08/2026:** a chave de API
  do Resend hardcoded como fallback em `send-lead-email/index.ts` (linha 10)
  estava exposta no histórico do GitHub. Rotacionada: chave nova gerada no
  Resend ("Supabase Integration (rotacionada 2026-08-15)"), salva na
  variável `RESEND_API_KEY` do Supabase, hardcode removido do código
  (function redeployada), chave antiga ("Supabase Integration") revogada.
  Testado ao vivo nas duas functions após a troca — ambas continuam enviando
  e-mail normalmente. Chave "Onboarding" (mais antiga, nome bate com o
  remetente sandbox usado antes da correção do domínio) não foi revogada —
  não confirmado se é usada em outro lugar.
- **Dois avisos automáticos novos pro WhatsApp da Adriana** (15/08/2026, em
  `ai-sdr/index.ts`, constante `ADRIANA_PHONE`): (1) quando a Clara agenda
  visita OU avaliação (`agendar_visita` → `notificarNovoAgendamento`), agora
  manda a mesma mensagem que já ia pro WhatsApp da loja também pro número
  pessoal dela; (2) quando a Clara passa atendimento pra humano
  (`solicitar_atendimento_humano`), que antes só desligava a IA no lead sem
  avisar ninguém, agora manda nome/telefone/motivo pro WhatsApp dela. Function
  redeployada e no ar.

- **Catch-up de Git (15/08/2026, sessão 5)**: todo o trabalho das sessões 3 e
  4 (14-15/08) estava só na máquina local, sem commit desde 14/08 10:46 — 39
  arquivos modificados + 24 novos. Revisado (sem segredo exposto), dividido
  em 9 commits lógicos por assunto (NaPista, fix Mercado Livre, roteamento
  WhatsApp/limpeza institucional, Clara, Trabalhe Conosco, tipos gerados,
  fix e-mail Resend, docs, filtro de leads) e **enviado pro GitHub**
  (`git push origin main`, branch `main`, até o commit `3b8d548`). Site
  publicado (Cloudflare Worker) já conferido no ar com as mudanças de
  frontend antes mesmo do commit (alguém já tinha rodado `wrangler deploy`
  antes) — git só estava desatualizado, não o site.
- **Rotação de chave do Resend (15/08/2026)**: ver bullet anterior sobre
  e-mail — chave antiga exposta revogada, chave "Onboarding" (não usada)
  também revogada, nova gerada e testada.
- **NaPista — automação aplicada (16/08/2026, sessão 6)**: migration e
  deploy da etapa 7-8 (enfileiramento automático + cron a cada 30min)
  aplicados de verdade. Falta só o teste de ponta a ponta — ver pendência
  aberta 1.
- **Integridade de migrations corrigida (16/08/2026, sessão 6)**: achado
  investigando o `wm-sync` — 47 migrations com timestamp local diferente
  do banco (aplicadas via MCP, que carimba a hora real), uma correção real
  em produção (`corrige_laco_republicacao_webmotors`) sem nenhum registro
  no histórico (aplicada via `execute_sql` direto), e dois pares de cron
  duplicados rodando a mesma função (criados ao tentar renomear um job
  existente em vez de alterá-lo). Corrigido: 26 migrations renomeadas pro
  timestamp real, 4 migrations órfãs registradas no histórico, crons
  duplicados removidos. Regra nova documentada em `CLAUDE.md`, seção
  "Integridade de migrations e deploys". Detalhe em pendências 8 e 9
  abaixo.
- **Correção de segurança (16/08/2026, sessão 6)**: achada senha fixa em
  texto plano numa migration antiga (`add_access_control`,
  `Skip@Pass123!`), válida pra conta de login da Adriana
  (`lgacomerciodeveiculos@gmail.com`, nível admin_master). Senha trocada
  no banco. Contas de Roberto e da conta `@kmzero.com.br` **não foram
  mexidas** — decisão da Adriana, ver pendência 10.
- **Crons duplicados removidos (16/08/2026)**: `re-engagement-cron-daily`
  e `ml_weekly_quality_check` desligados — cada um duplicava a função de
  outro cron já ativo (`re-engagement-cron-job` e
  `avaliar-qualidade-anuncios-cron`, respectivamente) rodando sem que
  ninguém percebesse havia semanas.
- **Sistema de setores substituiu módulos (17/08/2026, sessão 7)**:
  tabelas `setores` (11 setores seedados) + `usuario_setores`, controle de
  acesso real por rota em `src/lib/setor-acesso.ts` +
  `AdminLayout.tsx` (antes o sistema de "módulos" existia mas não
  restringia nada de verdade). RLS crítica corrigida na tabela `usuarios`
  no mesmo pacote. Feature "Criar Usuário" com permissão por setor no ar,
  botão de criar setor novo removido do modal (pedido da Adriana). Feature
  "Esqueci minha senha" via Resend também entregue nesta sessão.
- **Auditoria completa do painel + reorganização de menu (17/08/2026,
  sessão 7)**: levantamento das 21 páginas admin via subagente, gerou
  `docs/manual-operacional-contexto.md` (checklist de documentação por
  setor). Achadas e **removidas** 3 telas 100% fachada, sem persistência
  real (decisão da Adriana — remover com segurança, planejar futuro
  depois): Avaliação de veículo (`/admin/avaliacao`), abas "Loja & SEO" e
  "Scripts & Tracking" de Configurações, aba "Automações de E-mail" de
  Marketing. Menu lateral reorganizado nos 3 grupos fixos pedidos por ela:
  Menu Principal (operacional) / Administração / Área de Ajuda — antes
  eram 6 grupos por assunto misturando os dois. Build (`bun run build`)
  confirmado limpo depois da remoção. Tudo commitado e enviado pro GitHub
  (`ba3b5f5`).
- **Skill `manual-operacional` criada (17/08/2026, sessão 7)**: em
  `.claude/skills/manual-operacional/`, escopo só deste projeto. Conduz a
  escrita guiada dos artigos da Central de Ajuda (`ajuda_conteudos`),
  setor por setor, sempre investigando a página real antes de documentar.
  `CLAUDE.md` ganhou regra ampliada: ao fechar tarefa que tocou o painel,
  checar `docs/manual-operacional-contexto.md` e já fechar lacuna
  relacionada, sem esperar pedido explícito.

## Pendências abertas

1. **[FECHADA 16/08, falta só o teste] NaPista — automação aplicada,
   falta testar de ponta a ponta.** Migration e deploy aplicados
   (16/08/2026, sessão 6) — trigger `trigger_napista_sync_on_veiculo_change`
   e cron `napista-sync-cron-job` (30min) ativos. **Próximo passo:** ligar
   o toggle "Publicar no NaPista" de um veículo de teste em `/admin/portais`
   e conferir se enfileira certo (igual foi feito com Webmotors e Mercado
   Livre). Já commitado no Git (`df609a5`), não enviado pro GitHub ainda.

1. **NaPista** — Fase 1 (autenticação) concluída e testada. Fase 2: etapas
   1-4 de 9 **concluídas, testadas e publicadas em 14/08/2026** com dado
   real (Jeep Compass) — sync de catálogo, mapeamento automático
   (`napista-mapear-veiculo`) e tela de revisão manual
   (`NapistaPendenciasReview.tsx`, dentro da aba NaPista de
   `/admin/portais`) funcionando de ponta a ponta: marca/modelo casaram com
   confiança 1.0, versão foi corretamente pra revisão (candidato certo em
   1º lugar), confirmação manual resolveu cor/câmbio/combustível certo
   (`BLACK`/`AUTOMATIC`/`FLEX`). Dois bugs reais achados e corrigidos
   testando ao vivo: (1) confirmar manualmente não recalculava
   cor/câmbio/combustível, ficavam `null`; (2) cor do NaPista é masculina
   ("Preto"), `veiculos.cor` é feminina ("Preta") — quase todo veículo
   falhava o match; criado fallback de gênero (`NAPISTA_COR_FALLBACK` em
   `napista-client.ts`, mesmo espírito do `ML_COLOR_MAP`). Site
   rebuildado e redeployado (`wrangler deploy`) com tudo isso no ar.
   Etapa 5 (endpoint de fotos) **pesquisada em 14/08/2026**:
   `POST /seller/{sellerId}/offer/{offerId}/photos/url`, aceita URL pública
   direto, mas sobrescreve a lista inteira a cada chamada.
   **Etapa 6 (`napista-sync`) concluída e testada ao vivo em 14/08/2026** —
   os três caminhos (criar/atualizar/encerrar) confirmados funcionando de
   verdade no ambiente dev do NaPista, com o Jeep Compass real (offerId
   `a8d18554-5cc9-45b5-a0b5-332879cb1891`). Dois achados corrigidos no
   caminho: (1) `estoque_publicacoes.platform` tinha CHECK restrito a
   facebook/instagram/webmotors — a suposição de que já era
   multi-plataforma estava errada, migration ampliou pra incluir 'napista';
   (2) limite de **10 fotos por anúncio**, não documentado — acima disso
   a API rejeita a lista inteira (HTTP 412). Fase 2 do NaPista está com o
   fluxo principal completo (catálogo → mapeamento → revisão → publicação);
   falta só automação (etapas 7-8: trigger automático + cron periódico,
   hoje é tudo manual) — plano completo em `docs/integracao-napista.md`.
2. **Meta Ads MCP** — confirmado nesta sessão: as ferramentas
   `mcp__meta-ads__*` carregam normalmente numa conversa nova. Pendência
   encerrada.
3. **Catálogo Facebook** — confirmado pela Adriana: fonte de dados criada e
   funcionando no Commerce Manager, 27 veículos ativos. Pendência encerrada.
4. **Classificação de leads pela Clara** — expandida em 14/08/2026:
   - `criar_lead_crm`: enum de `tipo` foi de 2 pra 7 valores (`comprador`,
     `vendedor`, `troca`, `consignacao`, `financiamento`, `seguro_auto`,
     `consorcio`).
   - `atualizar_estagio_lead`: agora também aceita `temperatura`
     (frio/morno/quente) — antes a Clara nunca escrevia nesse campo, só
     integrações automáticas (ML, site, portais) com valor fixo por canal.
   - Encaminhamento automático: lead com `tipo=seguro_auto` manda WhatsApp
     pro Gabriel (5534992000300); `tipo=consorcio` manda pra própria
     Adriana (5534984080220) — resumo da conversa + dados do cliente, via
     `encaminharParaParceiro()` em `ai-sdr/index.ts`.
   - Painel (`/admin/leads`): filtro por tipo adicionado (agrupa
     `compra`+`comprador`+`interesse` como "Quer comprar").
   - **Nada disso foi deployado ainda** — só criado/editado localmente.
5. **Gemini API — verificação de atualidade** (pedido da Adriana,
   14/08/2026): modelo em uso (`gemini-3.6-flash`) **está atualizado** —
   confere com os exemplos oficiais atuais da Google. O endpoint usado
   (`generateContent` via REST) **continua totalmente suportado**, sem
   prazo de descontinuação. A "Interactions API" (`client.interactions.create`,
   GA desde 06/2026) é recomendada pra projetos novos, mas migrar exigiria
   reescrever boa parte do `_shared/gemini-client.ts` (formato de tools e de
   leitura de resposta mudam bastante). **Não migrado agora** — ficou como
   melhoria futura, não urgente.

6. **[FECHADA 15/08]** Endereço 1131 vs 1119 — corrigido em todos os pontos
   (ver bullet acima). Sem pendência.
7. **[FECHADA 15/08] E-mail de candidatura não chega** — resolvida (ver
   bullet acima, seção "O que está no ar hoje"). Causa raiz: a chave
   `RESEND_API_KEY` estava em modo sandbox
   no Resend — só permite mandar e-mail pro endereço da própria conta
   (`lgacomerciodeveiculos@gmail.com`), recusa qualquer outro destinatário
   (testei direto via curl, resposta 403 do Resend confirma isso). Por isso
   o e-mail pra `rh@carroeciamotors.com.br` (function `enviar-candidatura`)
   nunca chegava — a function reportava sucesso porque o `fetch()` original
   não checava `res.ok` (bug já corrigido, agora a resposta da function
   inclui `emailStatus: {enviado, motivo}` pra diagnóstico). **Suspeita não
   confirmada**: `send-lead-email` (mais antiga) usa o mesmo remetente
   `onboarding@resend.dev` e manda pra `contato@carroeciamotors.com.br` —
   pode ter o mesmo problema, vale a Adriana conferir se esses e-mails têm
   chegado de verdade.
   Dois caminhos de solução, nenhum aplicado ainda — decisão da Adriana:
   (a) verificar domínio em resend.com/domains e trocar o remetente pra um
   e-mail `@carroeciamotors.com.br`; (b) mandar temporariamente pro Gmail
   dela até o domínio ser verificado. As candidaturas continuam salvas
   certinho no banco/admin independente disso — nada se perde, só o aviso
   por e-mail que não sai.
   Servidor MCP oficial do Resend (`https://mcp.resend.com/mcp`) foi
   registrado no `claude mcp` local deste projeto, pra eu poder investigar/
   configurar isso diretamente — mas está com status "Needs authentication".
   Falta a Adriana completar o login/OAuth na conta Resend dela (não é algo
   que eu faço sozinha) e provavelmente reiniciar a sessão do Claude Code
   pra essas ferramentas aparecerem.

8. **22 migrations sem arquivo local nenhum** (achado 16/08/2026): schema
   real está correto e aplicado, mas o texto SQL original de 22 migrations
   antigas (02/08 a 12/08) foi perdido do histórico do banco — sem arquivo
   local pra reconstruir. Resolve rodando `supabase db pull`, que precisa
   de **Docker Desktop instalado** nesta máquina (não está). Sem urgência
   — nada quebrado, só documentação incompleta.
9. **Duas migrations paradas em `supabase/migrations-rascunho/`**, fora do
   fluxo automático de propósito:
   - `desliga_cron_wm_sync.sql` — desligaria a sincronização automática da
     Webmotors. Decisão da Adriana em 16/08: manter automático por ora.
     Aplicar só depois do fluxo manual "Sincronizar Agora" (painel Portais)
     ser testado de ponta a ponta.
   - `crm_improvements.sql` (23/06, órfã) — código morto (cron quebrado,
     conteúdo redundante com outra migration já aplicada). Candidata a
     apagar quando sobrar tempo, sem pressa.
10. **Senha exposta pro Roberto (`roberto@carroecia.com`) e pra conta
    `adriana.araujo@kmzero.com.br` continua sem trocar** (16/08/2026):
    achada em `add_access_control.sql` (senha fixa em texto plano, ver o
    arquivo — não repetida aqui de propósito, continua válida pras duas
    contas). A senha da própria Adriana (conta de login principal) já foi
    trocada. Decisão dela foi deixar as outras duas como estão por ora —
    registrado aqui porque a exposição em si continua no histórico do
    Git, não some sozinha.
11. **Plano futuro pras 3 telas removidas** (17/08/2026): Avaliação de
    veículo formal, Configurações gerais de Loja/SEO/Scripts, Automações
    de e-mail de nutrição de lead. Adriana pediu remoção + "montar um
    plano junto pra elas no futuro" — remoção feita, planejamento ainda
    não começou. Detalhe do que cada uma fazia (fake) está na seção
    "Backlog" de `docs/manual-operacional-contexto.md`.
12. **Confirmar status real de OLX/iCarros/Napista em `/admin/portais`**
    (17/08/2026): comentário no código dizia que só Webmotors e Mercado
    Livre têm integração real, as outras seriam só flag. Sinalizado no
    doc de contexto do manual pra reconferir — pode estar desatualizado,
    não foi checado nesta sessão.
13. **Documentação de API inexistente** (17/08/2026): achado durante a
    auditoria — não existe Swagger/OpenAPI/webhook documentado em lugar
    nenhum do painel. A nova seção "Área de Ajuda" do menu vai precisar
    disso, mas ainda não tem escopo definido nem foi pedido pra começar.
14. **Manual Operacional — maioria das páginas ainda sem artigo**
    (17/08/2026): infraestrutura pronta (`docs/manual-operacional-contexto.md`
    + skill `manual-operacional`), só 1 artigo real existe ("Criar Usuário
    no Painel"). Escrever o resto é trabalho de várias sessões futuras,
    conduzido pela skill quando a Adriana pedir.

## Referências técnicas por assunto

`docs/webmotors-integracao.md` · `docs/mercadolivre-integracao.md` ·
`docs/leads-e-sdr.md` · `docs/meta-ads-mcp.md` · `docs/edge-functions-rules.md`
· `docs/R2_CORS_CONFIGURATION.md` · `docs/integracao-napista.md`
