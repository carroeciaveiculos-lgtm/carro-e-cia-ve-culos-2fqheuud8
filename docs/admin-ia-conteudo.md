# IA e geração de conteúdo (admin) — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa. `ai-sdr` (Clara) não está aqui — tem doc próprio em
`docs/leads-e-sdr.md`.

Última atualização: 2026-08-18.

## Mapa das 8 functions

*(era 9 — `ai-agents` removida em 18/08/2026, ver achado abaixo)*

| Function | Status | O que faz |
|---|---|---|
| `ai-assistant` | ✅ Ativa | "Brain IA" — assistente de conhecimento geral, usado na Central de Ajuda, em `/admin/configuracoes` (aba Brain IA) e no onboarding |
| `ads-agent` | ✅ Ativa | Agente de anúncios (Meta Ads) — chat em linguagem natural, lista/pausa campanhas; também pausa anúncio de veículo vendido |
| `gerar-conteudo` | ✅ Ativa | Geração de conteúdo de blog/SEO — chave do Gemini corrigida em 18/08/2026 (ver abaixo) |
| `gerar-conteudo-social` | ✅ Ativa | Legenda de post pra Instagram/Facebook, de UM veículo específico |
| `gerar-ideias-social` | ✅ Ativa | Aba "Ideias com IA" — sugestões de post que não dependem de veículo |
| `gerar-imagem` | ✅ **Corrigida 18/08/2026** | Imagem de blog via OpenAI — agora grava no R2, igual o resto do sistema (antes gravava no Supabase Storage) |
| `gerar-imagem-vaga` | ✅ Ativa | Imagem de post de vaga via OpenAI, usando logo+fachada reais como referência |
| `gerar-vaga-ia` | ✅ Ativa | Título/descrição de vaga via Gemini |

## Fatos confirmados

| Fato | Como se sabe |
|---|---|
| **[REMOVIDA 18/08/2026] `ai-agents` nunca foi usada.** Tinha wrapper próprio (`src/lib/ai-agents.ts`) mas nada importava esse arquivo; `logs_ia` nunca teve uma linha com `acao ilike 'ai_agent%'`. Os dois "agentes" (negociação e avaliação de troca via IA) foram construídos e nunca ligados a uma tela — decisão da Adriana foi remover em vez de finalizar. Apagados `src/lib/ai-agents.ts`, `supabase/functions/ai-agents/` e a function implantada no Supabase | grep em `src/` (sem importador), `select from logs_ia where acao ilike 'ai_agent%'` → 0 linhas, 18/08/2026 |
| **A chave do Gemini configurada de verdade no Supabase é `GEMINI_APY_KEY`** (erro de digitação histórico, "APY" em vez de "API" — confirmado pela Adriana em 18/08/2026). `GROQ_API_KEY` e `OPENAI_API_KEY` estão certas como estão. `_shared/gemini-client.ts` já documentava isso desde 12/08/2026 (achado na época: o GeminiClient nunca tinha funcionado nenhuma vez, `logs_ia` sem nenhum sucesso, porque só procurava `GEMINI_API_KEY`) e aceita as duas grafias por decisão deliberada, pra não depender de renomear o secret | comentário em `_shared/gemini-client.ts`, linhas 215-220; confirmado pela Adriana, 18/08/2026 |
| **Corrigido 18/08/2026 — `gerar-conteudo` era a única exceção sem essa rede de segurança.** Lia só `GEMINI_APY_KEY`, o que funcionava (é o nome real), mas sem o fallback pra `GEMINI_API_KEY` que as demais já tinham — se o secret um dia fosse renomeado pro nome certo, só essa function quebraria silenciosamente (cairia pro OpenAI/Groq sem avisar). Corrigida pra aceitar as duas grafias, igual as irmãs, e reimplantada (`supabase functions deploy gerar-conteudo`) | `gerar-conteudo/index.ts`, linha 48-53 |
| `gerar-conteudo` chama o modelo `gemini-3.5-flash` hardcoded — mais antigo que o `gemini-3.6-flash` usado em `gerar-vaga-ia` e confirmado como o atual em verificação anterior (ver `MEMORY_WORK.MD`, pendência 5) | leitura de `gerar-conteudo/index.ts`, linha 276 |
| **[CORRIGIDO 18/08/2026] `gerar-imagem` grava no R2 agora.** Antes gravava no Supabase Storage (bucket `imagens`), diferente do resto do sistema. Reescrita pra usar `S3Client`/`PutObjectCommand` igual `gerar-imagem-vaga` (pasta `blog/` no bucket R2), `deno.json` ganhou o import do `@aws-sdk/client-s3`, reimplantada | `gerar-imagem/index.ts`, reescrito 18/08/2026 |
| `gerar-imagem-vaga` usa a API de **edição** de imagem da OpenAI (não geração pura), compondo com a logo oficial e a foto da fachada da loja como referência — decisão deliberada pra não deixar a IA "adivinhar" a marca só por texto | comentário no código, linhas 51-55 |
| `ads-agent`, ação `pause_sold_ads`, é a **única** que dispensa autenticação de usuário — é chamada pelo trigger de venda (via `meta-capi-postback`), não por alguém logado no painel | leitura de `ads-agent/index.ts`, linha 61 |
| `ai-assistant` monta o contexto da IA lendo `brain_ia_knowledge`, um recorte de `ajuda_conteudos` ranqueado por relevância à pergunta (corrigido 17/08/2026 — antes cortava nos primeiros 20 registros sem olhar relevância) e uma amostra de 5 veículos disponíveis | leitura de `ai-assistant/index.ts`, linhas 55-70 |

## Becos sem saída — não repetir

- Não gastar tempo tentando confirmar o nome do secret do Gemini de novo —
  já está confirmado (`GEMINI_APY_KEY`, ver acima). Não adianta também testar
  `gerar-conteudo` achando que a IA está "burra" ou usando modelo errado sem
  antes confirmar qual provedor respondeu de fato — a function não informa
  isso na resposta; se o Gemini falhar, o texto pode ter vindo do
  OpenAI/Groq sem aviso nenhum (isso é comportamento normal da cadeia de
  fallback, não um bug).

## Em aberto

- Imagens que `gerar-imagem` já tinha gravado no Supabase Storage antes da
  correção continuam lá — migração pro R2 é tratada em
  `docs/admin-infraestrutura.md` (retomar `auto-migrate-r2`).
