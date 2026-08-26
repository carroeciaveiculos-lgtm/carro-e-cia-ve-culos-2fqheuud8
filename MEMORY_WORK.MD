# Memória de trabalho — Carro e Cia

Este arquivo existe pra responder uma pergunta: **"onde paramos?"** — sem
precisar reler o histórico inteiro de conversas. Diferente do
`AUDIT_REPORT.md` (mantido como está, não é mais atualizado), este arquivo é
pra ser mantido em dia de verdade. Detalhe técnico por integração continua
nos arquivos `docs/*.md` — aqui é só o resumo de estado + pendências.

Última atualização: 2026-08-26 (sessão 15, continuação — descrição não sincronizava, gatilhos de reenvio corrigidos nas 3 plataformas).

## Sessão 15 (26/08/2026, continuação) — descrição não sincronizava + gatilhos de reenvio incompletos nas 3 plataformas

Adriana perguntou por que a descrição não sincronizava em alguns veículos e
se existia limite de caractere. Achei **duas causas diferentes**, uma por
plataforma:

**Mercado Livre**: o gatilho automático que decide "esse veículo precisa
reenviar" só reagia a Preço/Status/Exibir no site — editar só a Descrição
(ou qualquer outro campo técnico) nunca disparava reenvio. Confirmado com
dado real: 9 veículos ativos editados depois da última sincronização real.

**Webmotors**: o próprio código cortava a descrição em 500 caracteres antes
de mandar — sem nenhuma documentação confirmando que esse é um limite real
da Webmotors. **Testado ao vivo** (autorizado pela Adriana, usando o
anúncio real do VW up! move, `AlterarCarro` com a descrição completa de
1104 caracteres): a Webmotors aceitou e ecoou o texto inteiro, sem
reclamar — não existe esse limite do lado deles. 17 dos veículos publicados
tinham a descrição cortada no meio da frase por causa dessa trava nossa.

**Corrigido**: removido o corte de 500 no `wm-soap.ts`; gatilho do ML
ampliado pra reagir também a Descrição/Quilometragem/Cor/Combustível/
Câmbio/Portas/Direção/Cilindrada/Versão/Categoria.

**Pedido seguinte da Adriana**: garantir que QUALQUER edição futura de
campo com dependência de sincronia dispare reenvio automático pras
plataformas que já têm aquele veículo em anúncio ativo — não só descrição.
Auditei os 3 gatilhos (ML, Webmotors, NaPista) contra o que cada
`buildXPayload`/`buildAnuncioXML` realmente lê da tabela `veiculos` e achei
o mesmo padrão de bug nas 3:

- **ML**: gatilho ampliado de novo pra incluir Marca/Modelo/Ano Modelo
  (compõem o título do anúncio), Zero KM (decide Novo/Usado) e Fotos.
- **Webmotors**: o gatilho já disparava em qualquer UPDATE, mas só
  enfileirava reenvio se Preço/Km/Descrição mudassem — Portas, Ano, Placa
  e todo campo Sim/Não (Blindado, Alienado, Único Dono, IPVA Pago, etc.) e
  os opcionais/diferenciais nunca reenviavam. Corrigido pra cobrir todos.
- **NaPista**: gatilho só observava Preço/Km/Descrição — Ano, Placa e
  Portas (que `buildOfferPayload` realmente manda) nunca disparavam.
  Corrigido.

**Limitação conhecida, não resolvida ainda**: Cor/Câmbio/Combustível da
Webmotors e do NaPista vêm de uma tabela de mapeamento própria
(`wm_mapeamento_veiculos`/`napista_mapeamento_veiculos`), não direto da
coluna do veículo — editar `veiculos.cor` já dispara o remapeamento
automático (desde sessão anterior), mas nada ainda liga esse remapeamento
de volta pra fila de republicação (`estoque_publicacoes`). Ou seja: o
mapeamento interno fica certo, mas o anúncio JÁ publicado só pega essa
mudança se algum outro campo (preço, km, descrição, etc.) também tiver
mudado junto. Não implementado nesta sessão — é mais complexo (precisa
decidir se remapeamento sempre republica, mesmo quando o resultado do
remapeamento não muda nada) e não foi pedido explicitamente.

**Testado ao vivo nas 3 plataformas** (editando um campo real e revertendo
em seguida, sem deixar nada errado no estoque): Webmotors (Portas no
Land Rover Discovery), NaPista (Portas no Honda CITY), Mercado Livre
(Marca no BMW 320iA) — as 3 vezes a fila reagiu na hora com
`pending_update`.

**Pendente de decisão da Adriana**: os 17 veículos já publicados na
Webmotors com descrição cortada não se corrigem sozinhos — precisam de um
reenvio forçado (ela ainda não respondeu se quer isso agora).

**Publicado**: `wm-soap.ts` (função `buildAnuncioXML`, usada por
`wm-sync`), migrations `ml_sync_trigger_inclui_campos_tecnicos`,
`wm_sync_trigger_inclui_todos_campos_anuncio`,
`napista_sync_trigger_inclui_todos_campos_anuncio`,
`ml_sync_trigger_inclui_marca_modelo_ano_km_fotos`.

## Sessão 15 (26/08/2026) — Hilux/NaPista resolvido, cilindrada numérica, versão restrita a integrações

Sequência: Adriana descobriu por conta própria a causa exata do Hilux no
NaPista (marca Toyota bate, mas o modelo certo é "SW4", não "HILUX SW4" —
o NaPista tem 3 modelos "duplicados" pro mesmo veículo real). Pediu pra
resolver isso, entender as "2 pendências" fantasma no dashboard WM/ML, e
criar um jeito de a fila nunca ficar suja com erro parado — pedi
autocrítica antes de decidir automatizar retry sozinho (achei arriscado
publicar sem revisão humana pra veículos que já falharam uma vez, ela
concordou em seguir com cautela).

**1. Empate de modelo no NaPista — corrigido e testado ao vivo.**
`napista-mapear-veiculo/index.ts`: quando o trigram-match de modelo retorna
mais de um candidato com score muito próximo (diferença < 0.02), busca a
versão em TODOS os empatados (não só no primeiro) e fica com o que achar
uma versão de verdade — nunca "aposta" cedo demais num modelo que pode nem
ter o carro cadastrado. Testado com o Hilux real: agora escolhe "SW4"
sozinho e mostra a versão certa ("2.8 TDI SRX 7L AUTO 4WD") como candidata
na tela de Pendências — falta só a Adriana confirmar clicando. Publicado
`napista-mapear-veiculo` v17.

**2. Dashboard de sincronização mentia números.** `get_platform_sync_dashboard`
(função do banco): Mercado Livre sempre mostrava "0 publicados" (lia a
tabela errada — `estoque_publicacoes`, que o ML nunca usa, em vez de
`ml_listings`); "pendências" contava um status de log (`sync_log.status =
'pending'`) que nenhuma function grava mais — as "2 pendências" eram 2
linhas órfãs de 22-23/07/2026 (GWM Haval H6, BMW 320iA), ambos já
publicados normalmente há semanas. Corrigido pra contar da fila real de
cada plataforma. Confirmado depois da correção: WM 0 pendências reais, ML
24 publicados/1 pendência real (o próprio Hilux, aguardando o mapeamento),
NaPista 24/0.

**3. Retry manual de veículo com erro** (não fica mais preso pra sempre):
`napista-sync` já aceita reprocessar um veículo específico mesmo com
status `error` (v16, sessão anterior) — decidido NÃO criar auto-retry
automático que publica sozinho sem revisão (risco identificado na
autocrítica: veículo que já falhou geralmente tem problema de dado, não é
seguro deixar o sistema tentar de novo sozinho e publicar). Mesma lacuna
(`error` não incluído no retry) ainda existe no `wm-sync` — fora de escopo
desta sessão.

