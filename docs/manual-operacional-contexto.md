# Contexto — Manual Operacional do Sistema

Documento de referência pra criar o Manual Operacional (artigos na Central
de Ajuda, `/admin/ajuda`, tabela `ajuda_conteudos`). Não é o manual em si —
é o inventário do que existe hoje no sistema, organizado por setor, usado
como checklist de escrita. Regra de manutenção contínua está no `CLAUDE.md`,
seção "Manual Operacional do Sistema".

Levantamento feito em 17/08/2026, auditando os componentes React reais de
cada página (não supondo pelo nome do menu).

**Como usar este documento:** pra cada linha sem ✅, escrever um artigo em
`/admin/ajuda` cobrindo aquele fluxo, e marcar aqui depois. Não escrever
sobre uma página sem antes confirmar como ela funciona de verdade — coisa
muda rápido nesse sistema.

## Legenda de complexidade
🟢 baixa · 🟡 média · 🔴 alta (mais sub-fluxos, vale quebrar em mais de um artigo)

---

## Vendas
| Página | O que faz | Sub-fluxos a documentar | Complex. | Manual |
|---|---|---|---|---|
| `/admin/crm` (Leads) | Kanban/lista de leads em tempo real, conversa, vínculo com veículo, proposta em PDF, simulação de financiamento | Mudar estágio (kanban), abrir conversa, vincular veículo, gerar proposta | 🔴 | — |
| `/admin/conversas` | Chat dedicado — abas IA x Atendimento Humano | Buscar conversa, alternar IA/humano, responder | 🟡 | — |
| `/admin/agendamentos` | Visitas/avaliações marcadas pela Clara (IA) ou pela equipe | Marcar Compareceu/Cancelado/Não compareceu | 🟢 | — |
| `/admin/avaliacao` | Avaliação de veículo de cliente (compra/troca/consignação), gera proposta em PDF, marca consignação ou compra | Nova avaliação (agendamento/avulsa), gerar PDF, marcar destino | 🟡 | ✅ "Avaliar Veículo de Cliente" |

*(Reconstruída do zero em 17/08/2026, substituindo a tela anterior que era só fachada — ver seção "Backlog" no fim deste doc.)*

## Consignação
| Página | O que faz | Sub-fluxos a documentar | Complex. | Manual |
|---|---|---|---|---|
| `/admin/administrativo` (parcial) | Emite/lista contratos de consignação | Emitir contrato de consignação | 🟡 | — |

## Consórcio
Sem página dedicada hoje — atendimento acontece fora do sistema (WhatsApp/presencial). Nada a documentar até existir uma tela.

## Seguros
Sem página dedicada hoje — mesma situação do Consórcio.

## Financiamentos
| Página | O que faz | Sub-fluxos a documentar | Complex. | Manual |
|---|---|---|---|---|
| `/admin/financiamento` | Simulador de financiamento (PMT), puxa lead/veículo pela URL, salva em `simulacoes` | Calcular parcela, salvar simulação | 🟡 | — |

## Financeiro/Administrativo
| Página | O que faz | Sub-fluxos a documentar | Complex. | Manual |
|---|---|---|---|---|
| `/admin/administrativo` | Central de documentos: `documentos` + `notas_fiscais` + `contratos_consignacao` juntos | Upload de doc de veículo, emitir NF, buscar/filtrar, baixar/imprimir | 🔴 | — |
| `/admin/modelos-documentos` | Editor de templates com marcadores `{{...}}` + preview | Editar template, pré-visualizar, salvar | 🟡 | — |

## Estoque/Portais
| Página | O que faz | Sub-fluxos a documentar | Complex. | Manual |
|---|---|---|---|---|
| `/admin/estoque` | CRUD completo de veículo | Cadastrar, editar, marcar vendido, devolver, gerar QR, revisar com IA, compartilhar | 🔴 | — |
| `/admin/portais` | Sync Webmotors/Mercado Livre/NaPista (reais — NaPista testado de ponta a ponta em 17/08/2026, mas ainda aponta pra API de **desenvolvimento** da NaPista, não produção). **Confirmado em 17/08/2026: OLX e iCarros continuam só com a flag `publicado_olx`/`publicado_icarros`, sem nenhuma chamada de API real por trás — zero linhas em `estoque_publicacoes` pra essas duas em toda a história do sistema.** | Publicar/despublicar em massa, preflight, dry-run, ver erros, monitor de conversão | 🔴 | — |

