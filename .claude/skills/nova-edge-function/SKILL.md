---
name: nova-edge-function
description: >
  Use ao criar, renomear, deletar ou fazer deploy de uma Supabase Edge Function
  deste projeto, ao integrar uma nova plataforma de sync (portal, webhook, cron),
  ou ao investigar HTTP 401 vindo de uma function. Cobre a regra de verify_jwt,
  a autenticação interna e o checklist de deploy.
---

# Criar ou alterar uma Edge Function

## A regra que mais quebra produção

O Supabase valida `verify_jwt` **no gateway, antes de o código da função rodar**.
Se a função não tiver entrada em `supabase/config.toml`, o padrão é `true` e
qualquer chamada sem JWT recebe **401** — a lógica de autenticação interna que
você escreveu nunca chega a executar.

Isso já aconteceu neste projeto com `avaliar-qualidade-anuncios` e
`publicar-social`: ambas validam `x-internal-secret` corretamente e mesmo assim
retornavam 401, porque não estavam declaradas.

## Passo 1 — classifique antes de escrever código

Quem vai chamar esta função?

| Chamador | `verify_jwt` | Autenticação interna |
|---|---|---|
| Webhook externo (Meta, ML, Webmotors, Autentique) | `false` | valide assinatura/HMAC (`_shared/hmac-validator.ts`) |
| Cron do Postgres (`net.http_post`) | `false` | `isInternalRequestAuthorized(req)` |
| Outra Edge Function (`fetch` server-to-server) | `false` | `isInternalRequestAuthorized(req)` |
| Endpoint público (sitemap, OG image, feed) | `false` | nenhuma — é público de propósito |
| Só o browser, via `supabase.functions.invoke()` | `true` | o JWT já basta |

Regra de bolso: **`verify_jwt = false` sempre que não houver um usuário de
verdade do outro lado.** Nesse caso, a proteção passa a ser sua
responsabilidade dentro da função.

Atenção: `supabase.functions.invoke()` do browser envia a anon key como Bearer
mesmo com o visitante deslogado — e a anon key é um JWT válido. Por isso
funções chamadas de página pública ainda funcionam com `verify_jwt = true`.

## Passo 2 — esqueleto da função

`supabase/functions/<nome>/index.ts`:

```ts
import { corsHeaders } from '../_shared/cors.ts'
import { isInternalRequestAuthorized, unauthorizedResponse } from '../_shared/internal-auth.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!isInternalRequestAuthorized(req)) return unauthorizedResponse(corsHeaders)

  try {
    // ...
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

Omita o `isInternalRequestAuthorized` só em endpoints públicos ou frontend-only.
Para webhook externo, troque por validação de assinatura do provedor.

Reaproveite `_shared/` antes de escrever do zero: `ml-client.ts`, `wm-soap.ts`,
`gemini-client.ts`, `r2-storage.ts`, `rate-limiter.ts`, `validate-payload.ts`,
`error-map.ts`.

## Passo 3 — declare no config.toml

**Antes do deploy**, sempre, sem exceção:

```toml
[functions.<nome>]
verify_jwt = false
```

## Passo 4 — atualize a documentação

Adicione a linha na tabela de classificação de `docs/edge-functions-rules.md`.
A tabela é a fonte de verdade humana; o `config.toml` é a de máquina. Quando as
duas divergem, alguém vai depurar 401 por horas.

## Passo 5 — chamando a função

**De um cron do Postgres** (dentro de uma migration):

```sql
SELECT cron.schedule(
  '<nome>-cron',
  '0 3 * * 0',
  $$
    SELECT net.http_post(
      url := 'https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/<nome>',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', coalesce(public.get_internal_service_secret(), '')
      ),
      body := '{}'::jsonb
    );
  $$
);
```

**De outra Edge Function:**

```ts
await fetch(`${supabaseUrl}/functions/v1/<nome>`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-internal-secret': Deno.env.get('INTERNAL_SERVICE_SECRET') || '',
  },
  body: JSON.stringify({}),
})
```

Não engula o resultado num `catch {}` vazio — foi assim que a falha do
`publicar-social` passou meses despercebida. Logue o status quando não for 2xx.

**Do frontend:** via `src/services/<dominio>.ts`, nunca direto do componente.

## Passo 6 — deploy e verificação

```bash
supabase functions deploy <nome>

# webhook/cron: deve responder 200, não 401
curl -X POST https://htpcqdbhktmvppfemnad.supabase.co/functions/v1/<nome> \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: $INTERNAL_SERVICE_SECRET" \
  -d '{}'
```

## Verificação final — nenhuma função órfã

Toda função em disco precisa de entrada no `config.toml`. Para conferir:

```powershell
$cfg = Get-Content supabase/config.toml -Raw
$declaradas = [regex]::Matches($cfg, '\[functions\.([^\]]+)\]') | ForEach-Object { $_.Groups[1].Value }
$emDisco = (Get-ChildItem supabase/functions -Directory | Where-Object { $_.Name -ne '_shared' }).Name
$emDisco | Where-Object { $declaradas -notcontains $_ }
```

Saída vazia = tudo certo. Qualquer nome listado é uma function que vai dar 401
se for chamada por cron, webhook ou outra function.

## Depurando um 401

1. A função tem entrada em `config.toml`? (causa nº 1)
2. O `verify_jwt` está coerente com quem chama?
3. O deploy foi feito **depois** da mudança no `config.toml`?
4. O chamador está mandando `x-internal-secret`, e o secret
   `INTERNAL_SERVICE_SECRET` está setado no projeto?
5. Tem `Authorization` sendo enviado com token inválido? Melhor não mandar nada
   do que mandar errado.