**4. Auditoria dos campos "versão" e "cilindrada"** (pedido direto da
Adriana): mapeei todo uso — versão alimenta correspondência de catálogo em
3 integrações reais (Mercado Livre/atributo TRIM, Webmotors, NaPista) mas
também vazava, sem necessidade, pra 4 lugares de conteúdo nosso (prévia de
link no WhatsApp/Facebook, PDF de Proposta/Contrato de Consignação,
mensagem de "tenho interesse" no WhatsApp, resultado do comando `BUSCAR`
da equipe) — repetindo o que já está em Modelo, cara de erro. Cilindrada é
texto livre sem padrão nenhum (banco tinha "2.0" e "2.0 " como valores
diferentes, e 2 veículos misturavam cilindrada com potência: "1.0 -
88CV").

**Decisão da Adriana**: versão passa a servir só pra atender exigência de
plataforma — removida dos 4 lugares de conteúdo próprio (mantida a lógica
já esperta que existia em 2 lugares — título do site/SEO e título do ML —
que só mostra a versão quando ela acrescenta algo que Modelo não tem,
essas duas não foram mexidas). Cilindrada vira campo numérico, só litros.

**Implementado e publicado:**
- Migração `converte_cilindrada_para_numero`: corrige os 2 valores com CV
  misturado, limpa espaço/vírgula, converte a coluna pra `numeric(3,1)`,
  trava `cilindrada_valida` (0 a 15).
- `VehicleFormModal.tsx`: campo Cilindrada vira numérico com validação (mesmo
  padrão do campo Portas); campo Versão ganha aviso explicando que é só
  pra integrações, pode ficar em branco se Modelo já é completo.
- `ml-client.ts`: `formatCilindradaCC` simplificado (não precisa mais
  adivinhar litro vs cc, entrada já vem sempre em litros numérico).
- Versão removida de: `og-vehicle` (prévia WhatsApp/Facebook — testado ao
  vivo com veículo real que tinha versão idêntica ao modelo, confirmado
  título sem repetição), `cta-router.ts` (mensagens de WhatsApp),
  `whatsapp-estoque.ts` (resultado do comando `BUSCAR` — buscar por versão
  continua funcionando, só não aparece mais repetido no texto), templates
  de PDF "Contrato de Consignação" e "Proposta Comercial" (banco,
  `document_templates`), e do card de revisão de portais
  (`ReviewVehicleCard.tsx`).
- Tipos TS atualizados de `string|null` pra `number|null` em cilindrada
  (`supabase/types.ts`, `ml-validation.ts`, `ad-quality-score.ts`,
  `plataformas.ts`, `ml-diagnosis.ts`, `validate-payload.ts`).
- Funções reimplantadas via CLI local (bundle automático, sem risco de
  transcrição manual incompleta que já aconteceu antes nesta sessão):
  `og-vehicle`, `ml-sync`, `sync-plataforma`, `gerar-pdf-contrato`,
  `gerar-pdf-proposta`, `webhook-portais`, `whatsapp-webhook`.
- `bun run build` passou limpo depois de todas as mudanças de tipo.

**Pendente:** commit+push de todos os arquivos (aguardando autorização
separada, como sempre). Adriana ainda precisa confirmar a versão do Hilux
na tela de Pendências NaPista.

**Achado útil pra próxima vez**: `supabase functions deploy <nome>
--project-ref htpcqdbhktmvppfemnad` (CLI local, dentro da pasta do
projeto) bundla sozinho todas as dependências `_shared/*.ts` de verdade —
muito mais seguro que reconstruir o payload de deploy manualmente arquivo
por arquivo (esse segundo método já causou uma transcrição incompleta de
`ml-cache.ts` na sessão passada). Preferir CLI local sempre que o Bash/
PowerShell estiver disponível.

## Sessão 14 (25/08/2026) — Correção do body_type/ML e automação de mapeamento NaPista

Investigando erro real do Hilux ("subimos ontem e deu erro"), achei 3 bugs
empilhados, todos corrigidos e publicados:

1. **`sync_log` mentia a causa do bloqueio no ML** — sempre gravava
   "VEHICLE_BODY_TYPE inválido" pra qualquer validação bloqueante (preço,
   foto, cidade, etc.), mesmo com categoria válida. Corrigido em
   `ml-sync/index.ts` pra gravar `validation.errors.join('; ')` de
   verdade. `sync-plataforma/index.ts` (usado pelo botão "Sincronizar
   Agora") já fazia isso certo.
2. **Backend do ML nunca conferia cor/câmbio/combustível** — só
   `ml-preflight.ts` (front, só roda se alguém passar pela tela) conferia.
   Achado real: veículo com `cor="BRANC0"` (zero no lugar do "O") passava
   direto pro backend sem barreira. Adicionado em
   `_shared/validate-payload.ts` (mapas `ML_COLOR_MAP`/`ML_FUEL_MAP`/
   `ML_TRANSMISSION_MAP` agora exportados de `ml-client.ts`).
3. **Formulário de veículo tinha `categoria: 'Carro'` como padrão** — valor
   que não é nenhuma categoria real do ML. Se ninguém trocasse no
   dropdown, ficava salvo assim. Corrigido pra `''` + campo agora
   obrigatório em `validatePortalFields`. Achado: 7 veículos (todos já
   vendidos) tinham esse valor — corrigidos na migração com a categoria
   certa de cada um, pelo nome do modelo.

**Trava de banco nova**: `categoria_valida_ml` (CHECK constraint) —
impede `categoria` de voltar a receber valor que o ML não reconhece,
qualquer que seja o caminho de entrada (form, importação, feature
futura). Permite NULL, só bloqueia valor errado de verdade.

**Automação de mapeamento NaPista** (pedido real: por que o Hilux ficou
dias sem publicar no NaPista): `napista-mapear-veiculo` já faz
correspondência automática (trigram pra marca/modelo/versão, exata pra
cor/câmbio/combustível) — só nunca era chamada automaticamente, diferente
da Webmotors (que já chama `wm-mapear-veiculo` no botão "Validar e
Salvar" desde 12/08). Replicado o mesmo padrão pro NaPista em
`VehicleFormModal.tsx` — agora todo veículo novo/editado já sai mapeado
(ou com aviso na hora) nas duas plataformas.

**Testado de verdade**: rodei `napista-mapear-veiculo` pro Hilux real
depois da correção do `cor` — antes nem tinha registro de mapeamento
nenhum; agora resolve marca (TOYOTA) e modelo (HILUX SW4) sozinho, e
corretamente pede revisão só na versão (NaPista não tem nenhuma versão
"SRX 4x4 2.8 TDI" cadastrada pra esse ano no catálogo deles — caso
legítimo de revisão manual, não bug).

**Publicado**: `ml-sync` v39, `sync-plataforma` v40. `VehicleFormModal.tsx`
e demais mudanças de frontend só entram em produção depois do commit +
push (build do Cloudflare). Migração `corrige_categoria_carro_e_typo_cor_hilux`
aplicada.

**Pendente**: contador de "veículos pendentes de mapeamento" nas telas de
WM/NaPista — pausado por enquanto (esbarrei num comentário desatualizado
em `NapistaCatalogPanel.tsx` que diz que "publicação no NaPista não
existe" — contradiz os logs reais, não investiguei a fundo ainda, não
travar em cima disso sem confirmar primeiro).

**Verificação completa WM/ML/NaPista (25/08/2026):** 24 de 25 veículos
ativos publicados nas 3 plataformas — o único gargalo nas 3 é o mesmo
Hilux SW4. Confirmado que `napista-sync` publica de verdade (cria oferta,
sobe fotos, publica via PUT .../PUBLISHED) — o comentário desatualizado
citado acima está confirmado ERRADO, mas não corrigi o texto ainda.

**Bug real achado e corrigido na tela de Pendências NaPista**
(`NapistaPendenciasReview.tsx` + `napista-mapear-veiculo/index.ts`): quando
o NaPista não tem NENHUMA versão cadastrada pro ano do veículo, a tela não
mostrava nenhum botão de escolha (parecia que a opção tinha sumido) — e a
busca de fallback só olhava um cache local nunca populado pra esse modelo,
sem nunca consultar a API ao vivo. Corrigido nos dois: função agora busca
ao vivo em qualquer ano quando o cache está vazio, e a tela sempre mostra
os candidatos encontrados (ou uma mensagem clara se realmente não existir
nenhuma versão em lugar nenhum). Testado de verdade com o Hilux: agora
mostra 5 candidatos reais de outros anos (nenhum é motor 2.8 exato — não
existe no catálogo deles, aguardando decisão da Adriana sobre aproximar ou
deixar de fora).

**Pasta de trabalho deste projeto:** `C:\Projeto\Revenda Carro e Cia\carro-e-cia-ve-culos-2fqheuud8`
(sempre abrir sessão nova aqui pra continuar — ver também `CLAUDE.md`).

## Sessão 14 (25/08/2026, continuação) — "sem sincronização real configurada" + teste de lookup por FIPE no NaPista

Pedido da Adriana, depois de tentar mapear manualmente o Hilux e receber
"sem sincronização real configurada napista": investigar essa mensagem e
testar se o NaPista aceita buscar versão pelo código FIPE (já buscado no
cadastro do veículo) como alternativa quando o casamento por catálogo
falha.

**Achado 1 — "sem sincronização real configurada" (bug real, corrigido):**
causa em `src/services/platform-sync.ts` — o mapa `SYNC_FUNCTION_BY_PLATFORM`
nunca incluía `napista`, apesar de `napista-sync` já publicar de verdade
(comentário antigo no próprio arquivo dizia o contrário, desatualizado).
Corrigido: `napista: 'napista-sync'` adicionado ao mapa. **Só entra em
produção depois do commit+push** (é frontend).

**Achado 2 — retry manual não funcionava em veículo já com erro:** mesmo
depois de corrigir o mapa acima, clicar em "Sincronizar" num veículo que já
tinha status `error` não fazia nada — a query de `napista-sync` só aceitava
status `agendado/pending_create/pending_update/pending_close`, nunca
`error`. Corrigido em `napista-sync/index.ts`: quando a chamada é pra um
veículo específico (retry manual, não a varredura geral do cron), `error`
também entra — tratado como "create" se ainda não tem `post_id`, como
"update" se já tem. **Já reimplantado no Supabase (v16)** — só isso, ainda
sem commit/push do arquivo local.

**Achado 3 — lookup por FIPE no NaPista NÃO funciona (testado ao vivo,
function de diagnóstico temporária já apagada):** chamei
`/catalog/versions/CAR` com `?fipeCode=002146-6` e `?fipe_code=002146-6`
(código FIPE real do Hilux) — as duas vezes a API respondeu HTTP 200, mas
com uma lista de veículos completamente aleatórios (BMW, Porsche, Renault
elétrico) — ou seja, a API **ignora silenciosamente** o parâmetro
desconhecido e devolve algum resultado padrão, não faz busca real por
FIPE. Outras rotas tentadas (`/catalog/fipe/...`,
`/catalog/version/fipe/...`) deram 404 de verdade. **Conclusão: não existe
esse recurso na API do NaPista — não é bug nosso, é limite do catálogo
deles.** Não adianta tentar de novo sem uma confirmação nova da
documentação oficial deles.

**Pendente de decisão da Adriana:** o Hilux continua sem versão exata no
catálogo NaPista (só 5 aproximações de outros anos, ver seção anterior) —
falta ela decidir: aceitar uma aproximação ou deixar o Hilux fora do
NaPista por enquanto.

**Pendente de commit+push:** `platform-sync.ts`, `napista-sync/index.ts`,
`NapistaPendenciasReview.tsx` (sessão anterior), este arquivo.

## Sessão 14 (24/08/2026) — Conversão da Clara (SDR) + achado de templates WhatsApp quebrados

**Diagnóstico inicial:** Adriana notou abertura robótica/scriptada da Clara e
grande abandono de leads. Auditoria confirmou: 132/135 leads travados em
`status='novo'`/`temperatura='frio'` mesmo com conversas longas —
`atualizar_estagio_lead` quase nunca era chamado de fato pelo modelo, apesar
da instrução no prompt. Plano A-F aprovado e implementado nesta ordem:

- **A** — regra de prioridade: pergunta direta do cliente (preço,
  disponibilidade) é respondida antes de qualquer pergunta de qualificação;
  a pergunta fixa "cidade/viagens/uso misto" virou opcional, com 3
  variações em vez de frase única repetida.
- **B** — Passo 5.5 novo no fluxo: pergunta natural sobre forma de pagamento
  (à vista/financiamento/troca) só depois do cliente confirmar interesse no
  veículo; `atualizar_estagio_lead` ganhou os campos `forma_pagamento` e
  `veiculo_troca_descricao` (gravam em `leads.forma_pagamento`/`trade_in_car`).
- **C** — rede de segurança por código: `agendar_visita` bem-sucedido força
  `temperatura='quente'` direto no banco, não depende do modelo lembrar de
  chamar `atualizar_estagio_lead` de novo.
- **D** — trava anti-duplicidade: `leads.ai_processing_started_at` (nova
  coluna) + UPDATE condicional otimista no `continue_conversation`, timeout
  de 40s. Resolve o caso real de flood de 14+ fotos repetidas.
- **E** — contador de convite: `contarConvitesVisita()` conta quantas vezes
  a Clara já convidou aquele lead pra visita/test-drive na conversa e
  injeta isso como aviso explícito no prompt dinâmico — não repete.
- **F** — `re-engagement-cron` ganhou uma segunda rota: lead morno/quente
  em silêncio por 48h (não só frio/7 dias), cap de 2 tentativas (vs 3 do
  frio), exclui quem já tem visita agendada.
- **Encaminhamento humano** — critério vago ("quando o lead estiver
  qualificado") substituído por 4 gatilhos explícitos no prompt: pedido
  direto, travado em algo que só humano resolve, reclamação real, ou 2
  tentativas sem conseguir ajudar. Achado: 0 de 136 leads em 30 dias tiveram
  a IA desligada — a função nunca disparava na prática.

Todos os itens publicados em produção (`ai-sdr` v154, `re-engagement-cron`
v83→86). Prompt B/A/encaminhamento vivem em `ai_prompts_config` (banco,
sem deploy) — `docs/clara-prompt.md` mantido sincronizado.

**Achado grande, não relacionado ao plano A-F:** ao testar o reengajamento
morno/quente, descobri que o template `reengajamento_frio` **nunca existiu
de verdade** na conta aprovada da Meta — `re-engagement-cron` vinha
falhando silenciosamente (erro 132001) toda vez que rodava, há semanas,
zero mensagem de reengajamento realmente enviada. Pausei o envio no código
(`REENGAJAMENTO_PAUSADO = true`) até haver um template real. Ver
`PROXIMA_SESSAO.md` pra reativar.

**Tokens Meta:** Adriana gerou novos `WHATSAPP_TOKEN` (com permissão
`whatsapp_business_management`, confirmada funcionando) e `META_ADS_TOKEN`,
já salvos no Supabase. Usuário de sistema: `carroecia_bot` (ID
`61590821367352`). Usei a permissão nova pra: (1) listar templates
aprovados via function temporária (apagada depois), achando 2 templates
prontos e nunca usados — `lembrete_agendamento` (lembrete de visita, 2
variáveis, confirmado pela Adriana) e `agendamento_reagendar` (na real é
follow-up de no-show: "sentimos sua falta hoje na loja..."); (2) submeter
2 templates novos pra aprovação — `reengajamento_quente` e
`reengajamento_pos_visita`, status PENDING em 24/08.

**Não testado ainda:** nenhuma das travas A-F foi observada em conversa
real de cliente — só revisão de código e diagnóstico via SQL/logs.

**Correção importante (mesmo dia):** eu tinha afirmado errado que
`lembrete_agendamento` e `agendamento_reagendar` "não são referenciados em
nenhum lugar do código" e propus construir lembrete de visita + follow-up
de no-show do zero. Errado — `lembrete-agendamento-cron` e
`agendamento-no-show-cron` **já existiam** (13/08/2026, "Bloco 4"/"Bloco 5"
nos comentários), já publicados, já agendados via pg_cron (jobid 12 e 13,
de hora em hora). O bug real: as duas foram publicadas com `verify_jwt:
true` — a própria Supabase rejeitava a chamada do cron com 401 antes de
chegar no código (`x-internal-secret` nunca era nem checado). Confirmado
pelo log real em `net._http_response`. **Fix aplicado e testado de
verdade:** republiquei as duas com `verify_jwt: false` (só essa flag,
nenhuma linha de lógica mudou) e testei chamando `net.http_post` manual —
as duas responderam HTTP 200. Rodam de novo, de hora em hora, desde
24/08/2026 ~17h30 UTC. Lição: **sempre `Grep` o nome do template/função
antes de propor construir algo do zero.**

## Sessão 14 (continuação) — Conversions API for Messaging (dataset carroecia_mensagens)

Adriana já tinha o token com permissão `whatsapp_business_management`
salvo. Implementado o Conversions API for Messaging (dataset separado do
Pixel do site, ID `1740865157112022`, ligado ao WhatsApp) — manda de volta
pra Meta o que acontece de verdade com um lead vindo de clique em anúncio
pro WhatsApp, pro algoritmo aprender a buscar quem compra de verdade.

- **`LeadSubmitted`** — dispara em `receive-leads` quando um lead novo
  chega via WhatsApp com `referral` de anúncio (facebook_ads/instagram_ads)
  E tem `ctwa_clid` capturado (obrigatório pro dataset, testado contra o
  validador real da Meta).
- **`Purchase`** — dispara via trigger de banco
  (`trigger_notify_lead_fechado`, mesmo padrão do CAPI de veículo vendido)
  quando `leads.status` vira `'fechado'`, chamando a função nova
  `meta-messaging-capi-purchase`. Usa `leads.valor_veiculo` como valor do
  evento.
- **Achado novo, capturado agora**: `ctwa_clid` (identificação do clique no
  anúncio) sempre chegou no `referral` do WhatsApp e sempre foi descartado
  — nova coluna `leads.ctwa_clid`.
- **Achado real testado contra a API da Meta** (não adivinhado): `page_id`
  vai dentro de `user_data`, não no nível raiz do evento (a ordem da tela
  do Payload Helper sugeria o contrário — testei com `TEST42877`, a Meta
  rejeitou até eu corrigir). `ctwa_clid` é obrigatório nesse dataset —
  sem ele a Meta rejeita o evento inteiro (por isso o guard "sem_ctwa_clid"
  nas duas funções, evita chamada fadada a falhar).
- **Page ID usado**: `1419304271478565` (confirmado pela Adriana — é o
  mesmo valor já salvo em `FACEBOOK_PAGE_ID`, mas hardcoded separado em
  `_shared/meta-messaging-capi.ts` pra não acoplar os dois usos). A tela
  de Payload Helper mostrava `150270571501412` como "conta conectada" —
  Adriana disse que está errado do lado da Meta (Configurações do Negócio,
  vínculo Página↔WhatsApp Business Account), não mexi nisso, é fora do meu
  alcance seguro por API.
- **Testado de verdade**: payload validado contra a API real da Meta com
  `test_event_code TEST42877` (função temporária, apagada); guard
  `sem_ctwa_clid` testado via chamada manual à função em produção — HTTP
  200, skip correto. **Não testado**: um evento real passando (precisa de
  um clique de anúncio de verdade, com `ctwa_clid` real, pra confirmar
  200 sem erro na Meta).
- Publicado: `receive-leads` v203, `meta-messaging-capi-purchase` v1 (novo),
  migração `leads_ctwa_clid_e_trigger_purchase_capi` +
  `notify_lead_fechado_capi_inclui_valor`.

## Sessão 13 (24/08/2026) — "Gerar com IA" da vaga agora pesquisa de verdade + gera SEO (JobPosting)

Pedido da Adriana: dar só o cargo e a IA fazer o resto "com maestria"
(pesquisar requisitos reais, seguir o modelo de escrita da vaga de SDR
que ela escreveu à mão, gerar palavras-chave de SEO), ela revisa antes
de salvar.

**Achado técnico importante, testado antes de implementar** (function de
diagnóstico temporária, deletada depois): `google_search` (busca real do
Google dentro da própria chamada do Gemini) e `responseMimeType:
'application/json'` (modo JSON estrito) **não funcionam juntos** — a
resposta vem vazia (sem erro, só sem `candidates`), o que seria fácil de
não perceber. A solução: pedir JSON só no texto do prompt (sem forçar o
modo), que funciona bem e sai limpo. Documentado no código de
`gerar-vaga-ia` pra não redescobrir isso do zero.

**Implementado**:
- `gerar-vaga-ia` reescrita: ativa `google_search`, usa a estrutura da
  vaga de SDR como MODELO (7 seções: Responsabilidades, Requisitos,
  Diferenciais, Perfil Comportamental, Benefícios, Chamada — não copia o
  texto dela, só a estrutura/tom), pede a descrição em markdown (mesmo
  editor novo da sessão), e gera 5-8 palavras-chave junto.
- Nova coluna `vagas.palavras_chave`. Painel ganhou campo pra ver/editar
  as palavras-chave geradas, junto com aviso de que a geração agora
  demora 20-40s (busca real) — mesmo cuidado de UX já aplicado na
  geração de imagem.
- **SEO de verdade**: `VagaDetalhe.tsx` agora manda uma ficha estruturada
  `JobPosting` (schema.org) pro Google — é isso que faz a vaga aparecer
  na busca de emprego do Google, não a tag "keywords" (que não pesa mais
  no Google há +15 anos, mas mesmo assim geramos ela também, só que pra
  organização/revisão da Adriana, não por peso de SEO real).
  `validThrough` usa prazo padrão de 60 dias da criação (não existe campo
  de prazo na vaga ainda).

**Testado**: a function inteira (prompt + busca + parsing) testada numa
function de diagnóstico temporária com o cargo "Vendedor(a) de
Automóveis" — resultado real, bem pesquisado (citou CNH B, tabela FIPE,
sistema CRM), markdown correto, palavras-chave relevantes. A ficha
JobPosting testada de verdade na página real da vaga SDR (localhost) —
JSON-LD válido, todos os campos corretos (endereço, logo, datas).
**Não testado**: o botão "Gerar com IA" dentro do painel de verdade (a
lógica de conexão é a mesma já usada pro resumo/imagem nessa mesma
sessão, já provada — só o encaixe final no formulário que falta ela
confirmar clicando).

## Sessão 13 (24/08/2026) — texto do post diferente por rede + confirmação real do markdown em produção

Duas coisas nessa rodada:

1. **Confirmação real da reescrita do editor pra markdown** (ver seção
   abaixo) — Adriana cobrou, com razão, que eu não podia afirmar "é o
   mesmo sistema do blog" sem checar. Fui conferir e achei que o blog
   guarda o conteúdo já em HTML pronto, não markdown — então o parser de
   markdown nunca era exercitado lá de verdade, minha afirmação anterior
   era imprecisa. Corrigido criando uma vaga temporária de teste (com
   negrito, itálico, lista e numeração) **direto no site de produção**
   (carroeciamotors.com.br), confirmando visualmente que renderizou
   certo, e apagando a vaga de teste logo em seguida (ficou no ar menos
   de 2 minutos).

2. **Texto diferente por rede social** — achado real: o post de vaga
   mandava o mesmo texto pra Facebook e Instagram, com "clique no link"
   — mas o Instagram nunca deixa link clicável na legenda (confirmado
   antes via doc oficial da Meta), então essa frase engana quem lê lá.
   `postarVagaNasRedes` agora cria **dois posts separados** (não mais um
   só pras duas redes): Facebook mantém "clique no link" (funciona lá);
   Instagram diz pra copiar o link + oferece o WhatsApp da loja como
   alternativa (`BRAND.whatsappDisplay`). Também melhorei o aviso na tela
   depois de clicar "Postar" pra deixar claro que publica em até 15
   minutos (achado 23/08: o aviso antigo não dizia isso, causou confusão
   de "não vi nada acontecer" quando na real só precisava esperar).
   Verificado por script local: textos ficam em 553 (Facebook) e 646
   (Instagram) caracteres com o resumo real da vaga SDR — bem dentro do
   limite de 2200.

## Sessão 13 (24/08/2026) — editor de texto reescrito: achado bug real de perda de dados, corrigido com markdown

Adriana perguntou se o editor básico de formatação (item 1 do pedido
anterior, contentEditable + `document.execCommand`) "deu certo". Eu não
tinha testado de verdade ainda (só lint/build). Testei ao vivo agora e
**achei um bug real de perda de dados**: selecionar um texto já digitado
e clicar num botão da barra (negrito, marcadores etc.) podia **apagar o
conteúdo inteiro** em vez de formatar — bug clássico e bem documentado da
combinação `contentEditable` + seleção de texto + React (é literalmente
por isso que ferramentas como TipTap/Slate/Lexical existem). Também achei
e corrigi no caminho um bug menor: reaplicar `dangerouslySetInnerHTML` a
cada tecla fazia o texto sair invertido durante a digitação.

**Decisão**: dado o risco real de perda de dados (ela poderia perder uma
descrição de vaga inteira sem aviso), abandonei a abordagem
`contentEditable`/`execCommand` completamente — não valia a pena tentar
remendar algo estruturalmente frágil. Reescrito usando **markdown simples**
(`**negrito**`, `*itálico*`, `- item`, `1. item`, `# título`) numa caixa de
texto comum (`<Textarea>`), com prévia renderizada ao vivo logo abaixo.
Os botões inserem a sintaxe usando `textarea.selectionStart/selectionEnd`
— API nativa, sem os problemas de seleção do contentEditable. **Reaproveita
`src/lib/markdown.ts` (`parseMarkdown`), o mesmo parser que o blog do site
já usa em produção** — não é código novo e arriscado, é um caminho já
testado. `descricao` da vaga agora é markdown, não HTML — `VagaDetalhe.tsx`,
`Vagas.tsx` (prévia da lista) e `services/vagas.ts` (resumo pra redes
sociais) atualizados pra rodar `parseMarkdown()` antes de qualquer
`stripHtml()`.

**Testado e confirmado de verdade** (não só lint/build) — negrito, listas
com marcador, numeração e título grande, todos aplicando certo no texto
selecionado e renderizando certo na prévia. Testei criando uma página
pública temporária (`/teste-editor-temp`, sem autenticação) só pra isso,
removida depois de usar (nada sobrou no `git status`).

**Achado à parte sobre como testar no navegador nesta máquina**: a
ferramenta de automação de navegador tira screenshot numa resolução que
NÃO bate com o tamanho real da página (`devicePixelRatio` ≠ 1) — clicar
em coordenadas de pixel baseadas no screenshot erra o alvo de forma
inconsistente (foi isso que me fez achar "bugs" fantasmas no início dos
testes). **Pra testar interação de verdade daqui pra frente, usar
`javascript_tool` com `getBoundingClientRect()` e/ou disparar eventos
direto via JS, não clique por coordenada de screenshot.**

## Sessão 13 (23-24/08/2026) — teste real de publicação da vaga SDR: Instagram funcionou, achado bug real no Facebook

Testei a publicação de verdade da vaga SDR sem precisar do login da
Adriana — descobri que o cron `publicar-social-cron-job` (roda a cada 15
min) chama a function via `net.http_post` direto no Postgres, usando
`public.get_internal_service_secret()` pra pegar o segredo sozinho. Dá
pra disparar essa mesma chamada manualmente por SQL pra testar publicação
de verdade sem precisar de login nem saber o segredo (só repetir a mesma
chamada que o cron já faz). **Registrar esse método** — evita reinvestigar
"como testar publicação sem login" da próxima vez.

**Resultado do teste**:
- Escrevi um resumo à mão pra vaga SDR (não consegui chamar a IA de
  resumo — mesma limitação de sempre, function exige login real) e salvei
  em `resumo_redes` direto por SQL. 353 caracteres, dentro do alvo.
- Criei o post e disparei a publicação de verdade. **Instagram publicou
  com sucesso** (media_id real) — confirma que a lógica do resumo curto
  funciona ponta a ponta.
- **Facebook falhou** — mas por um bug separado, já existente antes de
  qualquer mudança de hoje: token com a permissão `publish_actions`
  (descontinuada pela própria Meta). Confirmei que o mesmo erro já
  aparecia em publicações de outras vagas desde pelo menos 19h15 de
  23/08. **Afeta TODAS as publicações no Facebook via `publicar-social`,
  não só vaga** — precisa reconectar a Página do Facebook com permissões
  atuais (`pages_manage_posts` ou equivalente). Não é bug de hoje, é
  achado novo que precisa de ação da Adriana (ver "Precisa de decisão").
- **Achado à parte**: a Adriana já tinha clicado em "Postar" nessa mesma
  vaga antes (21h10 de 23/08), só que antes do resumo existir — criou um
  post de 4490 caracteres que falhou no Instagram por "legenda muito
  longa" e ficou preso na fila com erro. Apagado a pedido dela
  (24/08/2026) — o post do Instagram que publicou de verdade ficou no ar,
  a pedido dela.
- **UX esclarecida**: o botão "Postar" não é "Gerar rascunho" (não existe
  botão com esse nome) — é só "Postar" (ícone de compartilhar), na lista
  de Vagas Abertas, ao lado de Copiar link/Editar/Excluir. Ele **agenda**
  a publicação (fila que roda a cada 15 min), não publica na hora — o
  aviso na tela não deixava isso claro, causou confusão. Não mexi na cópia
  do toast ainda (fora do escopo pedido nessa rodada).
- **Confirmado via documentação oficial da Meta**: não dá pra colocar
  botão clicável tipo "Saiba mais" nem em Stories nem em Feed publicando
  via API automática — a doc da Meta diz explicitamente "publicar
  stickers (link, enquete, localização) não é suportado" em Stories via
  Content Publishing API. Link clicável em Stories só rolando manual
  dentro do app depois. Não é limitação do nosso código.

## Sessão 13 (23/08/2026) — editor de texto, resumo automático pra redes, layout da página de vaga

A pedido da Adriana, em bloco:

1. **Editor de texto básico na descrição** — `src/components/RichTextEditor.tsx`
   (contentEditable + `document.execCommand`, sem adicionar dependência
   nova): negrito, itálico, marcadores, numeração, tamanho da fonte. Usado
   no campo Descrição de `Vagas.tsx`. Descrição passa a guardar HTML (não
   mais texto puro) — página pública (`VagaDetalhe.tsx`) renderiza com
   `dangerouslySetInnerHTML` (mesmo padrão já usado pros artigos de blog
   nesse projeto, `BlogPost.tsx`); prévia truncada na lista do admin usa
   `stripHtml()` (novo helper em `src/lib/utils.ts`) pra não mostrar tags
   cru.

2. **Resumo automático pra redes sociais** — achado real testando com a
   vaga "Representante de Desenvolvimento de Vendas (SDR)" que a Adriana
   tinha acabado de criar: a descrição completa tem **4324 caracteres**,
   bem acima do limite de legenda do Instagram (2200) — se fosse publicada
   direto, quebraria a publicação no Instagram (Facebook tolera, Instagram
   não). Nova coluna `vagas.resumo_redes`; nova function
   `gerar-resumo-vaga` (Gemini, mesmo padrão de `gerar-vaga-ia`) gera um
   resumo curto (~450 caracteres) automaticamente ao salvar a vaga, sem
   precisar de botão separado — só não gera de novo se ela já editou um
   resumo à mão. Botão "Atualizar resumo" disponível a qualquer momento.
   `postarVagaNasRedes` agora usa esse resumo (com corte de segurança
   travado em 2200 caracteres, `LIMITE_CARACTERES_RESUMO_REDES` em
   `services/vagas.ts`) em vez da descrição completa. **Verificado**: testei
   a lógica de corte com o texto real da descrição do SDR — confirma que
   sem resumo o post ficaria travado exatamente em 2200 (não quebra), e
   com resumo fica em ~420 caracteres. **Não testei a geração do resumo
   pela IA ao vivo** (function exige login real) — só a lógica de limite.
   Escopo: cobre Facebook + Instagram feed (os dois já publicados pra
   vaga); não inclui Stories/Reels pra vaga (imagem quadrada não é o
   formato certo pra isso) nem LinkedIn — se ela quiser isso, é pedido à
   parte.

3. **CTA com link direto pra vaga**: `postarVagaNasRedes` agora usa a URL
   completa com `https://` (mais garantia de ficar clicável onde a
   plataforma permite) e frase de chamada mais forte ("👉 Candidate-se
   agora, clique no link"). Nota importante: **Instagram não deixa link
   clicável em legenda** — isso é limitação da própria plataforma, não do
   código (só "link na bio"). No Facebook funciona normal.

4. **Imagem cortada na página da vaga corrigida**: `VagaDetalhe.tsx` usava
   `object-cover` + `max-h-96`, que cortava topo/base de uma imagem
   quadrada dentro de um container mais largo que alto — indo contra a
   preferência já registrada da Adriana de nunca cortar/dar zoom em foto
   (ver `[[prioriza-consistencia-visual-cards]]`). Trocado pra
   `object-contain` + `aspect-square` + fundo branco — mostra a imagem
   inteira sempre. **Confirmado visualmente** (localhost, vaga SDR real):
   imagem aparece completa, incluindo o cartão de logo e o texto do cargo
   que tinham sido corrigidos antes nessa mesma sessão.

5. **Layout da página da vaga**: formulário de candidatura movido pra
   coluna da direita, começando no topo (`sticky`), descrição na coluna da
   esquerda — via CSS grid + `order` (mobile continua mostrando o
   formulário primeiro, antes da descrição longa). **Confirmado
   visualmente** (localhost) — layout responsivo funcionando como pedido.

Arquivos tocados: `RichTextEditor.tsx` (novo), `lib/utils.ts` (+`stripHtml`),
`services/vagas.ts`, `pages/admin/Vagas.tsx`, `pages/VagaDetalhe.tsx`,
`supabase/functions/gerar-resumo-vaga/` (novo), `supabase/config.toml`,
migration `vagas_adiciona_resumo_redes`, `lib/supabase/types.ts`.
`bun run lint`/`build` passaram limpos.

## Sessão 13 (23/08/2026) — logo só em fundo branco + texto da vaga no cartão + ajuste sempre visível

Feedback direto da Adriana depois de ver as imagens geradas: (1) a logo
fica ilegível em fundo preto/escuro — só funciona em fundo branco/claro.
(2) o campo de "pedir ajuste" tinha sumido — na real ele só aparecia
DEPOIS de escolher uma das 2 opções (`opcoesImagem.length === 0`); se ela
tentasse pedir ajuste antes de escolher, não tinha onde. (3) ela quer os
dados da vaga (cargo) escritos de verdade dentro do card branco da
imagem, não mais deixados em branco pra completar depois.

**Corrigido**:
- `gerar-imagem-vaga/index.ts`: prompt de geração do zero agora prende a
  logo a um "cartão de fundo BRANCO" explícito, com instrução clara de
  nunca colocar a logo sobre preto/escuro. No mesmo cartão, pede pra
  escrever de verdade "ESTAMOS CONTRATANDO" + o nome do cargo (`${titulo}`)
  — o `gpt-image-2` é bem melhor em renderizar texto que o `gpt-image-1`,
  por isso essa mudança só ficou viável agora. Prompt de ajuste (editar
  imagem existente) atualizado no mesmo sentido. Function reimplantada
  (versão 13). **Não testado ao vivo** (function exige login real) — pedir
  pra Adriana conferir se a logo saiu legível e o texto do cargo saiu
  legível/sem erro de digitação na próxima geração; texto gerado por IA
  não tem garantia 100% de grafia perfeita.
- `Vagas.tsx`: campo de ajuste agora aparece sempre que já existe alguma
  imagem gerada nessa sessão do diálogo — seja as 2 opções ainda não
  escolhidas, seja depois de escolher uma. Antes só aparecia no segundo
  caso.

## Sessão 13 (23/08/2026) — achado: geração de imagem "sumia" por demorar demais, sem aviso

Adriana reportou que a imagem da vaga "não foi gerada". Investigando pelos
logs (`function_edge_logs` + `logs_ia`), achei que **a geração sempre deu
certo no servidor** — 8 tentativas dela ao longo do dia, todas com
`status_code 200` e `logs_ia.status = 'sucesso'`. **Causa raiz real**: o
`gpt-image-2` gerando 2 imagens (`n=2`) leva de 45 a 90 segundos (esse
modelo "pensa antes de desenhar", é bem mais lento que o `gpt-image-1`) —
e a tela não avisava disso, só um spinner no botão. Ela devia estar
fechando a janela ou saindo da página antes do resultado chegar, achando
que travou — aí a atualização do estado (`setOpcoesImagem`) acontecia
num componente que já não estava mais visível/montado, e nada aparecia.
**Corrigido** (só front-end, sem mudar a function): (1) toast avisando
"pode levar até 1 minuto, não feche esta janela" assim que clica em
gerar; (2) card de carregamento visível dentro do próprio diálogo (spinner
+ o mesmo aviso), não só o botão; (3) diálogo agora **não fecha** enquanto
está gerando (nem pelo X, nem clicando fora, nem pelo botão Cancelar) —
garante que o resultado sempre aparece antes de dar pra sair da tela.
**Não recuperei as imagens das 8 tentativas anteriores** — foram geradas
de verdade e estão em algum lugar do R2 (`vagas/...png`), mas sem o nome
exato do arquivo não dá pra achar sem uma busca cara; não vale o custo,
é só gerar de novo (agora com o aviso, ela vai saber que precisa esperar).

## Sessão 13 (23/08/2026) — padrão único de imagem de vaga (2 pessoas, 2 opções)

A pedido da Adriana: a imagem "do zero" de `gerar-imagem-vaga` agora segue
um **padrão fixo**, não muda mais por cargo — mostra sempre duas pessoas
reais (uma mulher, um homem), roupa profissional, ambiente de
concessionária, logo oficial em destaque, área vazia reservada pro texto
do cargo (que continua sendo adicionado depois, fora da IA). O `titulo`
(cargo) parou de entrar na descrição visual do prompt — só é usado pra
validar que o campo foi preenchido. Cada geração agora retorna **2 opções**
numa chamada só (`n=2`), e o painel (`Vagas.tsx`) mostra as duas lado a
lado pra ela clicar em qual quer usar — nenhuma é salva até ela escolher.
Isso vale tanto pra "gerar do zero" quanto pro fluxo de "ajuste" (edita
imagem existente). Resposta da function mudou de `{url}` pra `{urls:
string[]}` — `gerarImagemVaga()` em `services/vagas.ts` já atualizado.
Function reimplantada (versão 12). `bun run lint`/`build` passaram limpos.
**Sessão interrompida no meio por limite de uso da assinatura Claude
(resetou 19h50) e retomada depois** — nada foi perdido, o código já estava
pronto e testado (lint/build), só faltava reimplantar, o que foi feito ao
retomar.

## Sessão 13 (23/08/2026) — gpt-image-2 em todo o sistema + rotina mensal de checar modelos novos

A pedido da Adriana, auditei o sistema inteiro atrás de qualquer função
que gere imagem por IA — **só existem duas**: `gerar-imagem-vaga` (já
trocada nessa mesma sessão, ver seção abaixo) e `gerar-imagem` (usada em
conteúdo de blog/artigos, chamada por `use-gerar-conteudo.ts`,
`ArticleSEOEditor.tsx` e `ImageEditorModal.tsx`). Ambas agora usam
`gpt-image-2`, já reimplantadas no Supabase (`gerar-imagem` versão 33).
Confirmado por grep (`api.openai.com/v1/images`) que não existe nenhuma
outra chamada de geração de imagem no projeto (nem Gemini/Imagen, nem
outro provedor).

**Rotina nova**: criada `verificar-atualizacoes-modelos-ia-carro-e-cia`
(`trig_01Ngz5GoZGfEPrxrSCj36ztp`), roda todo dia 1º do mês às 9h
(horário de Brasília) — confere se saiu modelo de imagem (OpenAI) ou
texto (Gemini) mais novo que os já em uso, e só avisa a Adriana se tiver
mesmo novidade oficial (ignora rumor/leak). Escopo por decisão dela:
cobre todos os modelos de IA do sistema, não só imagem. Modelos de texto
hoje (Gemini, não mexidos ainda): `gemini-3.6-flash` (principal, usado
pela Clara via `_shared/gemini-client.ts` + `gerar-conteudo-social` +
`gerar-vaga-ia`), `gemini-3.5-flash` (`gerar-conteudo`), `gemini-1.5-flash`
(fallback em alguns lugares), `gemini-2.0-flash`
(`_shared/whatsapp-conteudo.ts`).

## Sessão 13 (23/08/2026) — modelo gpt-image-2 na imagem da vaga + fidelidade da logo

A pedido da Adriana: (1) troquei o modelo de `gpt-image-1` pra `gpt-image-2`
em `gerar-imagem-vaga/index.ts` — confirmei antes que o modelo existe de
verdade (lançado em abril/2026, mesmo endpoint `/v1/images/edits`, mesmos
parâmetros) pra não trocar por um nome que não existe e quebrar a função.
Function já reimplantada no Supabase (versão 11, `ACTIVE`). (2) Investiguei
o relato de que "a IA não achou a logo oficial": as duas URLs de referência
(`logo-oficial.png` e `fachada-da-loja.png` no R2) **respondem 200 e sempre
estiveram acessíveis** — não era um problema de acesso. Baixei e comparei
visualmente as 3 imagens de vaga já geradas: 2 das 3 reproduziram a logo
real corretamente, mas a mais antiga ("Consultor(a) de Consórcios") saiu
com um logo **inventado** pelo modelo (um ícone de carro genérico, nada a
ver com a marca real). **Causa raiz**: inconsistência do próprio modelo de
imagem ao usar 2 referências (logo + fachada) juntas sem saber qual é
qual — não falta de acesso. **Corrigido**: prompt agora rotula
explicitamente "a primeira imagem anexada é a logomarca OFICIAL... NÃO
invente um logo novo", só nesse texto (o caminho de ajustar uma imagem já
existente continua sem essa instrução, já que aí só uma imagem é enviada).
gpt-image-2 também tem "instruction following" melhor segundo a OpenAI, o
que deve ajudar. **Pendente pra Adriana**: a imagem do "Consultor(a) de
Consórcios" continua com o logo errado — não consegui regenerar por aqui
(a function exige login de usuário real, não dá pra chamar de fora); da
próxima vez que ela entrar, é só abrir essa vaga em Vagas → editar → "Gerar
do zero de novo" que agora deve sair certo.

## Sessão 13 (23/08/2026) — página dedicada por vaga + formulário vinculado

A pedido da Adriana: (1) verifiquei qual IA gera a imagem da vaga — já era
`gpt-image-1` da OpenAI (o "GPT Image" que ela pediu), em `1024x1024`
(quadrado 1:1, formato que já cabe sem cortar em Instagram feed, Facebook
feed e LinkedIn). **Não precisou trocar nada, já estava certo.** (2)
Implementei a página dedicada por vaga: nova rota pública `/vagas/:id`
(aceita id ou slug, mesmo padrão de `/estoque/:id` dos veículos), mostrando
imagem + título + descrição completa + formulário de candidatura já
vinculado àquela vaga (sem menu suspenso pra escolher). Coluna `slug` nova
na tabela `vagas` (gerada sozinha a partir do título ao salvar, com sufixo
numérico se colidir). O post automático nas redes sociais e a lista "Temos
vaga!" da página genérica agora linkam direto pra página específica da
vaga. Painel admin ganhou botão "Copiar link" por vaga. Formulário
extraído pra um componente compartilhado (`FormularioCandidatura.tsx`),
usado nas duas páginas. **Testado ao vivo no navegador** (localhost) —
`/vagas/vendedor-a-de-automoveis` carregou com todos os dados certos e sem
erro de console; `/trabalhe-conosco` também, com os links das vagas na
lista. `bun run lint`/`bun run build` passaram limpos. Commit `16dac3c`,
já com push.

## Sessão 13 (23/08/2026) — regras da Clara sincronizadas + confirmado envio de mídia de veículo

A pedido da Adriana: (1) confirmei que a Clara já consegue mandar foto/vídeo
de veículo pro cliente sozinha, sem ela precisar pedir — ferramenta
`enviar_midia_veiculo` (até 5 fotos + 1 vídeo, só depois de já ter
consultado o estoque na mesma conversa), chamada quando "fizer sentido"
segundo o próprio prompt. (2) Ela pediu as regras atuais da Clara pra
analisar atendimentos reais — mandei um arquivo com prompt completo +
camada dinâmica (data/hora, número da loja, memória ativa,
instrução de ferramentas) + as 7 ferramentas que a Clara aciona de
verdade (`consultar_estoque`, `criar_lead_crm`, `salvar_email_lead`,
`agendar_visita`, `atualizar_estagio_lead`, `solicitar_atendimento_humano`,
`enviar_midia_veiculo`). **Achado no caminho**: `docs/clara-prompt.md`
(cópia de referência versionada) estava desatualizado desde 19/08/2026 —
faltava a seção "Qualificação do Lead" que já estava em produção
(`ai_prompts_config.prompt_text`) havia 4 dias. Corrigido — os dois lugares
batem de novo. **Lembrete pra próxima vez que o prompt mudar**: o doc já
tem instrução explícita ("Ao editar o prompt, atualize os dois lugares"),
mas na prática isso não estava sendo seguido — vale conferir sempre que
mexer em `ai_prompts_config` de novo.

## Sessão 13 (23/08/2026) — imagens no chat da Clara corrigidas

**Causa raiz achada e corrigida**: `receive-leads` só lia `msg.text?.body`
do webhook do WhatsApp — qualquer foto que um cliente mandasse virava
mensagem vazia no histórico **e nunca acionava a Clara** (o `if
(messageText)` que dispara o `ai-sdr` ficava falso). Achado real: 52
mensagens de cliente gravadas vazias no banco, a mais recente do dia
anterior (22/08) — provavelmente clientes mandando foto do carro que
querem vender/trocar, documento, etc., e a Clara simplesmente nunca
respondia, parecendo bug de atendimento.
- **Recepção**: imagem agora baixa da Graph API e re-hospeda no R2 (mesmo
  padrão do `rehospedarThumbnail` já usado pra thumbnail de anúncio),
  grava `[IMAGEM]<url>` no histórico, painel mostra a foto de verdade. A
  Clara (que não tem visão) recebe uma descrição textual do que chegou.
  Outros tipos (áudio, vídeo, documento, figurinha, localização) não têm
  tratamento dedicado ainda, mas também pararam de sumir em silêncio —
  geram um aviso genérico em vez de mensagem vazia. **Achado apontado
  como bônus, não implementado ainda**: o front (`ConversationPanel.tsx`)
  já tinha um bloco pronto pra mostrar transcrição de `[AUDIO]`, mas
  nenhuma function no backend nunca gerou essa tag — código morto que
  antecipava uma feature de transcrição que nunca foi construída.
- **Envio**: o painel (`/admin/conversas`) nunca teve como um atendente
  humano mandar foto pro cliente — `send-whatsapp` já sabia fazer isso
  (`action:'image'`, é o que a Clara usa pra mandar foto de veículo), só
  faltava a UI. Adicionado botão de anexo no `ConversationPanel.tsx`
  (upload pro R2 via `uploadToR2`, bucket `media`). Também corrigido:
  `send-whatsapp` gravava só o rótulo "[Imagem Enviada]" no histórico, sem
  a URL — painel não conseguia mostrar a foto enviada de volta. Agora usa
  o mesmo formato `[IMAGEM]<url>` dos dois lados da conversa.
- **Testado ao vivo** com payload de webhook simulado (media_id falso,
  força o caminho de fallback) — confirmado que a Clara respondeu de
  verdade pela primeira vez a uma mensagem de imagem. Registro de teste
  apagado. **Não dá pra recuperar as 52 imagens antigas** — o media_id
  nunca foi salvo antes da correção, e o link de mídia da Meta expira em
  minutos. Detalhe completo em `docs/leads-e-sdr.md`.

## Sessão 13 (23/08/2026) — menu lateral reorganizado por setor + item faltando na tela de permissões

A pedido da Adriana: (1) reorganizei o "Menu Principal" do painel admin em
submenus colapsáveis por setor — Vendas, Estoque/Portais, Financiamentos,
Financeiro/Administrativo, Marketing, Institucional (Administração e Área
de Ajuda ficaram como estavam, sem subgrupo). O submenu da rota atual abre
sozinho ao navegar; com o menu lateral em modo ícone (colapsado), os itens
voltam a aparecer soltos, sem o agrupamento. (2) Ela reportou que a tela de
permissões de usuário estava com vários itens de menu faltando pra
selecionar/autorizar — a causa raiz era `/admin/ml-diagnosis`: é uma rota
irmã de `/admin/portais` (acessada por um link de dentro da aba Mercado
Livre do Portais, não pelo menu lateral), então não caía no match por
prefixo (`pathname.startsWith(path)`) que cobre as sub-rotas normais.
Sem entrada no mapa `ROTA_SETORES`, ela ficava **liberada geral pra
qualquer login** — não era só sumiço na tela de permissões, era também um
gap de controle de acesso. Corrigido com uma linha nova no mapa (setor
Estoque/Portais). Alterações em `src/components/AdminLayout.tsx` e
`src/lib/setor-acesso.ts`, `bun run lint`/`bun run build` passaram limpos.
**Não testado logado no navegador** (sem credencial de admin nesta sessão
— limitação de sempre); confirmei só que a página carrega sem erro de
console até a tela de login. Pedir pra Adriana dar uma olhada no menu novo
na próxima vez que ela entrar e avisar se algum setor ficou estranho.

## Sessão 13 (23/08/2026) — usuário Roberto Junior resolvido

**Achado real**: a Adriana perguntou por que o "Roberto Junior" (vendedor)
não aparecia na lista de usuários. Investigando, achei **duas contas
diferentes** ao longo do histórico do projeto:
- `roberto@carroecia.com` (domínio antigo, criada 14/04/2026 via migration
  `add_access_control.sql`) — essa foi **apagada de verdade** em algum
  momento (sumiu de `auth.users` E de `usuarios`, sem migration nem log
  registrando quem/quando — não existe tabela de auditoria de usuários no
  projeto, só `ads_audit_logs` que é sobre anúncios).
- `roberto@carroeciamotors.com.br` (domínio novo, criada 29/06/2026) —
  essa **existe em `auth.users` (login válido) mas nunca teve linha em
  `usuarios`** — por isso não aparecia na lista (a tela lê de `usuarios`,
  não de `auth.users`). Provavelmente um cadastro que travou no meio.

**Corrigido**: completei o perfil que faltava pra essa segunda conta e
defini a senha nova que a Adriana passou (`Roberto94@@`, ela mesma vai
pedir pra ele trocar no primeiro acesso) — usando `auth.admin.updateUserById`
via function temporária (mesmo caminho do `criar-usuario-admin` oficial,
nunca senha em texto plano em migration). Nível `operador`, setor
**Vendas**. Function de apoio já removida do Supabase e do disco, `git
status` limpo — não sobrou nada versionado dessa operação.
**Não recriar essa conta do zero se o problema reaparecer** — primeiro
conferir se é o mesmo padrão (login existe, perfil não) antes de tentar
`createUser` de novo (vai dar erro de e-mail duplicado).

## Sessão 12 (22/08/2026) — sem mudança de código, só duas coisas fora do projeto

- **Triagem de candidatos "Assistente financeiro" no LinkedIn Hiring**: a
  pedido da Adriana, revisei os 26 candidatos da vaga (link
  `linkedin.com/hiring/jobs/4452586753`) via navegador (Chrome com a sessão
  dela logada), avaliando formação/experiência/respostas de triagem, e
  entreguei um ranking do mais pro menos compatível. **Top recomendado pra
  entrevistar primeiro**: Kathyuça Melo e Larissa Felix (aderência forte,
  sem risco de overqualification). Joe Luiz, Lidyane Guerra e Gilberto
  Hermann ficaram como "plano B de luxo" — os currículos tecnicamente mais
  fortes (todos com décadas de experiência em contábil/financeiro), mas
  arriscam ser seniores demais/caros demais pra uma vaga de assistente.
  Achados de alerta: 3 candidatas (Jane Vogado, Gabriela Duarte, Mariana S.)
  declararam muitos anos de experiência financeira na pergunta de triagem
  sem nenhum respaldo no histórico de cargos exibido — vale conferir na
  entrevista antes de confiar no número. Duas candidatas fortes tecnicamente
  (Adeliane Cristina Barbosa Batista, Maria Bárbara Silveira Orlando)
  responderam "Não" pra presencial/início imediato — desqualificador
  provável dado que a vaga é presencial e urgente. **Isso é uma tarefa
  pontual de RH, não altera nada no código/site** — não repetir essa
  triagem do zero se a Adriana perguntar de novo sobre esses candidatos,
  só relembrar o ranking acima.
- **2 conectores MCP novos adicionados (escopo `user`, disponíveis em
  qualquer sessão/projeto)**: `microsoft-learn` (docs oficiais LinkedIn/
  Microsoft — foi o que permitiu pesquisar a fundo os requisitos do
  Community Management API) e `magnific` (`mcp.magnific.com`) — este
  último ainda com status "Needs authentication", falta a Adriana rodar
  `/mcp` e autenticar antes de usar.

## O que está no ar hoje

- **LinkedIn — publicação como membro pessoal no ar e testada ao vivo;
  página da empresa aguardando aprovação do LinkedIn (21/08/2026, sessão
  11)**: a pedido da Adriana pra "ativar LinkedIn e WhatsApp pra publicar".
  LinkedIn não tem MCP (diferente de Meta/Google Ads) — verificado e
  explicado a ela. Construído o fluxo completo: tabela `linkedin_integracao`
  (linha única, token + `author_urn`), `linkedin-oauth-start` (gera link de
  autorização) e `linkedin-oauth-callback` (troca code por token, identifica
  o membro via OpenID Connect `/v2/userinfo`) — Edge Functions, migration e
  botão "Conectar LinkedIn" em `RedesSociais.tsx` (Central de Redes Sociais
  → Publicações), tudo no ar.
  **Pivô importante no meio do caminho**: a Adriana leu a doc oficial
  (Share on LinkedIn, via microsoft-learn MCP) e descobriu que o que estava
  de fato aprovado no app dela (self-serve, sem revisão) é `w_member_social`
  — posta como MEMBRO, não como página (`w_organization_social` exige o
  produto separado "Community Management API", com revisão formal da
  LinkedIn). Recodificado pra esse escopo real: `linkedin-oauth-start`
  pede `openid profile w_member_social`, `linkedin-oauth-callback` busca
  `author_urn`/`author_nome` via userinfo (não mais `organizationAcls`),
  bloco de publicação real adicionado em `publicar-social` (POST
  `/v2/ugcPosts`, só texto por enquanto — imagem/vídeo no LinkedIn exige
  fluxo de upload em 3 passos, não implementado).
  **Testado ao vivo com sucesso**: Adriana autorizou como Luiz Fernando
  Rodrigues de Araújo, post de teste publicado (`urn:li:share:...`),
  confirmado que satisfaz o pipeline real (`payload_erro` com `post_id`
  real) — post de teste apagado depois via API (DELETE, 204 confirmado).
  **Confirmado que NÃO aparece na página da empresa** — é o comportamento
  esperado do escopo member, não bug.
  **Em andamento pra publicar na página de verdade**: a Adriana já iniciou
  a verificação da página no LinkedIn e pediu "Request Access" pro produto
  "Community Management API" (`w_organization_social`) em 21/08/2026 —
  aprovação sem prazo fixo divulgado pela LinkedIn (não é confiável a
  estimativa "1-4 semanas" que dei antes, baseada em busca genérica, não na
  doc oficial). **Lembrete agendado pra 26/08/2026 09h** (rotina cloud
  `trig_01TXYbwdUr6yMcRnMMrwBJxq`) pra ela checar o status do pedido —
  quando aprovado, preciso mudar o escopo pra `w_organization_social`,
  voltar a buscar `organization_urn`/`organization_nome` (código removido
  do callback quando pivotei pra escopo member — reescrever, não só
  reverter, porque a estrutura do lookup usa `organizationAcls`, permissão
  diferente) e trocar o `author_urn` usado em `publicar-social` pela URN da
  organização. Detalhe completo (requisitos, processo de 2 tiers
  Development/Standard, permissões) em `docs/linkedin-integracao.md`.
- **WhatsApp "publicar" — decisão tomada, implementação ainda não
  (21/08/2026)**: perguntei o que ela queria dizer com "publicar no
  WhatsApp" — Status (não suportado pela API oficial da Meta pra número de
  negócio; serviços que prometem isso usam automação não-oficial, risco de
  banimento) vs Canal (não confirmado se a API oficial libera isso pra
  terceiros) vs mandar o post como mensagem de template (ela escolheu essa).
  Achado no caminho: já existe uma tela pronta pra isso
  (`WhatsAppScheduler.tsx`, dentro de Marketing → aba WhatsApp, mantida
  quando a aba duplicada "Redes Sociais" foi removida ontem) — seleciona
  template aprovado + telefone + agenda — mas **a tabela
  `whatsapp_templates` está vazia** (zero templates sincronizados) e
  **nenhuma função sincroniza os templates aprovados da Meta pra lá**.
  `send-whatsapp` já sabe mandar mensagem de template
  (`action:'template'`), só falta a sincronização de templates e a conexão
  com `publicar-social`. Não implementado ainda — depende da Adriana
  aprovar pelo menos 1 template no WhatsApp Manager da Meta primeiro
  (esse passo é rápido, não é como o do LinkedIn).
- **Instagram Stories habilitado + tela duplicada de post social removida
  (20/08/2026)**: testei ponta a ponta a publicação social a pedido da
  Adriana (achei a conexão Facebook/Instagram saudável, token com todas as
  permissões — ela mesma vinha ajustando `FACEBOOK_PAGE_ID`/
  `META_PAGE_ACCESS_TOKEN` nas horas anteriores) e ela decidiu implementar
  Stories no Instagram primeiro (Facebook Stories fica pra depois — endpoint
  diferente, `/photo_stories`, permissão do app não confirmada). Seletor
  "Formato" (Feed/Stories/Reels) adicionado em `RedesSociais.tsx` (Central de
  Redes Sociais → Publicações); `publicar-social` lê `content_type` e manda
  `media_type: 'STORIES'` pro Instagram quando selecionado — sem legenda,
  Stories não exibe via API. Se vier Stories + Facebook marcado, cai em erro
  claro em vez de publicar errado no feed. **Bug real achado e corrigido no
  primeiro teste ao vivo**: Story de foto publicado sem esperar o container
  processar devolvia sucesso do Meta (`media_id` retornado) mas o Story não
  existia de verdade (sumia de `GET /{ig-id}/stories`) — corrigido fazendo
  Stories esperar `status_code=FINISHED` igual vídeo já esperava. **Segundo
  teste confirmou de verdade** (media_id apareceu em `active_stories`, não só
  "Publicado" no banco) — registro de teste apagado, Story real segue ativo
  no Instagram por 24h (some sozinho). Junto (pedido explícito dela,
  "inclua a unificação no escopo"): removida a aba "Redes Sociais" de dentro
  de `Marketing.tsx` — achado real: ela devia ter saído quando a Central de
  Redes Sociais foi criada em 14/08/2026 (o comentário em `CentralSocial.tsx`
  já dizia isso), mas ninguém tinha apagado. Tinha formulário próprio
  divergente (`redes` em array, não objeto; opção "Google Meu Negócio" que
  nunca teve implementação nenhuma) e duplicava o Painel de Aprovação que já
  existia na Central. Marketing.tsx agora só tem WhatsApp e Analytics.
  **Pendência em aberto, decisão da Adriana**: achei que LinkedIn e WhatsApp
  também aparecem como opção de rede no formulário (`RedesSociais.tsx`), mas
  não têm nenhuma implementação — se alguém marcar só essas duas, o post vira
  "Publicado" sem nada acontecer (mesma classe de bug do "Ideias com IA").
  Perguntei se ela quer remover as opções ou implementar de verdade — ainda
  sem resposta, não mexi. Detalhe completo em `docs/meta-integracao.md`.
- **Webmotors — 2 correções de causa raiz + 2 regras novas (20/08/2026)**:
  investigando os "2 pendentes" e o log de erro que a Adriana viu no painel.
  (1) **Causa raiz corrigida**: `wm-confirmar-mapeamento` confirmava
  modelo/versão e marcava `mapeado`, mas nunca gravava
  `codigo_cor_wm`/`codigo_cambio_wm`/`codigo_combustivel_wm` — o guard do
  `wm-sync` bloqueava a publicação, mas o painel dizia "liberado pra
  sincronização" (mesma classe de bug do achado em `publicar-social` hoje).
  `matchCatalogoExato` foi extraída pra `_shared/wm-catalogo-match.ts` e
  agora roda também aqui; se cor/câmbio/combustível não baterem no catálogo,
  volta pra `revisao_necessaria` com aviso claro em vez de mentir "sucesso".
  Achado real corrigido na hora: Honda City Hatchback Touring (`TCQ0B23`,
  tinha 5 tentativas falhas hoje) — completei o mapeamento manualmente
  (cor/câmbio/combustível batiam certinho no catálogo) e testei ao vivo:
  publicado com sucesso, `CodigoAnuncio 78229773`, 20 fotos enviadas, 0
  falhas. (2) **Nova regra — exclusão permanente**: a pedido da Adriana,
  Toyota Hilux SW4 SRX (`PYT5J89`) e RAM Rampage R/T Hurricane (`GTN5D81`)
  não serão publicados na Webmotors — `status_sincronizacao =
  'excluido_manualmente'`, e `wm-mapear-veiculo` agora respeita esse status
  (não reavalia se o veículo for salvo de novo no admin). (3) **Nova regra —
  fila não fica mais travada por cota estourada**: quando a modalidade
  Básico está cheia, `wm-sync` agora remove a linha da fila em vez de deixar
  presa em "erro" pra sempre (achado: 4 veículos parados desde 13/08/2026,
  7 dias, sem ninguém conseguir agir — limpos manualmente também). Detalhe
  completo em `docs/webmotors-integracao.md`, seção "Correções e regras
  novas — 20/08/2026".
- **Post de "Ideias com IA" corrigido — não era publicado de verdade
  (20/08/2026)**: achado em teste ao vivo — `IdeiasSociais.tsx` salvava
  `social_posts.redes` como lista (`['facebook','instagram']`) em vez do
  formato objeto que `publicar-social` espera; sem bater o formato, nenhuma
  rede era chamada e o post virava "Publicado" com sucesso vazio (silencioso,
  sem erro registrado). Corrigido nos dois lados (salva certo + normaliza
  formato antigo defensivamente) e o log de integração agora grava o
  `post_id`/link real do Facebook e `media_id` do Instagram em todo sucesso,
  não só quando dá erro. Detalhe em `docs/meta-integracao.md`.
- **Encaminhamento de consórcio/seguro corrigido + número novo dedicado
  (19/08/2026, sessão 9)**: autocrítica sobre o mapeamento da Clara achou
  que `encaminharParaParceiro()` (`ai-sdr/index.ts`) só avisava o parceiro
  por dentro — o cliente nunca recebia link nenhum, e a Clara continuava
  ativa no mesmo chat depois de "encaminhar" (risco de responder sobre
  assunto que não domina). Corrigido: agora manda o cliente um link
  `wa.me` pro número certo e desliga a IA pra esse lead (`ai_enabled =
  false`), igual já acontecia em `solicitar_atendimento_humano`. Aplicado
  aos dois tipos (consórcio e seguro auto). Junto, criado um WhatsApp
  Business novo (`5534998037651`) só pra consórcio — antes usava o celular
  pessoal da Adriana (`5534984080220`), que agora fica só pra alertas
  administrativos internos. Trocado em `ConsorcioAuto.tsx`, `Sobre.tsx`
  (card "Falar com Adriana") e `PARCEIROS_ENCAMINHAMENTO`. Detalhe
  completo em `docs/origem-leads.md` e regra de roteamento atualizada no
  `CLAUDE.md`.
- **Origem de leads — clique do site agora rastreado (19/08/2026, sessão 9)**:
  auditoria pedida pela Adriana nos 50 leads mais recentes achou que
  clique em botão de WhatsApp do site (12 pontos diferentes, todos via
  `handleCommercialCTA`) não carregava nenhum dado de volta pro CRM — um
  link `wa.me` é só texto. Toda mensagem sem o pacote de anúncio da Meta
  caía em `whatsapp_organico`, misturando cliente que clicou no site com
  contato realmente espontâneo. Corrigido: `cta-router.ts` embute uma
  referência (página/botão/veículo/UTM) no fim da mensagem pré-preenchida
  — `receive-leads` lê, grava origem `site_whatsapp` com os dados certos,
  e remove a tag antes de salvar no histórico ou mandar pra Clara.
  Reaproveitou o `obterAtribuicaoAnuncio()` que já existia (17/08) e só
  era usado nos formulários de consignação. Testado ao vivo com payload
  simulado — funcionando, registro de teste apagado. Detalhe completo em
  `docs/origem-leads.md`.
  **[RESOLVIDO 19/08/2026] `ai_score` e `temperatura` (itens 2 e 3)**:
  achado mais fundo — não era só `ai_score` nunca escrito, era
  `atualizar_estagio_lead`/`agendar_visita` praticamente nunca chamados
  pela Clara na prática (lead com 36 mensagens trocadas ainda em
  status='novo'; `agendamentos_visita` com 0 registro em todo o banco).
  Corrigido com 3 mudanças: (1) `ai_score` agora calculado por código
  (`_shared/lead-score.ts`), sem depender de nenhuma decisão da IA —
  soma pontos por veículo identificado, 5+ mensagens, e-mail, visita
  agendada, origem paga; (2) prompt da Clara ganhou seção nova
  "QUALIFICAÇÃO DO LEAD" com gatilhos concretos de quando marcar
  morno/quente; (3) bug pequeno corrigido — filtro de leads quentes no
  comando do WhatsApp buscava `Quente` maiúsculo, nunca batia com nada.
  Testado ao vivo com conversa simulada completa (4 mensagens): score
  foi 0 → 15 → 75, temperatura virou quente, status virou agendamento,
  e o primeiro `agendamentos_visita` da história do banco foi criado.
  Detalhe completo em `docs/origem-leads.md`.
  **[RESOLVIDO 19/08/2026] Itens 6 e 7 (vocabulário de `origem` +
  alerta de canal silencioso)**: padronizado `origem` num conjunto
  fechado de valores (whatsapp_organico, site_whatsapp, facebook_ads,
  instagram_ads, meta_lead_ads, facebook_dm/instagram_dm,
  comentario_facebook/instagram, google_ads, site_formulario,
  site_consignacao, mercadolivre/webmotors/icarros, avaliacao_avulsa,
  manual, clara) em ~9 arquivos que gravavam texto livre cada um do seu
  jeito. Registros antigos também padronizados (78 'whatsapp' →
  whatsapp_organico, 2 'LP' → site_consignacao). Removida a pergunta
  "Como nos conheceu?" do formulário de consignação da home (decisão da
  Adriana) — colidia com o campo técnico de origem.
  `daily-report-cron` ganhou alerta: se facebook_ads/instagram_ads/
  whatsapp_organico/site_whatsapp ficar 7+ dias sem lead, avisa no
  relatório diário do WhatsApp. Detalhe completo em `docs/origem-leads.md`.
  **Adiado pro futuro (decisão da Adriana)**: confirmar webhook do
  Mercado Livre/Webmotors nos portais; NaPista não tem webhook de lead
  nenhum, só endpoint de consulta — precisaria de cron.
  **[RESOLVIDO 19/08/2026] Imagem do anúncio no Conversador**: achado —
  a Meta sempre mandou `thumbnail_url`/`video_url` do criativo do anúncio
  no `referral`, nunca foi guardado (mesmo padrão do achado de
  `referral.body`, 17/08). 2 colunas novas em `leads`
  (`anuncio_thumbnail_url`, `anuncio_video_url`) — `receive-leads` baixa a
  imagem e re-hospeda no R2 (o link da Meta expira), grava o link do
  vídeo direto (não expira). `ConversationPanel.tsx` mostra a imagem no
  lugar do avatar, clicável pro anúncio no Facebook. Testado ao vivo com
  payload simulado — imagem confirmada acessível publicamente. Detalhe em
  `docs/origem-leads.md`.
- **NaPista — PRODUÇÃO LIBERADA, 25/25 VEÍCULOS PUBLICADOS DE VERDADE
  (18/08/2026, sessão 8)**: NaPista aprovou o client_id `carro-e-cia` pra
  produção. Migrei toda a integração (5 functions) de
  `api.development.napista.com.br` pra `api.napista.com.br` de verdade,
  reautentiquei do zero (novo sellerId real). Achado grande: já existiam
  **19 anúncios reais publicados antes da nossa integração** (carregados
  por outro canal, não pela nossa function) — 14 batiam com o estoque
  atual (adotados no controle interno, sem duplicar), 5 eram de veículos
  já vendidos/devolvidos (despublicados). Sincronizei catálogo de
  produção (92 marcas), mapeei os 25 veículos disponíveis (14 usando o
  `versionId` real já publicado, sem chute; 11 por correspondência de
  texto, a maioria revisada manualmente) e publiquei os que faltavam.
  **3 bugs reais achados e corrigidos na hora**: (1) `napista-sync` cria
  o anúncio mas não publica sozinho (fica em DRAFT, precisa de um PUT
  separado — ainda não corrigido na function, só contornado manualmente
  desta vez); (2) `sync_para_estoque` pulou KIA e VOLKSWAGEN
  silenciosamente (populei na mão); (3) chamar a function duas vezes com
  fila cheia duplicou 1 anúncio (Kia Sportage — órfão apagado). Resultado
  final confirmado direto na API: 25 publicados, 0 rascunhos, 0
  duplicatas. Detalhe completo em `docs/integracao-napista.md`.
  **[RESOLVIDO 18/08/2026]** `napista-sync` corrigida — depois de criar
  o anúncio e subir as fotos, chama `PUT .../PUBLISHED` automaticamente.
  Testado ao vivo com veículo fake temporário (apagado depois): criado já
  como `PUBLISHED`, sem passo manual.
  **[INVESTIGADO 19/08/2026]** causa raiz do erro silencioso de
  `sync_para_estoque` (KIA/VOLKSWAGEN sem modelo cacheado): refiz a mesma
  sequência de chamadas, todas as 14 marcas responderam 200 — não achei
  bug reproduzível, mais provável foi falha pontual de rede daquele dia.
  Como não dá pra corrigir a causa (não é determinística), adicionei
  mitigação: `napistaFetch()` tenta 2x antes de desistir, e os `upsert`
  de marca/modelo agora logam erro real em vez de falhar em silêncio.
- **Assinatura eletrônica via Autentique — FUNCIONANDO DE PONTA A PONTA
  (18/08/2026, sessão 8)**: a Adriana confirmou que `AUTENTIQUE_TOKEN` já
  estava configurado — o problema real eram **3 bugs de integração** na
  `enviar-para-assinatura`, nunca detectados porque a function tinha um
  modo mock silencioso (removido). Achados e corrigidos, testando ao
  vivo com a API real do Autentique:
  1. `document.file` mandava a URL como texto — o schema exige upload de
     arquivo de verdade (`Upload!`, multipart/form-data). Corrigido:
     baixa os bytes do PDF e sobe via `FormData` nativo do Deno.
  2. `webhook_url`/`auto_remind`/`expires_in` não existem em
     `DocumentInput` — código antigo inventava esses campos. Removidos.
  3. O cliente não é sempre `signatures[0]` — o Autentique adiciona a
     conta dona do token como signatário extra automaticamente. Corrigido
     pra buscar o assinante certo pelo nome, não pela posição. Também
     corrigido `signatures[].url` (não existe) pra
     `signatures[].link.short_link` (correto).
  Decisão da Adriana no caminho: cliente é assinante só por **nome**, sem
  e-mail (com e-mail, o Autentique manda convite direto e não devolve
  link pra gente controlar via WhatsApp/e-mail); e-mail da loja usa
  domínio do **Resend** (`vendas@carroeciamotors.com.br`), não do Brevo
  (que é só pra marketing) — `BREVO_SENDER_EMAIL` também estava causando
  erro de validação por conta própria. **Testado com 2 documentos reais
  criados no Autentique** (2 dos 20/mês usados, autorizada pela Adriana);
  segundo teste confirmou o link de assinatura do cliente vindo certo
  (`https://assina.ae/...`). Registros de teste apagados do banco.
  **[RESOLVIDO 18/08/2026]** "Enviar E-mail" no `AssinaturaDialog.tsx`
  agora dispara e-mail de verdade via Resend com o link de assinatura
  (antes só mostrava/copiava o link e mentia dizendo que tinha enviado).
  `enviar-para-assinatura` reimplantada com o parâmetro `enviar_email`.
  Testado ao vivo: template isolado (confirmado recebido) + fluxo
  completo pela function real (3º dos 20 documentos/mês do Autentique
  usado, sobram 17) — `email_status.enviado: true`, e-mail recebido com
  link funcionando. Registro de teste apagado.
  **Em aberto pra depois**: webhook de conclusão (`webhook-autentique`)
  não testado ao vivo, precisa confirmar se está registrado no painel da
  conta Autentique.
- **Decisões sobre os achados da Documentação de API implementadas
  (18/08/2026, sessão 8)**: a Adriana decidiu, item por item, o que fazer
  com os achados de código morto/incompleto encontrados. Implementado:
  - **`ai-agents` removida** — `src/lib/ai-agents.ts`,
    `supabase/functions/ai-agents/` apagados, function desimplantada do
    Supabase.
  - **`gerar-imagem` corrigida** — agora grava no R2 (mesmo padrão de
    `gerar-imagem-vaga`), não mais no Supabase Storage. Reimplantada.
  - **`gerar-pdf-contrato` reescrita por completo** — antes só devolvia
    HTML pro navegador imprimir, sem persistir nada; agora gera PDF real
    (jsPDF) pra qualquer um dos 4 tipos de contrato (venda, compra,
    consignação, termo de entrega — não só consignação, a pedido da
    Adriana, já que qualquer documento que precise de assinatura remota
    deve ter essa opção) e sobe pro bucket `contratos-consignacao`.
    **Achado no caminho**: o bucket tinha `allowed_mime_types =
    ['document/pdf', ...]` — "document/pdf" não existe como MIME type
    (o certo é `application/pdf`), bloquearia qualquer upload de PDF
    real que já tivesse sido tentado. Corrigido.
  - **Migration `contratos_consignacao_tipo_documento`** — tabela ampliada
    com coluna `tipo_documento`, cobre qualquer tipo de contrato agora,
    não só consignação.
  - **Nova seção "Gerar Documento de Contrato" em
    `/admin/modelos-documentos`** — achado no caminho: o painel de ações
    do contrato (`PainelContratoAcoes.tsx`, com os 3 botões
    DOCX/PDF/Assinatura Autentique) **nunca tinha sido colocado em
    nenhuma tela do sistema** — existia no código, órfão. Construída
    seção nova (mais simples, não reaproveitou os componentes órfãos
    porque o formato de dado deles é específico de consignação) com
    seletor de tipo de documento + veículo (opcional, preenche
    proprietário automático) + geração de PDF + botão de assinatura via
    Autentique.
  - **Testado ao vivo, ponta a ponta**: gerei um "Contrato de Venda" de
    teste via `curl` direto — PDF real confirmado (magic bytes `%PDF-1.3`
    corretos). Testei o envio pro Autentique com esse PDF real (usando 1
    dos 20 do limite mensal, autorizado pela Adriana) — **ainda caiu em
    modo mock**, confirmando que o problema real agora é só o
    `AUTENTIQUE_TOKEN` (ausente/inválido), não mais o PDF. Registro de
    teste apagado do banco; sobrou 1 arquivo PDF de teste no Storage
    (privado, sem dado sensível) que não consegui apagar sem sessão de
    usuário — baixa prioridade.
  - **Mantido sem mexer (decisão da Adriana)**: `sync-estoque` e
    `admin-plataformas-api` continuam arquivadas, sem remoção.
  - **[RESOLVIDO 18/08/2026] Migração R2 — já tinha sido feita por fora.**
    A Adriana lembrou que já tinha rodado essa sincronização via
    PowerShell dias antes; conferido no Storage e confirmado: os 10
    buckets que `auto-migrate-r2` migraria estão todos vazios hoje, só
    sobrou dado nos 3 buckets pequenos esperados. Rotacionei
    `AUTO_MIGRATE_SECRET` (valor antigo ilegível) e implantei
    `auto-migrate-r2` pela primeira vez (nunca tinha sido implantada,
    só existia no código) achando que precisaria rodar — achei um bug
    real (`unexpected end of file`, incompatibilidade AWS SDK x Deno) mas
    não vale a pena corrigir agora, não tem mais nada pra migrar. Detalhe
    em `docs/admin-infraestrutura.md`.
  - **Correção de achado anterior**: o botão "Compartilhar veículo" (que
    eu tinha documentado como "não existe") **já existia** —
    `Veiculo.tsx`, ícone `Share2`, já usa `getShareUrl()` que já gera o
    link `/s/{slug}` corretamente. Minha busca anterior não pegou porque
    o link é montado num template string. Corrigido em
    `docs/admin-infraestrutura.md`.
- **Sitemap corrigido (18/08/2026, sessão 8)**: `public/sitemap.xml`
  (estático, parado desde 20/04/2026, só 9 veículos) removido; regra nova
  em `public/_redirects` faz `/sitemap.xml` redirecionar (301) pra function
  `sitemap`. **Primeira tentativa (status 200/proxy) quebrou o deploy** —
  Cloudflare Workers Static Assets só permite proxy pra caminho relativo
  do mesmo domínio, não URL externa (erro exato:
  "Proxy (200) redirects can only point to relative paths"). Descoberto
  investigando via API do Cloudflare (`workers/scripts/.../builds`) depois
  que o primeiro push não refletiu no site — o deploy tinha falhado
  silenciosamente, site continuou no ar normal com a versão anterior, só
  a correção que não subiu. Corrigido pra 301 (mesmo padrão do `/s/:slug`
  do `og-vehicle`, já comprovado funcionando) e reenviado. **[FECHADA]
  Confirmado em produção** (commit `86b6c48`, build com sucesso):
  `/sitemap.xml` redireciona (301) e devolve 40 URLs reais (10 fixas + 25
  veículos + 5 posts), todas com `<lastmod>` — antes eram 19 sem data
  nenhuma.
- **Documentação de API — CONCLUÍDA (18/08/2026, sessão 8)**: os 4 grupos
  (67 functions, `docs/documentacao-api.md`) + os 4 artigos resumo na
  Central de Ajuda (`grupo='dev_ti'`) — um por grupo, apontando pro doc
  técnico completo. Junto, corrigido um achado real: `gerar-conteudo` foi
  a única function do projeto que não tinha a rede de segurança das duas
  grafias da chave do Gemini (`GEMINI_APY_KEY`, nome real confirmado pela
  Adriana, vs. `GEMINI_API_KEY`) — corrigida e reimplantada
  (`supabase functions deploy gerar-conteudo`).
- **Correção de achado anterior (18/08/2026)**: o trigger órfão removido
  ontem (`sync_to_crm`) não apontava pra "sobra de template" como eu tinha
  concluído — apontava pra um projeto Supabase real da Adriana ("CRM
  CARRO E CIA"), só que numa organização diferente
  (`carroeciamotors_crm`) que eu não enxergava antes. **Escopo confirmado
  pela Adriana**: trabalhar só neste projeto (`htpcqdbhktmvppfemnad`,
  "Projeto Site Carro e Cia") — nunca investigar os outros projetos dela.
  Varredura completa feita a pedido dela (código + todas as colunas de
  texto/JSON do banco + cron + funções) confirmando que não sobrou
  nenhuma outra referência a projetos externos além do trigger já
  removido.
- **Documentação de API — grupo 4 (Infraestrutura) escrito, os 4 grupos
  completos (18/08/2026, sessão 8)**: `admin-infraestrutura.md` (5
  functions — R2 e SEO). **Achado mais concreto da sessão inteira**:
  `/sitemap.xml` (prometido no `robots.txt` pro Google) responde 200 com
  XML válido, mas **não vem da function `sitemap`** — vem de
  `public/sitemap.xml`, arquivo estático parado desde **20/04/2026**, com
  só 19 URLs (9 veículos) contra os 25 veículos disponíveis hoje. A
  function que geraria o sitemap certo, ao vivo, nunca é chamada — o
  arquivo estático sempre ganha. Achados menores: `og-vehicle` (prévia
  rica de veículo pro WhatsApp/Facebook) está pronta mas nada no site
  gera o link `/s/{slug}` que a aciona; `auto-migrate-r2` e
  `migrar-storage-r2` (migração Supabase Storage → R2) rodaram uma vez,
  travaram/pararam, sem cron — conecta com o achado do `gerar-imagem`
  (grupo 3): imagem que cai no Supabase Storage hoje não tem mais
  nenhum processo automático levando pro R2. Índice
  (`docs/documentacao-api.md`) atualizado — **os 4 grupos (67 functions)
  estão documentados**. Falta só o resumo simplificado dos grupos 2, 3 e
  4 na Central de Ajuda (só o grupo 1 tem resumo lá).
- **Documentação de API — grupo 3 (IA e PDFs) escrito (18/08/2026, sessão
  8)**: `admin-ia-conteudo.md` (9 functions) + `admin-pdfs.md` (3
  functions), `ai-sdr` continua só linkada em `leads-e-sdr.md`. **Achados
  novos**: (1) `ai-agents` nunca foi chamada por nada (mesmo padrão de
  código pronto e esquecido); (2) `gerar-conteudo` lê só o nome de
  variável do Gemini com erro de digitação (`GEMINI_APY_KEY`), sem
  fallback pro nome certo que as functions irmãs já corrigiram — risco de
  cair silenciosamente pra outro provedor; (3) `gerar-imagem` grava no
  Supabase Storage em vez do R2, diferente do resto do sistema; (4) **achado
  importante — fechou o mistério do Autentique**: `gerar-pdf-contrato` não
  gera PDF nenhum, só devolve HTML pro navegador imprimir — e o `pdf_url`
  mock do `CTR-41` (achado antes, ver `docs/autentique-integracao.md`) era
  literalmente um PDF de teste do W3C (`dummy.pdf`), confirmando que o
  fluxo de assinatura nunca teve um contrato real de verdade pra assinar.
  Índice atualizado — grupos 1, 2 e 3 escritos, falta o grupo 4
  (Infraestrutura, R2+SEO) e o resumo dos grupos 2 e 3 na Central de
  Ajuda (só o grupo 1 tem resumo lá até agora).
- **Trigger órfão removido (18/08/2026, sessão 8)**: `sync_to_crm` em
  `operacional.veiculos` (schema paralelo vazio, mesmo caso de
  `operacional.leads` já achado antes) chamava um projeto Supabase de
  fora da organização (`zsqmlbcxiqggzsehzqdv`, não é
  Motores Hub/IntegradorWeb/Carro e Cia), função `sync-inventory` que
  nem existe neste repositório — sobra de template da ferramenta que
  gerou o projeto originalmente (commits antigos assinados "Skip
  <skip@usecurling.com>"). Confirmado seguro (schema inteiro sem outro
  trigger, sem referência no código, sem FK) e removido via migration
  `remove_trigger_sync_to_crm_orfao`. Enquanto investigava isso,
  também confirmado que só existem 3 triggers no banco desse tipo
  (tabela → chama Edge Function): `trigger_notify_new_vehicle`
  (→ `notify-new-vehicle`), `trigger_notify_vehicle_sold`
  (→ `meta-capi-postback`, já documentado) e o que foi removido agora.
  As 3 tabelas do schema `operacional` (`leads`, `veiculos`,
  `configuracoes`) continuam existindo, vazias — decisão de apagar o
  schema inteiro não foi pedida, fica pra depois se a Adriana quiser.
- **Documentação de API — grupo 2 (Internas do admin) escrito (18/08/2026,
  sessão 8)**: 3 docs novos — `admin-usuarios-acesso.md`,
  `admin-orquestracao-portais.md`, `admin-automacoes-internas.md` — as 14
  functions do grupo, índice atualizado. **2 achados sérios, só
  documentados**: (1) `sync-estoque` e `admin-plataformas-api` são código
  morto (nenhum caller vivo — nem tela, nem cron, nem outra function);
  `admin-plataformas-api` tem uma armadilha se algum dia for reativada
  (só libera acesso pro e-mail hardcoded `adriana.araujo@kmzero.com.br`
  via sessão normal, ignora `usuarios.nivel` — bloquearia até a própria
  Adriana no login principal); (2) `notify-new-vehicle` (aviso de veículo
  novo no estoque) tem fallback pro número da **Clara** (atendimento ao
  cliente) em vez da equipe de vendas, porque a variável
  `WHATSAPP_SALES_TEAM_PHONE` não aparece configurada em lugar nenhum do
  projeto — risco real de aviso interno caindo no WhatsApp de cliente.
  Índice (`docs/documentacao-api.md`) atualizado, grupo 3 (IA/PDFs) e
  grupo 4 (Infra) ainda faltam.
- **Central de Ajuda reorganizada em 4 menus (18/08/2026, sessão 8)**:
  Operacional / Processos (por setor) / Dev e TI (restrito) / FAQs,
  pedido da Adriana. Migration `ajuda_conteudos_grupo_e_restricao_dev_ti`
  — coluna `grupo` nova + RLS que restringe `grupo='dev_ti'` a
  admin_master/gerente (antes QUALQUER logado lia tudo, sem exceção
  nenhuma — achado na auditoria). `Ajuda.tsx`, `ManualFormModal.tsx` e
  `services/ajuda.ts` atualizados; aba "Dev e TI" só aparece pra quem
  tem permissão. Limpeza de dado no mesmo pacote: apagadas 2 duplicatas
  ("Estoque" vs "Estoque e Integrador", "Agendador de Postagens" vs
  "Agendador de Redes Sociais"), categoria dos 3 FAQs padronizada, e
  corrigido endereço errado hardcoded no FAQ "Onde fica a loja?"
  (mostrava "Avenida Principal, 1000" fictício, não o endereço real da
  loja). 11 artigos classificados: 7 Operacional, 1 Dev e TI, 3 FAQ,
  0 Processos ainda (nenhum existe — setores como Consórcio/Seguro nem
  têm tela própria). Build e lint limpos, **não testado no navegador**
  (sem login) — pedir pra Adriana conferir a tela antes de considerar
  100% validado, principalmente a aba Dev e TI sumindo pra usuário
  `operador`.
  **Ajustes pedidos após teste (18/08/2026, mesma sessão)**: editar/apagar
  conteúdo agora é exclusivo de `admin_master` (antes incluía `gerente`
  também) — migration `ajuda_conteudos_editar_apenas_admin_master`, RLS e
  `Ajuda.tsx` atualizados (`podeEditar` separado de `podeVerDevTi`, que
  continua admin_master+gerente). Setor novo **"Todos"** criado na tabela
  `setores`, usado pra reclassificar os 4 artigos Operacionais que
  estavam sem setor definido (Dashboard, Gerenciador de Leads, Estoque e
  Integrador, Agendador de Redes Sociais).
- **Documentação de API — índice + grupo 1 (Integrações) escrito
  (18/08/2026, sessão 8)**: `docs/documentacao-api.md` (índice mestre,
  67 functions em 4 grupos) + 4 docs novos no padrão "referência
  técnica" (`meta-integracao.md`, `autentique-integracao.md`,
  `consultas-externas.md`, `google-drive-integracao.md`) — os outros
  3 clusters do grupo 1 (Webmotors, Mercado Livre, NaPista) já tinham
  doc, só linkados. **3 achados sérios no caminho, todos só
  documentados (decisão da Adriana foi não investigar/corrigir agora)**:
  (1) `enviar-para-assinatura` (Autentique) tem modo mock silencioso —
  único contrato que passou por ela (`CTR-41`, 16/04/2026) está com
  link falso, parado em "pendente" há 4 meses; (2) `consultar-cpf` e
  `consultar-placa` têm o mesmo padrão de mock silencioso, mas sem
  contaminação encontrada nas tabelas reais hoje; (3) `whatsapp-webhook`
  e `webhook-portais` são código morto — nunca receberam tráfego real
  do Meta (confirmado via contagem de linhas nas tabelas que cada uma
  escreveria); `receive-leads` é o único webhook do Meta realmente
  ativo. Grupos 2 (Internas), 3 (IA/PDFs) e 4 (Infra) ainda não
  escritos — só o índice com descrição de 1 linha por function.
- **2 artigos da Central de Ajuda criados (18/08/2026, sessão 8)**, via
  skill `manual-operacional`: "Avaliar Veículo de Cliente" (setor
  Vendas, `/admin/avaliacao`) e "Editar Dados da Loja (Endereço,
  Horário e Logo)" (setor Desenvolvedor e TI, `/admin/configuracoes`,
  aba Loja & SEO). Fecha a pendência que tinha ficado devendo de
  17/08. Checklist (`docs/manual-operacional-contexto.md`) atualizado
  com ✅ nas duas linhas. Aba "Contatos"/"Brain IA"/demais de
  Configurações continuam sem artigo.

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
- **Botão manual Publicar/Despublicar implementado (17/08/2026, sessão
  7)**: `/admin/portais` — Webmotors, Mercado Livre e NaPista. Detalhe
  completo (inclui 2 bugs achados e corrigidos no caminho: NaPista era
  decorativo, seletor de modalidade mostrava valor errado) na seção
  "Implementado nesta sessão" de `docs/manual-operacional-contexto.md`.
  Build e lint limpos. **Não testado ao vivo no navegador** (sem login
  disponível nesta sessão) — pedir pra Adriana conferir antes de
  considerar 100% validado.
