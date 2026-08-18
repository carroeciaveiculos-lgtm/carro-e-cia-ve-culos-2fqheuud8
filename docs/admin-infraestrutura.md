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
| `auto-migrate-r2` | 🟡 Rodou uma vez, parou | Migração em lote de arquivos do Supabase Storage pro R2 — sem cron, ficou 1 arquivo travado |
| `migrar-storage-r2` | 🟡 Nunca chamada pela tela | Mesmo tipo de migração, versão manual (login), sem nenhum botão que a acione |
| `og-vehicle` | 🟡 Pronta, mas nunca disparada | Gera prévia rica (foto+preço) pra compartilhamento de veículo — rota existe, ninguém gera o link que a aciona |
| `sitemap` | ✅ **Corrigida 18/08/2026** | Gera sitemap.xml dinâmico — era código morto (arquivo estático tomava o lugar dela), agora é a resposta real de `/sitemap.xml` |

## `get-r2-presigned-url` — o upload real de foto

Recebe `fileName`/`fileType`/`bucketName` (o `bucketName` vira só uma pasta
dentro do bucket único configurado em `R2_BUCKET`, não um bucket R2
diferente de verdade), valida contra uma lista fixa de pastas permitidas
(`ALLOWED_BUCKETS`) e devolve uma URL assinada válida por 10 minutos. Usada
por `VehicleFormModal.tsx`, `Avaliacao.tsx`, `BatchPhotoUploader.tsx`,
`ImageEditorModal.tsx` e `MediaCenter.tsx` — é o caminho real de praticamente
toda foto que entra no sistema hoje.

## `auto-migrate-r2` e `migrar-storage-r2` — migração que não terminou

As duas existem pra mover arquivo do Supabase Storage pro R2 (a infra oficial
hoje, por isso a regra "Cloudflare escreve, Supabase só lê"). Diferença
entre elas: `auto-migrate-r2` autentica por secret (`AUTO_MIGRATE_SECRET`,
pra rodar sem login — cron ou chamada manual via curl) e processa em lote
com controle de progresso (`r2_migration_progress`); `migrar-storage-r2`
autentica por login de usuário e tem ações (`test`/`migrate`/
`update_urls`/`cleanup`).

**Achado 18/08/2026**: nenhuma das duas está realmente em uso hoje.

| Fato | Como se sabe |
|---|---|
| `auto-migrate-r2` não tem cron nenhum apontando pra ela | `select * from cron.job where command ilike '%auto-migrate-r2%'` → 0 linhas |
| `r2_migration_progress` tem **1 única linha**, parada em `status = 'processing'` desde **05/08/2026**, nunca completou nem deu erro — a migração rodou (manualmente, uma vez) e parou no meio | `select * from r2_migration_progress` |
| `migrar-storage-r2` não tem nenhum caller no `src/` — nenhum botão de tela aciona nenhuma das 4 ações dela | grep em `src/`, 18/08/2026 |
| Isso conecta com o achado de `gerar-imagem` (`docs/admin-ia-conteudo.md`): imagens que caem no Supabase Storage hoje (bucket `imagens`, que está na lista de buckets que `auto-migrate-r2` migraria) **não têm nenhum processo automático levando elas pro R2** — ficam lá pra sempre até alguém rodar a migração manualmente de novo | leitura cruzada dos dois achados |

## `og-vehicle` — pronta, mas nunca é chamada

Gera uma página HTML com meta tags Open Graph específicas do veículo (foto,
preço, título) — filtra por `User-Agent` de bot de rede social (WhatsApp,
Facebook, Telegram etc.) antes de gerar. Existe até uma regra de roteamento
pronta em `public/_redirects`:

```
/s/:slug → https://.../functions/v1/og-vehicle?slug=:slug
```

**Achado 18/08/2026**: nada no site gera link nesse formato (`/s/{slug}`) —
busquei em todo o `src/` e não achei nenhum botão "Compartilhar" ou geração
de link curto que use essa rota. Ou seja, a peça existe e o "encanamento"
existe, mas nunca é acionada. Quando um cliente compartilha o link normal de
um veículo (`/estoque/{slug}`) no WhatsApp, a prévia que aparece é a
genérica do site inteiro (logo, "Carro e Cia Veículos") — não a foto/preço
daquele carro específico, porque `src/components/SEO.tsx` só troca as meta
tags via JavaScript, que bots de rede social não executam.

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

- Não adianta procurar um botão "Compartilhar veículo" pra testar o
  `og-vehicle` — ele não existe na interface hoje.

## Em aberto

- **Decisão pendente da Adriana** — se vale a pena criar um botão
  "Compartilhar" que gere link `/s/{slug}` pra aproveitar o `og-vehicle`
  já pronto, ou remover a rota/function se não for prioridade.
- **Decisão pendente da Adriana** — retomar a migração R2 (rodar
  `auto-migrate-r2` de novo, ou fazer manualmente) pros arquivos que ainda
  estão no Supabase Storage, incluindo os que `gerar-imagem` continua
  criando lá hoje.