## Marketing
| Página | O que faz | Sub-fluxos a documentar | Complex. | Manual |
|---|---|---|---|---|
| `/admin/marketing` | Aba social (agendar post) + WhatsApp + Analytics. *(Aba "Automações de E-mail" era mock, removida em 17/08/2026 — ver Backlog)* | Agendar post, gerar texto com IA, ver analytics | 🟡 | — |
| `/admin/anuncios` | Gestão Google/Meta Ads — chat com agente IA, campanhas, gerador de copy | Conversar com agente de ads, ver campanhas, gerar copy | 🔴 | — |
| `/admin/central-social` | 4 abas: Publicações, Aprovações, Comentários, Ideias com IA | Publicar, aprovar post, responder comentário, gerar ideia | 🔴 | — |
| `/admin/conteudo` | CMS: páginas, blog, landing pages, keywords, hashtags, comentários | Criar/editar página ou artigo, gerenciar keywords/hashtags, moderar comentário | 🔴 | — |
| `/admin/design` | Banners do site + depoimentos de cliente | Criar/editar/ativar banner, criar/aprovar depoimento | 🟢 | — |

## Desenvolvedor e TI
| Página | O que faz | Sub-fluxos a documentar | Complex. | Manual |
|---|---|---|---|---|
| `/admin/configuracoes` | Contatos (dados reais da marca), Loja & SEO (endereço/horário/logo), Brain IA (base de conhecimento + teste), Prompts IA legado, Integrações sociais. *("Scripts & Tracking" era mock, removida em 17/08/2026 e não volta como tela — ver Backlog)* | Editar contatos da marca, editar dados da loja, adicionar conhecimento à Brain IA, testar prompt | 🔴 | ✅ "Editar Dados da Loja (Endereço, Horário e Logo)" (só aba Loja & SEO — restante segue sem artigo) |
| `/admin/autonomia` | Liga/desliga automações do sistema + diretrizes + logs | Ativar/desativar automação, editar diretriz ativa | 🟡 | — |
| `/admin/prompts-ia` | Editor dos prompts de sistema (Clara, Brain IA, etc.) | Editar prompt, restaurar padrão | 🟢 | — |
| `/admin/usuarios` (+ Criar/Editar) | Gestão de conta, nível e setor | Criar usuário, editar permissões | — | ✅ "Criar Usuário no Painel" |
| `/admin/auditoria` | 3 abas de log: acesso, uso de IA, integrações (só leitura) | Consultar log | 🟢 | — |
| `/admin/logs` | Logs de webhook Meta + integrações de portal | Consultar log, ver payload bruto | 🟢 | — |

## Institucional
| Página | O que faz | Sub-fluxos a documentar | Complex. | Manual |
|---|---|---|---|---|
| `/admin/relatorios` (ROI) | Gráficos de lead/conversão por vendedor | Filtrar por período/vendedor | 🟢 | — |
| `/admin/vagas` | Vagas + candidaturas + geração de imagem por IA + publicação nas redes | Criar vaga, gerar imagem, postar nas redes | 🟡 | — |

## Treinamentos
Sem página dedicada hoje.

## Uso geral (sem setor específico)
`/admin` (Dashboard), `/admin/ajuda` (Central de Ajuda), `/admin/login`,
`/admin/redefinir-senha` — acessíveis por qualquer pessoa logada, sem
exigir setor.

---

## Backlog — decisão futura, não documentar como fluxo real

Três telas eram só fachada (não salvavam nada de verdade) e foram
**removidas** em 17/08/2026. Planejadas juntas (Adriana + eu) depois da
remoção — status de cada uma abaixo. Nenhuma implementada ainda, só
planejada; implementar é passo separado, autorizado individualmente.

### 1. Avaliação de veículo formal (`/admin/avaliacao`) — IMPLEMENTADA em 17/08/2026

Formulário inteiro fake, sem tabela no banco, removido em 17/08. Reconstruída
do zero no mesmo dia, seguindo o plano fechado com a Adriana:

