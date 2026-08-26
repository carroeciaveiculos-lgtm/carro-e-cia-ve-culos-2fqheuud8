# Mercado Livre — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Última atualização: 2026-08-12.

## O caminho de um veículo até o anúncio

```
veiculos (CRM)
  └─ sync-plataforma          monta o payload e chama a API do ML
     │                        (1 veículo por vez — não existe endpoint de
     │                        "sincronizar tudo" pra essa plataforma)
     ├─ POST /items           veículo novo (sem ml_item_id ainda)
     └─ PUT /items/{id}       veículo já publicado (ml_listing_type existente)
  └─ ml_listings              1 linha por veículo, status active/error
  └─ sync_log                 histórico de tentativas (plataforma_id = ML)
```

O robô automático (cron `ml-sync`) usa o mesmo código de montagem de payload
(`_shared/ml-client.ts`) — qualquer bug nesse arquivo afeta os dois caminhos
(manual e automático).

## Fatos confirmados

| Fato | Como se sabe |
|---|---|
| Categoria (`VEHICLE_BODY_TYPE`) do ML aceita só: SUV, Pick-Up, Hatch, Sedã, Van, Coupé | `GET /categories/MLB1744/attributes` ao vivo, 12/08/2026 |
| `FUEL_TYPE` não tem valor "Flex" — o correto pra carro flex é **"Gasolina e álcool"** | mesma consulta; "Flex" só existe como "Híbrido/Flex", pra híbridos |
| `COLOR` usa "Prateado" (não "Prata") e "Bordô" (não "Vinho") | mesma consulta |
| `TRANSMISSION` usa "Automática CVT" (não "CVT") e "Semiautomática" (não "Automatizada") | mesma consulta |
| `KILOMETERS` e `ENGINE_DISPLACEMENT` vão como **texto simples** (`"92000km"`), não como `value_struct` estruturado | doc oficial `developers.mercadolivre.com.br/pt_br/publicacao-de-automoveis`, exemplo de POST real |
| `PLATE_FINAL_DIGIT` não existe como atributo da categoria MLB1744 — sempre descartado pelo ML | erro real do ML, `item.attributes.invalid`, 12/08/2026 |
| Localização vai em `location.city.id` (aninhado), não em `location.city_id` (campo solto) | doc oficial, mesmo exemplo de POST |
| ID de cidade do ML é um valor opaco tipo `TUxCQ1VCRWE3Nzcz` — **não é sequencial nem fácil de adivinhar**, tem que vir da API (`/classified_locations/states/BR-MG`) | consulta ao vivo, 12/08/2026 |
| O cache `ml_cities_cache` para Uberaba estava com o ID errado desde que foi criado (22/07/2026) — nunca tinha sido conferido contra a API real | comparação direta, 12/08/2026 |
| Em UPDATE (PUT, veículo já publicado), o ML parece ser mais tolerante — não bloqueia a sincronização toda por um atributo opcional errado (fica com o valor antigo). Em CREATE (POST, veículo novo) ele bloqueia. | 12 veículos flex já ativos continuaram sincronizando normalmente mesmo com o bug do "Flex" no ar; só o City (uma publicação nova) travou |
| A cilindrada no cadastro (`veiculos.cilindrada`) virou campo numérico só em litros (26/08/2026) — antes era texto livre e vinha misturado (litro "1.5" ou cc direto "1598") | correção real, pedido da Adriana |

## Becos sem saída — não repetir

- **`WebFetch` na API do Mercado Livre sempre dá 403.** A ferramenta de busca
  de página do Claude Code é bloqueada pelo ML (provavelmente por User-Agent
  ou IP de datacenter). Usar `curl -A "Mozilla/5.0" ...` via Bash funciona.
- **`GET /sites/MLB/search` exige autenticação hoje** — antes era público.
  Não dá pra usar pra inspecionar anúncios de exemplo sem token.
- **Consultar `GET /items/{id}` sem token, várias vezes seguidas, dispara
  bloqueio do `PolicyAgent` do ML** (`PA_UNAUTHORIZED_RESULT_FROM_POLICIES`).
  Espaçar as chamadas ou usar token de autenticação.
- **Não confiar no `success: true` do backend sem checar o item real** — a
  função pode reportar sucesso mesmo quando o anúncio não existe de fato
  (visto antes com o Haval, causa era outra, mas o hábito de checar
  `curl -I` na URL do anúncio ou o `og:title` vale sempre).

## De/para do vocabulário CRM ↔ Mercado Livre

Fonte da verdade: `supabase/functions/_shared/ml-client.ts` (`ML_FUEL_MAP`,
`ML_COLOR_MAP`, `ML_TRANSMISSION_MAP`, `ML_BODY_TYPE_MAP`). O arquivo
`src/lib/ml-preflight.ts` mantém uma cópia só das **chaves reconhecidas**
(sem o nome traduzido) pra avisar o operador antes de tentar sincronizar —
se adicionar um valor novo aqui, atualizar os dois arquivos.

| Campo no CRM | Valor aceito no ML | Observação |
|---|---|---|
| combustível `flex` | "Gasolina e álcool" | não existe "Flex" no ML |
| combustível `gasolina`/`diesel`/`alcool`/`hibrido`/`eletrico` | Gasolina / Diesel / Álcool / Híbrido / Elétrico | sem mudança |
| cor `prata` | "Prateado" | |
| cor `vinho` | "Bordô" | |
| câmbio `cvt` | "Automática CVT" | |
| câmbio `automatizada` | "Semiautomática" | |
| categoria `sedan` | "Sedã" (sem acento espanhol) | |
| categoria `picape` | "Pick-Up" | |
| categoria fora de {suv, picape, hatch, sedan, van, esportivo} | — | sincronização falha, sem fallback |

## Selo "criado com o Skip"

O site foi originalmente montado na plataforma Skip (`goskip.dev`), que
injetava um selo no rodapé via `<script src="https://goskip.dev/skip.js">`
no `index.html`. Removido em 12/08/2026 (não é mais editado por lá).
Confirmado sumido no site publicado pela Adriana no mesmo dia.

## Em aberto — pendente pra continuar amanhã

- **Os 27 anúncios já publicados antes da correção do formato de
  localização** (`location.city_id` → `location.city.id`) podem estar sem
  cidade certa no Mercado Livre — não foram ressincronizados ainda. Mexe em
  anúncio já ao vivo, então precisa de autorização separada da Adriana antes
  de rodar.
- **Land Rover Range Rover Evoque com erro de sincronização** — mensagem do
  ML: `"Tipo de anúncio não disponível na conta atualmente. Disponível hoje:
  Prata."` (05/08/2026). É problema de tier/plano da conta no Mercado Livre,
  não um bug de payload — não investigado ainda.
- **`src/components/admin/portais/SyncNowButton.tsx` está órfão e quebrado**
  (não manda o campo `platform` pra `sync-plataforma`, então sempre falhava)
  — achado durante a auditoria de 12/08/2026, mas não está importado em
  nenhuma tela hoje, então não afeta ninguém. Decidir: apagar ou consertar
  pra uso futuro.
- **Webmotors: credenciais de produção ainda voltam 401** — troca feita pela
  Adriana, aguardando confirmação do Gabriel (suporte Webmotors). Bloqueia
  todo o sync automático da Webmotors (6 veículos em fila com erro/pendente).
  Sem ação nossa possível até a Webmotors confirmar.
- **Mobile: foto de capa ainda sobrepõe descrição/preço em `/estoque`**
  (o desktop já foi corrigido em 12/08/2026). Causa ainda não identificada —
  aguardando print de tela da Adriana pra reproduzir o problema.
