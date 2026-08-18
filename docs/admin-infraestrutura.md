# Infraestrutura — armazenamento (R2) e SEO — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa. Complementa `docs/R2_CORS_CONFIGURATION.md` (só
configuração de CORS, não as functions em si).

Última atualização: 2026-08-18.

## Mapa das 5 functions

| Function | Status | O que faz |
|---|---|---|
| `get-r2-presigned-url` | ✅ Ativa, é o coração do upload de foto | Gera URL assinada pra upload direto no R2 — usada por praticamente toda tela que sobe imagem |
| `auto-migrate-r2` | ⚪ **Desnecessária hoje** | Migração em lote — Storage já está praticamente vazio (migrado por outro caminho, ver achado abaixo). Tem bug real (`unexpected end of file`, AWS SDK x Deno), não vale corrigir sem necessidade |
| `migrar-storage-r2` | ⚪ **Desnecessária hoje** | Mesmo propósito, versão manual (login) — mesma conclusão |
| `og-vehicle` | ✅ Ativa e conectada | Gera prévia rica (foto+preço) pra compartilhamento de veículo — botão "Compartilhar" já usa essa rota de ponta a ponta |
| `sitemap` | ✅ **Corrigida 18/08/2026** | Gera sitemap.xml dinâmico — era código morto (arquivo estático tomava o lugar dela), agora é a resposta real de `/sitemap.xml` |

## `get-r2-presigned-url` — o upload real de foto

Recebe `fileName`/`fileType`/`bucketName` (o `bucketName` vira só uma pasta
dentro do bucket único configurado em `R2_BUCKET`, não um bucket R2
diferente de verdade), valida contra uma lista fixa de pastas permitidas
(`ALLOWED_BUCKETS`) e devolve uma URL assinada válida por 10 minutos. Usada
por `VehicleFormModal.tsx`, `Avaliacao.tsx`, `BatchPhotoUploader.tsx`,
`ImageEditorModal.tsx` e `MediaCenter.tsx` — é o caminho real de praticamente
toda foto que entra no sistema hoje.

## `auto-migrate-r2` e `migrar-storage-r2` — migração já concluída por outro caminho

As duas existem pra mover arquivo do Supabase Storage pro R2 (a infra oficial
hoje, por isso a regra "Cloudflare escreve, Supabase só lê"). Diferença
entre elas: `auto-migrate-r2` autentica por secret (`AUTO_MIGRATE_SECRET`,
pra rodar sem login — cron ou chamada manual via curl) e processa em lote
com controle de progresso (`r2_migration_progress`); `migrar-storage-r2`
autentica por login de usuário e tem ações (`test`/`migrate`/
`update_urls`/`cleanup`).

**Achado 18/08/2026, revisado no mesmo dia**: a análise inicial (baseada só
no código e no `r2_migration_progress` travado) concluiu que a migração
tinha ficado pela metade e precisava ser retomada. **A Adriana lembrou que
já tinha rodado essa sincronização por fora, via PowerShell, dias atrás** —
conferido direto no Storage e confirmado:

| Fato | Como se sabe |
|---|---|
| Hoje só existem 3 buckets com dado no Supabase Storage, todos pequenos: `contratos-consignacao` (6 arquivos, testes desta sessão), `documentos-veiculos` (4 arquivos, 299 KB), `propostas-geradas` (2 arquivos) | `select bucket_id, count(*), sum(size) from storage.objects group by bucket_id`, 18/08/2026 |
| **Nenhum** dos buckets que `auto-migrate-r2` migraria (`veiculos`, `media`, `site-assets`, `imagens`, `logos-e-imagens`, `veiculos-videos`, `veiculos-fotos`, etc.) tem arquivo nenhum hoje | mesma consulta |
| `r2_migration_progress` tem 1 linha travada desde 05/08/2026 (tentativa antiga, via essa function) — mas a migração de verdade aconteceu depois, por outro método (PowerShell, fora deste código) | `select * from r2_migration_progress` + confirmação da Adriana |
| Tentei implantar e rodar `auto-migrate-r2` mesmo assim (achando que precisava) — achei um bug real: `event loop error: TypeError: unexpected end of file`, incompatibilidade entre a AWS SDK (`@aws-sdk/client-s3`) e o ambiente Deno do Supabase ao falar com o R2. **Não vale a pena corrigir** — não tem mais nada pra migrar | testado ao vivo, logs da function, 18/08/2026 |

**Conclusão**: as duas functions ficam como código morto/desnecessário — não
há mais trabalho de migração pendente. Se no futuro sobrar arquivo novo no
Supabase Storage (por engano ou função nova mal configurada), esse bug
precisa ser corrigido antes de tentar usar `auto-migrate-r2` de novo.

## `og-vehicle` — ativa e conectada (correção de achado, 18/08/2026)

Gera uma página HTML com meta tags Open Graph específicas do veículo (foto,
preço, título) — filtra por `User-Agent` de bot de rede social (WhatsApp,
Facebook, Telegram etc.) antes de gerar. Roteada via `public/_redirects`:

