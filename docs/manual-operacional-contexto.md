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

*(Avaliação de veículo formal não existe mais — tela era só fachada, removida em 17/08/2026. Ver seção "Backlog" no fim deste doc.)*

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
| `/admin/portais` | Sync Webmotors/Mercado Livre (reais). ⚠️ Confirmar se OLX/iCarros/Napista continuam só com flag sem integração real, ou se isso já mudou desde a última checagem | Publicar/despublicar em massa, preflight, dry-run, ver erros, monitor de conversão | 🔴 | — |

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
| `/admin/configuracoes` | Contatos (dados reais da marca), Brain IA (base de conhecimento + teste), Prompts IA legado, Integrações sociais. *(Abas "Loja & SEO" e "Scripts & Tracking" eram mock, removidas em 17/08/2026 — ver Backlog)* | Editar contatos da marca, adicionar conhecimento à Brain IA, testar prompt | 🔴 | — |
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

### 1. Avaliação de veículo formal (`/admin/avaliacao`) — PLANEJADA, não implementada

Formulário inteiro fake, sem tabela no banco, removido em 17/08. Plano
definido em 17/08/2026:

- **Como nasce**: a partir de um agendamento tipo "avaliação" (a Clara já
  cria isso hoje em `agendamentos_visita`, `tipo='avaliacao'`) OU avulsa
  (vendedor abre direto, escolhendo/criando o lead na hora).
- **Tabela nova**: `avaliacoes_veiculo` — dados do carro do cliente
  (marca, modelo, ano, placa, km, cor, câmbio, combustível), estado de
  conservação, itens/opcionais, débito/multa/sinistro (sim/não +
  observação), fotos (**opcionais**, mesmo padrão R2 do estoque), valor
  proposto pelo vendedor (**sem tabela FIPE — 100% critério de quem
  avalia**, decisão consciente), avaliador, e campo `destino`: proposta
  enviada / virou consignação / virou compra (estoque) / recusado /
  pendente.
- **Tela** (`/admin/avaliacao`, reconstruída do zero): lista filtrável +
  formulário de nova avaliação. Depois de salva, 3 ações: (a) gerar
  proposta em PDF pro cliente (reaproveitar a lib de PDF já usada na
  proposta de financiamento do CRM), (b) marcar como consignação (abre o
  fluxo de contrato de consignação já existente em Administrativo,
  pré-preenchido), (c) marcar como compra/estoque (abre o cadastro de
  `/admin/estoque` pré-preenchido com os dados já digitados).
- Setor dono: Vendas (já mapeado em `setor-acesso.ts`).

### 2. Configurações gerais do site + SEO global (`/admin/configuracoes`) — PLANEJADA, não implementada

Abas "Loja & SEO" e "Scripts & Tracking" não persistiam em
`site_configuracoes`, só ficavam na memória do navegador. Removidas em
17/08. Plano definido em 17/08/2026 — as duas abas tiveram destinos
diferentes:

- **"Loja & SEO" volta, com escopo real**: dados da empresa (endereço,
  telefone, logo) hoje estão **hardcoded em `src/components/SEO.tsx`**
  (schema de SEO) — mesmo tipo de duplicação que já causou o bug do
  endereço errado em 6 arquivos (corrigido em 15/08). Plano: reaproveitar
  `site_configuracoes.brand_config` (já existe, já alimenta o rodapé) como
  fonte única também pro `SEO.tsx`, eliminando o hardcode. Também ganha
  campo de título/descrição padrão do site e imagem OG padrão (fallback
  só pras páginas que não definem SEO próprio — a maioria já define).
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

## Achado à parte

Não existe documentação de API (Swagger/OpenAPI/webhooks documentados) em
nenhum lugar do painel hoje — a seção "Área de Ajuda" no menu novo
(`/admin/ajuda`) vai precisar dessa parte construída do zero, não é reorganização de algo que já existe.