- **Como nasce**: a partir de um agendamento tipo "avaliação" (a Clara já
  cria isso hoje em `agendamentos_visita`, `tipo='avaliacao'`) OU avulsa
  (vendedor busca/cria o lead na hora, direto no formulário).
- **Tabela `avaliacoes_veiculo`**: dados do carro do cliente, estado de
  conservação, itens/opcionais, débito/multa/sinistro, fotos (opcionais,
  R2 via `uploadToR2`/`resizeImages` — mesmo helper do estoque), valor
  proposto (sem FIPE, 100% critério do avaliador), campo `destino`.
- **3 ações depois de salva**: (a) gerar proposta em PDF — **achado no
  caminho**: a função que isso reaproveitaria (`gerar-pdf-proposta`,
  usada pelo botão "Gerar Proposta PDF Automática" em `/admin/crm`) era
  **100% fake** (PDF fixo com texto "Mocked PDF", nunca lido de verdade —
  confirmado que nunca tinha sido usada, zero arquivos gerados). Corrigida
  junto: agora usa `jsPDF` de verdade (`_shared/pdf-generator.ts`, testado
  isolado antes de integrar), com template editável em
  `/admin/modelos-documentos` (2 tipos novos: "Proposta Comercial" e
  "Proposta de Avaliação"); (b) marcar como consignação e (c) marcar como
  compra/estoque — as duas criam um cadastro real em `veiculos` (status
  `rascunho`) com os dados já digitados, e abrem `/admin/estoque` (edição)
  ou `/admin/administrativo` (emissor de contrato) já com o veículo
  selecionado via query param (`?editar=`/`?veiculo=`).
- Setor dono: Vendas (mapeado em `setor-acesso.ts`).
- **Não testado clicando no navegador** — sem login disponível nesta
  sessão. Testei via chamada direta às functions e inserts/deletes de
  teste no banco (confirmados reais: PDF gerado é `%PDF-1.3` de verdade,
  não mock). Vale a Adriana conferir o fluxo completo no navegador.

### 2. Configurações gerais do site + SEO global (`/admin/configuracoes`) — IMPLEMENTADA em 17/08/2026

Abas "Loja & SEO" e "Scripts & Tracking" não persistiam em
`site_configuracoes`, só ficavam na memória do navegador. Removidas em
17/08. As duas tiveram destinos diferentes:

- **"Loja & SEO" reconstruída, com escopo real** (`StoreSeoConfigPanel.tsx`):
  antes de mexer, achei que **não existia nenhuma tela de edição pra
  endereço/logo** (a aba Contatos só cobre WhatsApp/telefone/redes) — não
  era duplicação, era lacuna de verdade. Endereço, telefone e logo saíram
  do hardcode em `src/components/SEO.tsx` (schema.org, mesmo tipo de
  duplicação que já causou o bug do endereço errado em 6 arquivos,
  corrigido em 15/08) e passam a vir de `site_configuracoes.brand_config`
  via `useBrandConfig()` — mesma fonte que o rodapé já usa. Fallback
  seguro: `DEFAULT_BRAND` bate exatamente com os valores que estavam
  hardcoded, então se o banco falhar ou o campo não existir ainda (era o
  caso até hoje — confirmado que `address`/`logoUrl` nunca tinham sido
  salvos), o site mostra os dados certos do mesmo jeito.
- **Fallback de título/descrição padrão do site — decisão consciente de
  não incluir**: toda página relevante já define o próprio SEO, esse
  fallback quase nunca seria usado. Escopo reduzido de propósito, combinado
  com a Adriana.
- **"Scripts & Tracking" NÃO volta como tela**: GTM, Google Analytics e
  Meta Pixel estão hardcoded em `index.html` hoje. Um painel pra isso
  exigiria o site carregar esses IDs dinamicamente do banco a cada
  visita — mais lento e mais frágil, pra um ganho pequeno (esses IDs
  raramente mudam). Decisão da Adriana: continuar editando direto no
  código quando ela pedir, sem tela dedicada.

### 3. Automações de e-mail de nutrição de lead (`/admin/marketing`) — PLANEJADA, não implementada