```
/s/:slug → https://.../functions/v1/og-vehicle?slug=:slug
```

**Correção de achado — 18/08/2026**: na primeira passada eu tinha
concluído que nada gerava link nesse formato (busca por `'/s/'` literal não
encontrou nada). **Estava errado** — o botão "Compartilhar" já existe na
página do veículo (`Veiculo.tsx`, ícone `Share2` → `handleShareCTA`) e já
usa `getShareUrl()` (`src/lib/cta-router.ts`), que monta exatamente
`https://www.carroeciamotors.com.br/s/{slug}` (minha busca anterior não
pegou porque o link é montado dentro de um template string, sem a
substring `'/s/'` isolada). O fluxo completo — botão → link `/s/{slug}` →
redirecionamento → `og-vehicle` → prévia rica — já está implementado e
conectado de ponta a ponta. **Nada precisa ser construído aqui.**

## `sitemap` — corrigido em 18/08/2026, era código morto

**Achado 18/08/2026, o mais concreto deste grupo, já corrigido**:
`robots.txt` promete um sitemap em `/sitemap.xml`, e testando ao vivo
(`curl`) esse endereço realmente respondia XML válido, HTTP 200 — só que
**não era gerado por essa function**. Era um arquivo **estático**,
`public/sitemap.xml`, commitado no repositório e nunca mais atualizado
desde **20/04/2026**. Como o Cloudflare Workers serve arquivo estático
antes de cair na SPA, esse arquivo velho sempre ganhava — a function
`sitemap` (que busca os dados certos, ao vivo, do banco) nunca chegava a
ser executada, porque nada apontava pra ela.

**Correção aplicada**: `public/sitemap.xml` removido + regra nova em
`public/_redirects` (`/sitemap.xml → functions/v1/sitemap`, **status 301**
— mesmo padrão do `/s/:slug` do `og-vehicle` acima). `/sitemap.xml` passa a
redirecionar pra URL da function, sempre com os veículos e posts reais do
banco na hora.

**Achado no caminho — primeira tentativa (status 200) falhou o deploy**:
tentei primeiro um proxy/rewrite (status 200, pra manter a URL
`/sitemap.xml` sem redirecionamento visível) — o build quebrou com
`"Proxy (200) redirects can only point to relative paths"`. Cloudflare
Workers Static Assets só permite proxy (200) pra caminho relativo do
mesmo domínio; pra URL externa (como a do Supabase) só funciona
redirecionamento de verdade (301/302). Corrigido pra 301. Testado com
`bun run build` — confirmado que `dist/sitemap.xml` não existe mais e
`dist/_redirects` tem a regra nova.

**Confirmado em produção (18/08/2026, commit `86b6c48`)**: build passou,
`curl -I https://www.carroeciamotors.com.br/sitemap.xml` devolve
`301 → https://.../functions/v1/sitemap`, seguindo o redirecionamento
devolve `200` com **40 URLs** (10 páginas fixas + 25 veículos + 5 posts de
blog), todas com `<lastmod>` real — antes eram 19 URLs sem nenhuma data.
Resolvido de ponta a ponta.

| Fato | Como se sabe |
|---|---|
| `public/sitemap.xml` tem só **19 URLs** (10 páginas fixas + 9 veículos) | `grep -c "<url>" public/sitemap.xml` |
| Hoje existem **25 veículos disponíveis e visíveis no site** — pelo menos 16 não estão no sitemap que o Google enxerga, e não há garantia de que os 9 que estão lá ainda existem/estão à venda | `select count(*) from veiculos where status='disponivel' and exibir_no_site=true`, 18/08/2026 |
| Nenhum blog post publicado depois de abril está no sitemap | mesma comparação de datas |
| Não existe nenhuma regra em `public/_redirects` (nem em nenhum outro lugar do projeto) apontando `/sitemap.xml` pra function `sitemap` — diferente de `og-vehicle`, que pelo menos tem a rota `/s/:slug` | grep completo no projeto, 18/08/2026 |

## Becos sem saída — não repetir

- Não gastar tempo de novo achando que o botão "Compartilhar veículo" não
  existe — já existe (`Veiculo.tsx`, ícone `Share2`) e já usa o `og-vehicle`
  de ponta a ponta. Se um cliente reportar prévia genérica no WhatsApp,
  investigar se o `slug`/`id` do veículo está batendo certo em `og-vehicle`,
  não assumir que falta construir o botão.

## Em aberto

- Nenhuma ação pendente aqui — migração já concluída (via PowerShell, fora
  deste código, ver achado acima). `AUTO_MIGRATE_SECRET` foi rotacionado
  em 18/08/2026 (valor antigo era ilegível, só dava pra trocar por um
  novo) mesmo sem a function ter uso previsto — só por ela ter sido
  implantada nesta sessão pela primeira vez (antes não existia no
  Supabase, só no código-fonte).
- Se um dia sobrar arquivo novo no Supabase Storage fora dos 3 buckets
  esperados, o bug do `auto-migrate-r2` (AWS SDK x Deno) precisa ser
  corrigido antes de reaproveitá-la.
