# IA e geração de conteúdo (admin) — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa. `ai-sdr` (Clara) não está aqui — tem doc próprio em
`docs/leads-e-sdr.md`.

Última atualização: 2026-08-18.

## Mapa das 9 functions

| Function | Status | O que faz |
|---|---|---|
| `ai-assistant` | ✅ Ativa | "Brain IA" — assistente de conhecimento geral, usado na Central de Ajuda, em `/admin/configuracoes` (aba Brain IA) e no onboarding |
| `ads-agent` | ✅ Ativa | Agente de anúncios (Meta Ads) — chat em linguagem natural, lista/pausa campanhas; também pausa anúncio de veículo vendido |
| `ai-agents` | ❌ **Nunca usada** | Dois "agentes" (negociação, avaliação de troca) com acesso ao estoque — código pronto, sem nenhuma tela que chame |
| `gerar-conteudo` | ✅ Ativa, com risco | Geração de conteúdo de blog/SEO — ver achado sobre a chave do Gemini abaixo |
| `gerar-conteudo-social` | ✅ Ativa | Legenda de post pra Instagram/Facebook, de UM veículo específico |
| `gerar-ideias-social` | ✅ Ativa | Aba "Ideias com IA" — sugestões de post que não dependem de veículo |
| `gerar-imagem` | ✅ Ativa, com achado | Imagem de blog via OpenAI — grava no Supabase Storage, não no R2 (ver achado) |
| `gerar-imagem-vaga` | ✅ Ativa | Imagem de post de vaga via OpenAI, usando logo+fachada reais como referência |
| `gerar-vaga-ia` | ✅ Ativa | Título/descrição de vaga via Gemini |

## Fatos confirmados

| Fato | Como se sabe |
|---|---|
| **Achado 18/08/2026 — `ai-agents` nunca foi usada.** Tem wrapper próprio (`src/lib/ai-agents.ts`) mas nada importa esse arquivo; `logs_ia` nunca teve uma linha com `acao ilike 'ai_agent%'`. Os dois "agentes" (negociação e avaliação de troca via IA) parecem ter sido construídos e nunca ligados a uma tela | grep em `src/` (sem importador), `select from logs_ia where acao ilike 'ai_agent%'` → 0 linhas, 18/08/2026 |
| **Achado 18/08/2026 — `gerar-conteudo` lê só o nome de variável com erro de digitação.** O projeto tem duas grafias em uso pra chave do Gemini por causa de um erro de digitação histórico: `GEMINI_API_KEY` (correto) e `GEMINI_APY_KEY` (typo). `_shared/gemini-client.ts`, `gerar-conteudo-social` e `gerar-vaga-ia` checam **as duas**, com comentário explícito sobre o motivo. `gerar-conteudo` lê **só `GEMINI_APY_KEY`, sem fallback** — se o Secret real estiver salvo com o nome certo (`GEMINI_API_KEY`), essa function nunca acha a chave e cai silenciosamente pro próximo provedor (OpenAI/Groq) da cadeia de fallback, sem avisar ninguém | leitura de `gerar-conteudo/index.ts` linha 48 vs. `_shared/gemini-client.ts` linha 221 (comentário "procurava GEMINI_API_KEY") |
| `gerar-conteudo` chama o modelo `gemini-3.5-flash` hardcoded — mais antigo que o `gemini-3.6-flash` usado em `gerar-vaga-ia` e confirmado como o atual em verificação anterior (ver `MEMORY_WORK.MD`, pendência 5) | leitura de `gerar-conteudo/index.ts`, linha 276 |
| **Achado 18/08/2026 — `gerar-imagem` grava no Supabase Storage (bucket `imagens`), não no R2.** Todo o resto do sistema (fotos de veículo, currículo, imagem de vaga — inclusive a irmã `gerar-imagem-vaga`) usa R2/Cloudflare pra esse tipo de arquivo. Só essa function foge do padrão | leitura de `gerar-imagem/index.ts` linhas 74-81 vs. `gerar-imagem-vaga/index.ts` linhas 90-114 (mesma tarefa, R2 de verdade) |
| `gerar-imagem-vaga` usa a API de **edição** de imagem da OpenAI (não geração pura), compondo com a logo oficial e a foto da fachada da loja como referência — decisão deliberada pra não deixar a IA "adivinhar" a marca só por texto | comentário no código, linhas 51-55 |
| `ads-agent`, ação `pause_sold_ads`, é a **única** que dispensa autenticação de usuário — é chamada pelo trigger de venda (via `meta-capi-postback`), não por alguém logado no painel | leitura de `ads-agent/index.ts`, linha 61 |
| `ai-assistant` monta o contexto da IA lendo `brain_ia_knowledge`, um recorte de `ajuda_conteudos` ranqueado por relevância à pergunta (corrigido 17/08/2026 — antes cortava nos primeiros 20 registros sem olhar relevância) e uma amostra de 5 veículos disponíveis | leitura de `ai-assistant/index.ts`, linhas 55-70 |

## Becos sem saída — não repetir

- Não adianta testar `gerar-conteudo` achando que a IA está "burra" ou usando
  modelo errado sem antes confirmar qual provedor respondeu de fato — a
  function não informa isso na resposta; se o Gemini falhar silenciosamente
  (achado acima), o texto pode ter vindo do OpenAI/Groq sem aviso nenhum.

## Em aberto

- **Decisão pendente da Adriana**: confirmar o nome real do Secret do Gemini
  no Supabase (`GEMINI_API_KEY` ou `GEMINI_APY_KEY`) e corrigir
  `gerar-conteudo` pra checar os dois nomes, igual as outras duas functions
  já fazem. Não corrigido nesta sessão — só documentar.
- **`gerar-imagem` gravando fora do R2**: decidir se migra pro mesmo padrão
  de `gerar-imagem-vaga` (R2) ou se fica assim de propósito. Não alterado
  nesta sessão.
- `ai-agents` — decidir se vale finalizar (ligar a alguma tela) ou remover,
  já que nunca foi usada.