- **Auditoria + correção pontual Webmotors (17/08/2026, sessão 7)**:
  reconciliação real (API Webmotors) vs sistema confirmou 18=18 sem
  divergência. RAV4 (QMY0E06) e HB20X (RFV1E55) publicadas nas 2 vagas
  que abriram com a venda de 2 carros em 15/08. Compass Sport 2021
  (RMP8G90) despublicado a pedido da Adriana. Confirmado com a própria
  API da Webmotors: modalidade Básico (6351) e Vip (6914) são pools
  **fixos e separados** (18 + 2), não fungíveis um com o outro — a
  Adriana levantou a hipótese de serem fungíveis, dado real não confirma
  isso, vale confirmar com o suporte da Webmotors se ela quiser insistir.
- **Auditoria de qualidade dos leads (17/08/2026, sessão 7)**: achados e
  apagados 15 leads-fantasma no total (9 do clique "Tenho Interesse" do
  site + 6 de outros padrões: "Lead Portal", "Cliente Instagram", um
  "teste" de formulário, e 3 contatos WhatsApp reais com nome de perfil
  inútil tipo "." ou emoji, sem conversa registrada). Corrigido na raiz:
  `handleCommercialCTA` não cria mais lead nem aciona a Clara antes da
  pessoa mandar mensagem de verdade (só o fluxo real de entrada do
  WhatsApp faz isso agora).
  **Achado maior**: nenhum lead vindo de anúncio (Meta Ads) ou do site
  tinha o veículo de interesse gravado em campo estruturado — só o nome
  genérico da campanha. A ferramenta `atualizar_estagio_lead` da Clara
  ganhou o parâmetro `veiculo_interesse`; deploy do `ai-sdr` já feito
  (17/08/2026) — **efeito colateral bom**: esse deploy também colocou no
  ar a expansão de classificação de leads que estava parada desde
  14/08/2026 (ver item 4 nas pendências fechadas).
  **Google Ads investigado a fundo** (conector `carroecia-api-google-ads`
  ganhou 2 ferramentas novas, só leitura: `detalhar_campanha` e
  `verificar_auto_tagging`, testadas e funcionando):
  - Conta tem **auto-tagging ATIVADO** — Google usa `gclid` na URL, não
    UTM manual. Nosso site **não captura `gclid` em lugar nenhum hoje** —
    todo tráfego de Google Ads que vira lead fica invisível como "Google"
    (cai como orgânico ou sem origem).
  - As 2 campanhas (`Website_traffic` ativa, `Leads_pesquisa` pausada) só
    têm 1 anúncio cada, tipo Busca (Responsive Search Ad), URL final = a
    home do site (`carroeciamotors.com.br`), sem página específica de
    veículo nem extensão de formulário/ligação visível no tipo do
    anúncio.
  - Zero leads no banco hoje com qualquer rastro de Google Ads.
  - **[FECHADA 17/08]** Captura de `gclid` implementada — `src/lib/ad-tracking.ts`
    guarda no localStorage assim que aparece na URL, os 3 pontos que criam
    lead direto do navegador (Hero, LeadForm, ConsignacaoLPForm) mandam
    pro backend, `leads.gclid` gravado, `origem` vira `google_ads` quando
    presente. **Limitação que continua**: clique direto no botão de
    WhatsApp (sem passar por formulário) ainda não carrega o `gclid` até
    a conversa — o WhatsApp não devolve esse dado como a Meta devolve nos
    anúncios dela. **Pesquisado em 17/08/2026**: mercado resolve isso com
    "código de referência" na mensagem pré-preenchida (visível pro
    cliente, ele pode apagar antes de mandar — atribuição se perde nesse
    caso, sem quebrar nada). Não implementado ainda, esperando decisão da
    Adriana (muda o texto que o cliente vê).
  - **[FECHADA 17/08] Veículo do anúncio (Meta Ads) — resolvido de
    verdade**: achado que `referral.body` (corpo do criativo do anúncio,
    manda pela Meta em toda mensagem de WhatsApp vinda de anúncio) sempre
    trouxe o veículo exato — nunca foi lido, só `headline`/`source_id`
    (nome genérico da campanha) eram usados. `receive-leads/index.ts`
    agora extrai o texto antes dos dois-pontos da primeira linha do
    `referral.body` (nossos anúncios sempre começam "Marca Modelo Versão
    Ano: descrição") e grava em `veiculo_interesse` na hora que o lead é
    criado — não depende mais da Clara identificar depois na conversa.
    Provavelmente é o mesmo mecanismo que o Venda.iA usa.
- **Avaliação de Veículo implementada (17/08/2026)** — reconstruída do
  zero em `/admin/avaliacao`. Detalhe completo na seção "Backlog" (item
  1) de `docs/manual-operacional-contexto.md`. **Achado importante no
  caminho**: a função "Gerar Proposta PDF Automática" que já existia em
  `/admin/crm` era 100% fake (PDF fixo "Mocked PDF") — nunca tinha sido
  usada de verdade (zero arquivos gerados antes da correção). Corrigida
  junto: geração de PDF real agora via jsPDF (testado isolado antes de
  integrar), com 2 templates novos editáveis em `/admin/modelos-documentos`.
  Também corrigido um bug pequeno pré-existente nessa tela (`t.doc_type`
  deveria ser `t.document_type` — o "Não salvo" nunca sumia depois de
  salvar). Build e lint limpos. **Não testado no navegador** (sem login).
- **Configurações Loja & SEO implementada (17/08/2026)** — detalhe
  completo na seção "Backlog" (item 2) de `docs/manual-operacional-contexto.md`.
  Resumo: achado que não existia NENHUMA tela pra editar endereço/logo da
  loja (Contatos só cobre WhatsApp/telefone/redes) — não era duplicação,
  era lacuna real. Endereço/telefone/logo saíram do hardcode em
  `SEO.tsx` (schema.org de toda página do site) e passam a vir de
  `brand_config` via `useBrandConfig()`, mesmo hook que o rodapé já usa.
  Fallback seguro confirmado (`DEFAULT_BRAND` bate com o que estava
  hardcoded — testei que `address`/`logoUrl` nunca tinham sido salvos no
  banco até hoje, e o site continua mostrando certo mesmo assim).
  Decisão consciente de não incluir fallback de título/descrição padrão
  (toda página relevante já define o próprio SEO). Build e lint limpos,
  **não testado no navegador**.
- **Correção nos cards de veículo — capa e `/estoque` (17/08/2026)** —
  detalhe completo em "Implementado nesta sessão" de
  `docs/manual-operacional-contexto.md`. Resumo: fotos em retrato/quadradas
  cortadas por `object-cover` num quadro fixo 4:3 (Volvo XC 60, HR-V,
  Toro citados como exemplo) → trocado pra `object-contain` (mostra a
  foto inteira). Removido "versão" do texto do card (existia só pra
  exigência de cadastro Webmotors, continua sendo enviado pra lá igual).
  "Cilindrada" conferida — nunca apareceu em card nenhum, nada a
  remover. Adicionado botão WhatsApp nos cards da capa (só o `/estoque`
  tinha). Build e lint limpos, **não testado no navegador**.
  **Atualização mesmo dia**: corrigido também `Veiculo.tsx` (galeria da
  página de detalhe) — mesmo `object-contain` na foto grande e nas
  miniaturas (2 dos 3 pontos com `object-cover`; o placeholder de "sem
  foto" ficou como estava, não é foto real). Build limpo, os 4 warnings
  de lint no arquivo já existiam antes (confirmado via `git stash`),
  não são deste ajuste.
  **Atualização 2 mesmo dia — revertido**: Adriana testou e não gostou
  do `object-contain` (cards com foto vertical/quadrada ficavam
  visivelmente menores, com faixa cinza nas laterais). Revertido pra
  `object-cover` nos 3 arquivos. Criado `src/lib/image-cover-position.ts`
  — mede a foto ao carregar e só ajusta o ponto de corte pra cima
  quando ela for vertical/quadrada (fora do padrão paisagem), mostrando
  mais do teto do carro. Fotos paisagem normais não mudam nada.
  Testado localmente (`bun run dev`) direto no navegador nos 3 carros
  citados antes de subir — confirmado visualmente. Achado à parte, sem
  ação: existe um terceiro card duplicado em
  `src/components/home/HomeFeatures.tsx` ("Veículos em Destaque" da
  home) — nunca teve o bug, não mexido.

## Pendências abertas

1. **[FECHADA 17/08] NaPista — automação testada de ponta a ponta.**
   Migration e deploy aplicados (16/08/2026, sessão 6) — trigger
   `trigger_napista_sync_on_veiculo_change` e cron `napista-sync-cron-job`
   (30min) ativos. Testado ao vivo em 17/08/2026 com o Jeep Compass Sport
   (RMP8G90, já mapeado): marcado como pendente, `napista-sync` chamado,
   voltou `status: updated`, 10 fotos enviadas, sem erro. **Achado
   importante**: `napista-sync/index.ts` aponta pra
   `api.development.napista.com.br` — **ainda é a API de desenvolvimento
   da NaPista, não produção**. Tecnicamente tudo funciona, mas nada disso
   aparece pro público de verdade até trocar pra API de produção — isso
   é decisão da Adriana (precisa confirmar credenciais/URL de produção
   com a NaPista antes), não fiz essa troca sozinha.
   **Confirmado em `docs/integracao-napista.md` (item 9, já documentado
   antes): hoje só existe `client_id` de desenvolvimento — produção exige
   pedir um `client_id` novo direto pra `parceiros@napista.com.br`.** Ou
   seja, o sistema NUNCA publicou nada na NaPista de produção — os 19
   veículos que a Adriana vê ao vivo no site da NaPista (17/08/2026) não
   vieram do nosso sistema. Bloqueado até ela pedir o client_id de
   produção — não dá pra "publicar os 6 que faltam" até isso existir.

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
   - **[FECHADA 17/08]** Foi ao ar sem querer como efeito colateral do
     redeploy do `ai-sdr` em 17/08/2026 (feito por outro motivo — ver
     item do veículo de interesse abaixo). Confirmado no código
     deployado: enum de 7 tipos, temperatura e encaminhamento automático
     estão todos ativos agora.
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
9. **Uma migration parada em `supabase/migrations-rascunho/`**, fora do
   fluxo automático de propósito:
   - `desliga_cron_wm_sync.sql` — desligaria a sincronização automática da
     Webmotors. Decisão da Adriana em 16/08: manter automático por ora.
     Aplicar só depois do fluxo manual "Sincronizar Agora" (painel Portais)
     ser testado de ponta a ponta.
   - **[FECHADA 17/08]** `crm_improvements.sql` (23/06, órfã) — confirmado
     que `internal_notes` e `leads.ai_enabled` (o que esse arquivo criava)
     já existem no banco via outra migration já aplicada
     (`20260623192000_crm_improvements`). Arquivo apagado.
10. **Senha exposta pro Roberto (`roberto@carroecia.com`) e pra conta
    `adriana.araujo@kmzero.com.br` continua sem trocar** (16/08/2026):
    achada em `add_access_control.sql` (senha fixa em texto plano, ver o
    arquivo — não repetida aqui de propósito, continua válida pras duas
    contas). A senha da própria Adriana (conta de login principal) já foi
    trocada. Decisão dela foi deixar as outras duas como estão por ora —
    registrado aqui porque a exposição em si continua no histórico do
    Git, não some sozinha.
11. **[PLANEJADO 17/08, falta implementar] Plano das 3 telas removidas**:
    Avaliação de veículo formal, Configurações gerais de Loja/SEO/Scripts,
    Automações de e-mail de nutrição de lead. Plano completo de cada uma
    (decidido junto com a Adriana) está na seção "Backlog" de
    `docs/manual-operacional-contexto.md` — não repetir aqui, só resumo:
    (1) Avaliação vira tabela `avaliacoes_veiculo` + tela nova, com ação
    de virar proposta em PDF / consignação / compra-estoque; (2) "Loja &
    SEO" volta reaproveitando `brand_config` (elimina hardcode duplicado
    em `SEO.tsx`), "Scripts & Tracking" NÃO volta como tela (edito
    `index.html` direto quando pedir); (3) Automação de e-mail usa Brevo
    como motor (não cron próprio) — depende da chave de API do Brevo,
    ver pendência 5. Nenhuma das 3 tem código escrito ainda, só o plano.
12. **Confirmar status real de OLX/iCarros/Napista em `/admin/portais`**
    (17/08/2026): comentário no código dizia que só Webmotors e Mercado
    Livre têm integração real, as outras seriam só flag. Sinalizado no
    doc de contexto do manual pra reconferir — pode estar desatualizado,
    não foi checado nesta sessão.
13. **[FECHADA 18/08/2026] Documentação de API.** Índice
    (`docs/documentacao-api.md`) + os 4 grupos (67 functions) + os 4
    artigos resumo na Central de Ajuda (`grupo='dev_ti'`) — tudo
    completo. Pendência que sobrou dela: sitemap desatualizado desde
    abril/2026 (ver `docs/admin-infraestrutura.md`) — Adriana pediu pra
    tratar isso a seguir.
14. **Manual Operacional — maioria das páginas ainda sem artigo**
    (atualizado 18/08/2026): infraestrutura pronta
    (`docs/manual-operacional-contexto.md` + skill `manual-operacional`),
    3 artigos reais existem hoje ("Criar Usuário no Painel", "Avaliar
    Veículo de Cliente", "Editar Dados da Loja"). Escrever o resto é
    trabalho de várias sessões futuras, conduzido pela skill quando a
    Adriana pedir.

## Referências técnicas por assunto

`docs/webmotors-integracao.md` · `docs/mercadolivre-integracao.md` ·
`docs/leads-e-sdr.md` · `docs/meta-ads-mcp.md` · `docs/edge-functions-rules.md`
· `docs/R2_CORS_CONFIGURATION.md` · `docs/integracao-napista.md`