Lista de "automações" era array fixo no código, sem tabela nem envio real
por trás. Removida em 17/08. Plano definido em 17/08/2026 — decisão da
Adriana foi usar o **Brevo** como motor de automação em vez de construir
um sistema próprio (cron + templates), aproveitando que o Brevo já tem
editor de fluxo de e-mail pronto:

- **O que nasce daqui pro Brevo**: todo lead criado por qualquer
  formulário do site (Comprar, Vender Meu Carro, Consignação,
  Financiamento, Seguro, Consórcio — tudo que hoje gera registro em
  `leads`) sincroniza contato + evento `lead_criado` pro Brevo. Também
  visualização de veículo no site vira evento `visualizou_veiculo` (com
  marca/modelo/preço/link), mas **só pra quem já se identificou antes**
  (deu e-mail em algum formulário) — visitante 100% anônimo não tem como
  receber e-mail, tecnicamente não tem pra quem mandar.
- **O que fica dentro do Brevo, não no nosso painel**: o desenho da
  automação em si (quantos e-mails manda, texto de cada um, quanto tempo
  esperar entre eles) é feito direto na ferramenta do Brevo — não
  construímos tela nova aqui pra isso. Nossa aba de Marketing, no máximo,
  ganha um link/status mostrando que a automação está configurada lá.
- Envio automático, sem revisão manual antes de cada disparo (mesmo
  padrão do `re-engagement-cron` que já existe hoje pro WhatsApp).
- **Falta pra sair do papel**: chave de API do Brevo (pendência já
  registrada em `MEMORY_WORK.MD`), criar as listas/atributos
  personalizados dentro do Brevo, incluir o script de tracking do Brevo
  no site (mesmo padrão do GTM/Pixel em `index.html`, usado pra
  identificar visitante e registrar visualização de veículo), e construir
  a chamada de sincronização de contato/evento nos pontos onde `leads` é
  criado hoje.

## Implementado nesta sessão (17/08/2026)

### Publicar/Não publicar manual por veículo e plataforma (`/admin/portais`) — CONCLUÍDO

Pedido depois de uma auditoria de sincronização Webmotors mostrar 6
veículos bloqueados por falta de vaga de anúncio, sem forma da Adriana
decidir manualmente qual veículo ocupa uma vaga limitada. Implementado
direto (o plano inicial previa uma edge function nova, mas descobri que o
`/admin/portais` já tinha 90% da engrenagem pronta — só reaproveitei):

- **`PortalCard.tsx`**: o botão único "Sincronizar Agora" (sempre mandava
  `publicar=true`, nunca despublicava) virou dois estados — "Publicar" ou
  "Despublicar", conforme o status atual — com confirmação (`AlertDialog`)
  antes de despublicar, deixando claro que isso libera a vaga mas não
  mexe no status do veículo no estoque.
- **Achado corrigido no caminho — NaPista era decorativo**: o botão de
  sincronizar do NaPista só trocava a flag `publicado_napista` no banco
  (`toggleVehiclePublication`), sem nunca chamar `napista-sync` de
  verdade — clicar não tinha efeito real nenhum na NaPista. Corrigido pra
  seguir o mesmo padrão real que a Webmotors já usava (marca status em
  `estoque_publicacoes` + chama a function na hora), função nova
  `triggerNapistaSync` em `services/plataformas.ts`.
- **Rastreio da decisão**: `estoque_publicacoes` ganhou
  `alterado_manualmente_por` + `alterado_manualmente_em`, gravados só
  quando a mudança vem do botão (não do cron/venda automática).
- **Achado corrigido no caminho — seletor de modalidade mentia**: o
  campo "Modalidade" do card mostrava `veiculos.ad_types` (preferência
  nunca lida pelo `wm-sync`) com fallback pro primeiro tier da lista,
  *"Super Acelerador VIP"* — então um veículo publicado como "Anúncio
  Básico" de verdade aparecia como VIP na tela. Agora mostra a modalidade
  REAL (`wm_mapeamento_veiculos.codigo_modalidade_wm`, o que o `wm-sync`
  de fato usa) e, ao trocar no seletor, atualiza esse campo real (não só
  a preferência) — precisou de uma política de RLS nova
  (`wm_mapeamento_veiculos` só tinha SELECT pra usuário autenticado, sem
  UPDATE).

### Correção de exibição nos cards de veículo (capa + `/estoque`) — CONCLUÍDO

