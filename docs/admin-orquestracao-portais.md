# Orquestração de portais (admin) — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa. Complementa `docs/webmotors-integracao.md`,
`docs/mercadolivre-integracao.md` e `docs/integracao-napista.md` — aqui é
sobre as 3 functions "genéricas" que ficam no meio do caminho entre a tela e
essas integrações específicas.

Última atualização: 2026-08-18.

## Resumo — só 1 das 3 está viva

| Function | Status | O que realmente faz |
|---|---|---|
| `sync-plataforma` | ✅ **Ativa** | Publica/despublica veículo no **Mercado Livre** — chamada real de `Portais.tsx` (botão manual e sincronização em lote) |
| `sync-estoque` | ❌ **Código morto** | Nunca é chamada por nada hoje — nem tela, nem cron |
| `admin-plataformas-api` | ❌ **Código morto** | Nunca é chamada por nada hoje — nem tela, nem outra function |

O botão real de Publicar/Despublicar em `/admin/portais` (`PortalCard.tsx` +
`Portais.tsx`, `handleSync`) roteia por plataforma pra 3 functions
**diferentes**, nenhuma delas genérica: `webmotors` → `wm-sync`
(`triggerWMSync`), `napista` → `napista-sync` (`triggerNapistaSync`),
`mercadolivre` → `sync-plataforma` (`syncVehicleToPlatform`/
`batchSyncVehicles`). Ver os docs de cada portal pra detalhe.

## `sync-plataforma` — a única viva

Só aceita `platform === 'mercadolivre'` — qualquer outro valor recebe
`400 "Plataforma não suportada"` (não é bug, é intencional: Webmotors e
NaPista têm suas próprias functions, não passam por aqui). Recebe
`{ veiculo_id, platform, action }`, `action: 'unpublish'` desativa o
anúncio, qualquer outro valor publica/atualiza.

## `sync-estoque` — achado 18/08/2026, código morto

| Fato | Como se sabe |
|---|---|
| **Nenhum caller vivo**: as duas funções que a invocam (`forceSync`, `triggerSyncEstoque` em `src/services/plataformas.ts`) não são chamadas por nenhum componente da tela; não existe cron apontando pra ela (`select * from cron.job where command ilike '%sync-estoque%'` → 0 linhas); `logs_integracao` nunca teve uma linha com `portal` de nenhum outro portal além do que o Mercado Livre grava por outro caminho | grep no `src/`, consulta em `cron.job` e `logs_integracao`, 18/08/2026 |
| **Mesmo se fosse chamada, ela finge sucesso pra qualquer portal que não seja Mercado Livre** — o loop final (`for (const config of configs)`) grava `status: 'sucesso'` em `logs_integracao` pra todo portal ativo em `configuracoes_api` sem chamar nenhuma API de verdade | leitura de `sync-estoque/index.ts`, linhas 126-137 |
| **Ignora os parâmetros que o frontend manda**: `forceSync(slug)` envia `{ platform: slug }` e `triggerSyncEstoque()` envia `{ force: true }`, mas a function só lê `body.veiculo_id` — os outros dois campos não têm efeito nenhum no código | leitura do destructuring da function vs. leitura de `src/services/plataformas.ts` |
| Trava real de duplicidade por placa (bloqueia publicar 2 veículos com mesma placa) — a única parte do código que parece ter sido testada de verdade | leitura, linhas 53-81 |

## `admin-plataformas-api` — achado 18/08/2026, código morto com armadilha

| Fato | Como se sabe |
|---|---|
| **Nenhum caller vivo**: zero referência em `src/`; a única menção em outra function (`napista-catalogo-trigger`) é um **comentário explicando por que ela NÃO usa esta function**, não uma chamada real | grep em `src/` e `supabase/functions/`, 18/08/2026 |
| **Armadilha se algum dia for conectada ao frontend**: quando chamada com sessão de usuário normal (`ctx.authMode === 'user'`), ela só libera acesso pra **um e-mail hardcoded**, `adriana.araujo@kmzero.com.br` — qualquer outro usuário, **inclusive admin_master de verdade**, recebe `403 Acesso negado`. Não usa o campo `usuarios.nivel` como todo o resto do sistema | leitura de `admin-plataformas-api/index.ts`, linhas 29-47 |
| Só funciona hoje via chamada server-to-server com segredo interno (`authMode: 'secret'`), que **pula** a checagem de e-mail acima — é por isso que não trava nada em produção agora (nada chama assim também, mas se chamasse, funcionaria) | leitura do mesmo bloco, linha 27 |
| Tem funcionalidade nenhuma outra function tem: popular cache de atributos/cidade do ML (`cache/populate`), consultar `logs_integracao` (`logs`), listar `plataformas` — parece ter sido pensada como um "gateway" único que depois não foi adotado | leitura do roteamento por `path`, linhas 49-70 |

## Becos sem saída — não repetir

- Não adianta procurar por que "sincronizar tudo de uma vez" não funciona
  no painel — não existe botão ligado a `sync-estoque` hoje; sincronização
  em lote real existe só pro Mercado Livre (`batchSyncVehicles`).

## Em aberto

- **Decisão pendente da Adriana**: `sync-estoque` e `admin-plataformas-api`
  são candidatas a remoção (código morto), no mesmo espírito de
  `whatsapp-webhook`/`webhook-portais` (ver `docs/meta-integracao.md`) e
  `wm-sync-test`/`wm-sync-validator-test` (`docs/edge-functions-rules.md`).
  Não removidas — só reportado, decisão não é automática.
- Se algum dia `admin-plataformas-api` for reaproveitada, o hardcode do
  e-mail kmzero precisa ser trocado por checagem de `nivel` antes de
  liberar pra qualquer admin de verdade usar — do jeito que está, bloquearia
  a própria Adriana se ela chamasse pelo login principal
  (`lgacomerciodeveiculos@gmail.com`).
