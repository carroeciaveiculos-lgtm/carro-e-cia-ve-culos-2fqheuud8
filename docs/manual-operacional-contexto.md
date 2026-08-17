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
**removidas** em 17/08/2026, com plano de decidir juntas o que fazer no
futuro:

1. **Avaliação de veículo formal** (`/admin/avaliacao`) — formulário
   inteiro fake, sem tabela no banco.
2. **Configurações gerais do site + SEO global** (abas "Loja & SEO" e
   "Scripts & Tracking" de `/admin/configuracoes`) — não persistiam em
   `site_configuracoes`, só ficavam na memória do navegador.
3. **Automações de e-mail de nutrição de lead** (aba de `/admin/marketing`)
   — lista de "automações" era array fixo no código, sem tabela nem envio
   real por trás.

## Achado à parte

Não existe documentação de API (Swagger/OpenAPI/webhooks documentados) em
nenhum lugar do painel hoje — a seção "Área de Ajuda" no menu novo
(`/admin/ajuda`) vai precisar dessa parte construída do zero, não é reorganização de algo que já existe.