Pedido depois da Adriana notar carros aparecendo cortados nos cards
(exemplos citados: Volvo XC 60, Honda HR-V, Fiat Toro). Três ajustes,
nos dois lugares que desenham card de veículo — `VehicleCard.tsx`
(usado na capa/home) e `src/pages/Estoque.tsx` (tem seu próprio card
duplicado, com WhatsApp que o da capa não tinha):

- **Corte de foto**: a foto ficava dentro de um quadro fixo 4:3 com
  `object-cover`, que corta o que não couber. Fotos em pé ou quadradas
  (comuns quando alguém fotografa com o celular na vertical) ficavam
  com o teto ou a lateral cortados — confirmado baixando as fotos dos 3
  carros citados (Toro e HR-V: 1200x1540, retrato; Volvo: 2992x2992,
  quadrada). Trocado para `object-contain`: mostra a foto inteira,
  com uma faixa cinza nas laterais quando a proporção não bate — nunca
  mais corta o carro.
- **Campo "versão" removido do texto do card**: tirado de
  `buildVehicleTitle(...)` nos dois lugares. Confirmado que "versão"
  existe só pra atender exigência de cadastro da Webmotors — continua
  sendo enviado pra lá normalmente, só não aparece mais repetido junto
  do modelo no card.
- **Campo "cilindrada"**: verificado que esse campo nunca apareceu em
  nenhum card — é usado só internamente (pontuação de qualidade de
  anúncio, sincronização com portais). Nada para remover aí.
- **Botão WhatsApp na capa**: os cards da home não tinham o botão
  verde de WhatsApp que o `/estoque` já tinha. Adicionado o mesmo botão
  em `VehicleCard.tsx`, com a mesma mensagem pré-preenchida (veículo +
  ano + preço).

**Atualização (mesmo dia)**: a Adriana pediu para corrigir também
`src/pages/Veiculo.tsx` (galeria da página de detalhe). Aplicado o
mesmo `object-contain` na foto grande do carrossel e nas miniaturas
(2 dos 3 pontos que tinham `object-cover`). O terceiro ponto — a
imagem-placeholder genérica exibida quando o veículo não tem foto
nenhuma — foi deixado como estava, porque não é foto real de carro
sendo cortada.

**Atualização 2 (mesmo dia) — `object-contain` revertido**: a Adriana
testou e não gostou — com `object-contain` os cards com foto vertical/
quadrada (Volvo, HR-V, Toro) ficavam visivelmente menores que os
demais (sobrava faixa cinza nas laterais), quebrando a uniformidade
dos cards. Revertido pra `object-cover` nos 3 arquivos (volta ao
tamanho uniforme de sempre). Pro problema do zoom em si, criado
`src/lib/image-cover-position.ts`: mede a foto ao carregar e, só
quando ela for vertical/quadrada (proporção fora do padrão paisagem),
move o ponto de corte pra cima (mostra o teto/capô do carro em vez de
cortar mais embaixo). Fotos paisagem normais continuam idênticas a
sempre — sem nenhuma mudança visual pra elas. Testado localmente
(`bun run dev`) nos 3 exemplos citados (Volvo XC 60, HR-V, Toro) antes
de subir: cards uniformes de novo, carro mostrado por inteiro de cima
pra baixo o quanto dá.

**Achado à parte, sem ação**: existe um terceiro componente de card de
veículo, `src/components/home/HomeFeatures.tsx` (seção "Veículos em
Destaque" da home), com sua própria duplicação de markup — nunca teve
o corte agressivo (`object-[center_65%]`) e já tinha botão de
WhatsApp funcional (rotulado "CHAMAR VENDEDOR"), então não precisou de
ajuste. Fica registrado que hoje existem 3 implementações de card de
veículo no código (`VehicleCard.tsx`, `Estoque.tsx`, `HomeFeatures.tsx`)
— oportunidade de unificação futura, não feita agora pra não expandir
o escopo deste pedido.

## Achado à parte

Não existe documentação de API (Swagger/OpenAPI/webhooks documentados) em
nenhum lugar do painel hoje — a seção "Área de Ajuda" no menu novo
(`/admin/ajuda`) vai precisar dessa parte construída do zero, não é reorganização de algo que já existe.
