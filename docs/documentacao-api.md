# Documentação de API — índice

Ponto de partida pra achar documentação técnica de qualquer Edge Function do
sistema. Escopo e formato definidos com a Adriana em 18/08/2026: markdown
técnico (este índice + 1 doc por integração/cluster, no padrão "referência
técnica" já usado no projeto) + resumo simplificado por grupo na Central de
Ajuda (`/admin/ajuda`).

**Como usar**: ache a function na tabela do grupo, clique no link da coluna
"Doc".

Última atualização: 2026-08-18 — os 4 grupos (67 functions) estão
documentados. Falta só o resumo simplificado dos grupos 2, 3 e 4 na Central
de Ajuda (`grupo='dev_ti'`) — hoje só o do grupo 1 existe lá.

## Status do plano

| Grupo | Functions | Status |
|---|---|---|
| 1. Integrações com portais/terceiros | 30 | ✅ Escrito (18/08/2026) |
| 2. Internas do admin | 14 | ✅ Escrito (18/08/2026) |
| 3. IA e PDFs | 13 | ✅ Escrito (18/08/2026) |
| 4. Infraestrutura (R2 + SEO) | 5 | ✅ Escrito (18/08/2026) |

---

## 1. Integrações com portais/terceiros

### Webmotors
| Function | O que faz | Doc |
|---|---|---|
| `wm-auth` | Autenticação OAuth com a Webmotors | [webmotors-integracao.md](webmotors-integracao.md) |
| `wm-catalog-fetch` | Consulta de catálogo (marca/modelo/versão) a partir do admin | [webmotors-integracao.md](webmotors-integracao.md) |
| `wm-catalogue` | Catálogo Webmotors (carga em lote) | [webmotors-integracao.md](webmotors-integracao.md) |
| `wm-confirmar-mapeamento` | Tela de pendências de mapeamento do admin | [webmotors-integracao.md](webmotors-integracao.md) |
| `wm-mapear-veiculo` | Tela de mapeamento veículo↔catálogo Webmotors | [webmotors-integracao.md](webmotors-integracao.md) |
| `wm-process-lead` | Processa lead recebido da Webmotors | [webmotors-integracao.md](webmotors-integracao.md) |
| `wm-sync` | Publica/atualiza anúncio no portal | [webmotors-integracao.md](webmotors-integracao.md) |
| `wm-sync-catalogo` | Carga em lote de marcas/modelos do catálogo | [webmotors-integracao.md](webmotors-integracao.md) |
| `wm-webhook-estoque` | Webhook de estoque da Webmotors | [webmotors-integracao.md](webmotors-integracao.md) |
| `wm-webhook-leads` | Webhook de leads da Webmotors | [webmotors-integracao.md](webmotors-integracao.md) |

### Mercado Livre
| Function | O que faz | Doc |
|---|---|---|
| `ml-auth` | Autenticação OAuth com o Mercado Livre | [mercadolivre-integracao.md](mercadolivre-integracao.md) |
| `ml-sync` | Sincronização de anúncio (manual e cron) | [mercadolivre-integracao.md](mercadolivre-integracao.md) |
| `ml-webhook` | Webhook de eventos do Mercado Livre | [mercadolivre-integracao.md](mercadolivre-integracao.md) |
| `avaliar-qualidade-anuncios` | Audita qualidade dos anúncios via API de performance do ML | [mercadolivre-integracao.md](mercadolivre-integracao.md) |

### NaPista
| Function | O que faz | Doc |
|---|---|---|
| `napista-auth` | Autenticação OAuth2 (Keycloak) | [integracao-napista.md](integracao-napista.md) |
| `napista-catalogo-trigger` | Dispara sincronização de catálogo | [integracao-napista.md](integracao-napista.md) |
| `napista-confirmar-mapeamento` | Tela de pendências de mapeamento do admin | [integracao-napista.md](integracao-napista.md) |
| `napista-mapear-veiculo` | Tela de mapeamento veículo↔catálogo NaPista | [integracao-napista.md](integracao-napista.md) |
| `napista-sync` | Cria/atualiza/encerra anúncio | [integracao-napista.md](integracao-napista.md) |
| `napista-sync-catalogo` | Carga em lote do catálogo | [integracao-napista.md](integracao-napista.md) |

### Meta (WhatsApp/Facebook/Instagram)
| Function | O que faz | Doc |
|---|---|---|
| `receive-leads` | **Único webhook do Meta realmente ativo** — mensagens, comentários, leads de anúncio | [meta-integracao.md](meta-integracao.md) |
| `whatsapp-webhook` | Webhook alternativo — código morto, nunca recebeu tráfego real | [meta-integracao.md](meta-integracao.md) |
| `webhook-portais` | Webhook genérico — também nunca recebeu tráfego real | [meta-integracao.md](meta-integracao.md) |
| `send-whatsapp` | Envia mensagem de WhatsApp (texto/template/mídia) | [meta-integracao.md](meta-integracao.md) |
| `social-actions` | Curtir/responder/ocultar/excluir comentário | [meta-integracao.md](meta-integracao.md) |
| `publicar-social` | Publica post agendado no Facebook/Instagram | [meta-integracao.md](meta-integracao.md) |
| `meta-capi-postback` | Evento de conversão "Purchase" quando veículo é vendido | [meta-integracao.md](meta-integracao.md) |
| `public-inventory-feed` | Feed CSV do estoque pro Facebook Catalog | [meta-integracao.md](meta-integracao.md) |
| `crm-inventory-feed` | Mesmo feed em JSON, consumidor não identificado | [meta-integracao.md](meta-integracao.md) |

### Autentique (assinatura eletrônica)
| Function | O que faz | Doc |
|---|---|---|
| `enviar-para-assinatura` | Envia contrato de consignação pra assinatura | [autentique-integracao.md](autentique-integracao.md) |
| `webhook-autentique` | Recebe confirmação de assinatura | [autentique-integracao.md](autentique-integracao.md) |

### Consultas gov/terceiros
| Function | O que faz | Doc |
|---|---|---|
| `consultar-cnpj` | Dados de empresa via BrasilAPI | [consultas-externas.md](consultas-externas.md) |
| `consultar-cpf` | Dados de pessoa via ApiBrasil | [consultas-externas.md](consultas-externas.md) |
| `consultar-placa` | Dados de veículo + FIPE via ApiBrasil | [consultas-externas.md](consultas-externas.md) |

### Google Drive
| Function | O que faz | Doc |
|---|---|---|
| `sync-drive-videos` | Importa vídeo de veículo do Drive | [google-drive-integracao.md](google-drive-integracao.md) |
| `sync-google-drive` | Importa foto de veículo do Drive | [google-drive-integracao.md](google-drive-integracao.md) |

---

## 2. Edge Functions internas do admin

| Function | O que faz | Doc |
|---|---|---|
| `criar-usuario-admin` | Cria usuário do painel com setor/permissão | [admin-usuarios-acesso.md](admin-usuarios-acesso.md) |
| `esqueci-senha` | Recuperação de senha via e-mail (Resend) | [admin-usuarios-acesso.md](admin-usuarios-acesso.md) |
| `sync-estoque` | **Código morto** — nunca é chamada por nada hoje | [admin-orquestracao-portais.md](admin-orquestracao-portais.md) |
| `sync-plataforma` | Publica/despublica no Mercado Livre — única das 3 orquestradoras que está viva | [admin-orquestracao-portais.md](admin-orquestracao-portais.md) |
| `admin-plataformas-api` | **Código morto**, com armadilha (e-mail hardcoded) se for reativada | [admin-orquestracao-portais.md](admin-orquestracao-portais.md) |
| `agendamento-no-show-cron` | Marca agendamento como não comparecimento após atraso | [admin-automacoes-internas.md](admin-automacoes-internas.md) |
| `lembrete-agendamento-cron` | Envia lembrete de agendamento por WhatsApp | [admin-automacoes-internas.md](admin-automacoes-internas.md) |
| `daily-report-cron` | Relatório diário automatizado por WhatsApp | [admin-automacoes-internas.md](admin-automacoes-internas.md) |
| `re-engagement-cron` | Reengajamento automático de leads frios (máx. 3x por lead) | [admin-automacoes-internas.md](admin-automacoes-internas.md) |
| `on-lead-created` | E-mail de boas-vindas + sincronização com Brevo ao criar lead | [admin-automacoes-internas.md](admin-automacoes-internas.md) |
| `lead-automation` | Automação de leads (Brevo, follow-up) — não sobrepõe `on-lead-created`, caminhos diferentes (ver `docs/leads-e-sdr.md`) | [admin-automacoes-internas.md](admin-automacoes-internas.md) |
| `notify-new-vehicle` | Notifica equipe quando veículo novo é cadastrado — **possível bug**: fallback manda pro número da Clara, não da equipe | [admin-automacoes-internas.md](admin-automacoes-internas.md) |
| `content-workflow-notification` | Notificação do fluxo de aprovação de conteúdo | [admin-automacoes-internas.md](admin-automacoes-internas.md) |
| `enviar-candidatura` | Recebe candidatura de vaga (Trabalhe Conosco), sobe currículo pro R2 | [admin-automacoes-internas.md](admin-automacoes-internas.md) |

## 3. Geração de conteúdo/IA e PDFs

| Function | O que faz | Doc |
|---|---|---|
| `ai-sdr` | Clara — atendimento via WhatsApp/Instagram | [leads-e-sdr.md](leads-e-sdr.md) |
| `ai-agents` | **Nunca usada** — agentes de negociação/troca prontos, sem tela que chame | [admin-ia-conteudo.md](admin-ia-conteudo.md) |
| `ai-assistant` | Brain IA — assistente de conhecimento (Ajuda, Configurações, onboarding) | [admin-ia-conteudo.md](admin-ia-conteudo.md) |
| `ads-agent` | Agente de anúncios — chat + audita/pausa anúncio (chamado por `meta-capi-postback` na venda) | [admin-ia-conteudo.md](admin-ia-conteudo.md) |
| `gerar-conteudo` | Geração de conteúdo via IA — achado: só lê o nome de variável com erro de digitação da chave do Gemini, sem fallback | [admin-ia-conteudo.md](admin-ia-conteudo.md) |
| `gerar-conteudo-social` | Geração de legenda pra post social de 1 veículo | [admin-ia-conteudo.md](admin-ia-conteudo.md) |
| `gerar-ideias-social` | Aba "Ideias com IA" da Central de Redes Sociais | [admin-ia-conteudo.md](admin-ia-conteudo.md) |
| `gerar-imagem` | Geração de imagem via IA — achado: grava no Supabase Storage, não no R2 como o resto do sistema | [admin-ia-conteudo.md](admin-ia-conteudo.md) |
| `gerar-imagem-vaga` | Gera imagem padrão de post de vaga (edição com logo+fachada reais) | [admin-ia-conteudo.md](admin-ia-conteudo.md) |
| `gerar-vaga-ia` | Gera título/descrição de vaga via IA | [admin-ia-conteudo.md](admin-ia-conteudo.md) |
| `gerar-pdf-avaliacao` | Gera PDF real de proposta de avaliação (jsPDF) | [admin-pdfs.md](admin-pdfs.md) |
| `gerar-pdf-contrato` | **Não gera PDF** — devolve HTML pro navegador imprimir; achado: é a causa raiz do mock do Autentique | [admin-pdfs.md](admin-pdfs.md) |
| `gerar-pdf-proposta` | Gera PDF real de proposta comercial — era 100% mock, corrigido 17/08/2026 | [admin-pdfs.md](admin-pdfs.md) |

## 4. Infraestrutura (armazenamento e SEO)

*(Incluída a pedido da Adriana em 18/08/2026, mesmo sem uso direto de ninguém no painel)*

| Function | O que faz | Doc |
|---|---|---|
| `get-r2-presigned-url` | Gera URL assinada pra upload direto no R2 — coração do upload de foto do sistema | [admin-infraestrutura.md](admin-infraestrutura.md) |
| `auto-migrate-r2` | Migração de arquivo pro R2 — rodou uma vez (05/08/2026), parou travada, sem cron | [admin-infraestrutura.md](admin-infraestrutura.md) |
| `migrar-storage-r2` | Mesma migração, versão manual — nenhum botão de tela aciona | [admin-infraestrutura.md](admin-infraestrutura.md), [R2_CORS_CONFIGURATION.md](R2_CORS_CONFIGURATION.md) (CORS) |
| `og-vehicle` | Prévia rica de veículo pra compartilhamento — pronta, mas nada gera o link que a aciona | [admin-infraestrutura.md](admin-infraestrutura.md) |
| `sitemap` | **Código morto** — `/sitemap.xml` real é servido por um arquivo estático parado desde abril/2026, não por esta function | [admin-infraestrutura.md](admin-infraestrutura.md) |
