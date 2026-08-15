# NaPista — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, ou corrigir algo aqui, atualize este arquivo com data e
fonte, em vez de deixar só no histórico de conversa. Esse arquivo é apoio
consultivo permanente pra integração NaPista — mantenha em dia sempre que
mexer em `napista-auth`, `napista-client.ts` ou qualquer function que fale
com a API do NaPista.

Última atualização: 2026-08-14 (catálogo).

## O que é

NaPista é um portal/marketplace de veículos (`developers.napista.com.br`).
Documentação oficial: https://developers.napista.com.br/reference/boas-vindas
(pública, não precisa de senha — só o login de admin/editor é protegido).

## Status atual

- Secrets já salvos no Supabase: `NAPISTA_ID` (client_id, valor
  `carro-e-cia`), `NAPISTA_EMAIL`, `NAPISTA_SENHA`.
- `NAPISTA_EMAIL`/`NAPISTA_SENHA` **não são usados por nenhuma function** —
  são o login da loja no NaPista, usado manualmente pela Adriana na tela de
  autorização (passo 1 do fluxo abaixo), igual já faz com o Mercado Livre.
- `napista-auth` (function) e `napista_credentials` (tabela) deployados e
  **testados com sucesso em 14/08/2026**: login concluído, `sellerId`
  identificado (`7fdae29c-0cac-4fbd-b83f-dd5203a0ca87`), refresh automático
  de token confirmado funcionando (`action: 'refresh_check'`). Detalhe
  importante: o access_token do ambiente de desenvolvimento dura só **5
  minutos** — curto, mas o refresh cobre isso sem intervenção manual.
- Publicação de veículos (criar/atualizar anúncio) **ainda não foi
  implementada** — só a autenticação. Ver "Próximos passos" (Fase 2).

## Autenticação (OAuth2 via Keycloak)

Dois ambientes, URLs diferentes:

| | Desenvolvimento | Produção |
|---|---|---|
| Token | `https://auth.development.napista.com.br/realms/marketplace-dealer/protocol/openid-connect/token` | `https://auth.napista.com.br/realms/marketplace-dealer/protocol/openid-connect/token` |
| Auth | `https://auth.development.napista.com.br/realms/marketplace-dealer/protocol/openid-connect/auth` | `https://auth.napista.com.br/realms/marketplace-dealer/protocol/openid-connect/auth` |
| Logout | `.../logout` (mesmo padrão) | `.../logout` (mesmo padrão) |

Hoje só temos `client_id` (`NAPISTA_ID`) pro ambiente de **desenvolvimento**.
Pra produção é preciso pedir um novo client_id por
parceiros@napista.com.br, informando o nome do integrador.

**Fluxo (Authorization Code, sem client_secret — client público):**

1. `GET /functions/v1/napista-auth` (sem `code`) devolve `auth_url`. A
   Adriana abre esse link, loga no NaPista com `NAPISTA_EMAIL`/`NAPISTA_SENHA`
   e autoriza o integrador.
2. NaPista redireciona de volta pra
   `SUPABASE_URL/functions/v1/napista-auth?code=...`.
3. A function troca o `code` por `access_token`/`refresh_token`
   (`grant_type=authorization_code`).
4. Com o token, chama `GET /seller-inventory-api/seller/access` pra
   descobrir o(s) `sellerId` da loja e salva tudo em `napista_credentials`
   (access_token, refresh_token, expires_at, seller_id).
5. Refresh: `getValidNapistaToken()` em `_shared/napista-client.ts` renova
   automaticamente via `grant_type=refresh_token` quando faltam menos de 5
   minutos pro token expirar (mesmo padrão do `getValidMLToken`).

`sellerId` é obrigatório em **toda** chamada de estoque (path param
`{sellerId}`) — sem ele nada funciona.

## Catálogo — endpoints de consulta

Base: `https://api.development.napista.com.br/seller-inventory-api`

**Paths conferidos direto na API real em 14/08/2026** (a doc oficial erra o
path de marcas — ver "Becos sem saída"):

- `GET /catalog/makes/{category}` — marcas por categoria (`category`: `CAR`,
  `MOTORCYCLE`, `TRUCK`). Resposta: `{"items":[{"id":"AUDI","name":"AUDI"}]}`
  — pra marca, `id` e `name` são iguais (o nome em si é o id).
- `GET /catalog/{category}/make/{makeId}/models` — modelos por marca (esse
  aqui bate com a doc). Resposta: `{"items":[{"id":"A3","name":"A3"}]}` —
  também `id`==`name` pro modelo.
- `GET /catalog/versions/{category}?modelId=...` — versões (bate com a
  doc). Resposta: `{"items":[{"id":"77030732010","name":"2.0 TFSI SPORT S
  TRONIC"}]}` — aqui sim `id` é um código numérico diferente do nome; é
  esse `id` que vira `versionId` no cadastro do anúncio.
- `GET /catalog/attributes` — bate com a doc. Estrutura real completa:
  ```json
  {
    "colors": { "items": [{ "id": "WHITE", "name": "Branco" }, "...23 itens"] },
    "equipments": { "CAR": { "items": ["..."] }, "TRUCK": {...}, "MOTORCYCLE": {...} },
    "fuelTypes": { "items": [{ "id": "FLEX", "name": "Flex" }, "...12 itens"] },
    "transmissionTypes": { "items": [{ "id": "MANUAL", "name": "Manual" }, { "id": "AUTOMATIC", "name": "Automático" }] },
    "vahicleCategory": { "items": [{ "id": "CAR", "name": "Carro" }, "..."] },
    "doors": { "items": [{ "id": "3", "name": "3", "alternateId": 3 }, "..."] },
    "factoryYears": { "items": ["27 anos, 2026 a 2000"] },
    "modelYears": { "items": ["27 anos, mesmo formato"] }
  }
  ```
  (nota: `vahicleCategory` é o nome real do campo na API do NaPista — com
  esse erro de digitação mesmo, não é typo nosso).

Function `napista-sync-catalogo` (deployada em 14/08/2026) já implementa
isso — actions `sync_marcas`, `sync_modelos` (body: `marca_id`),
`sync_versoes` (body: `marca_id`+`modelo_id`), `sync_atributos`, e um atalho
`sync_para_estoque` que sincroniza só marcas/modelos/versões dos veículos
que a gente realmente tem em estoque (14 marcas / 27 combinações
marca+modelo hoje) em vez do catálogo universal do NaPista — evita
centenas de chamadas desnecessárias. Protegida por header
`x-internal-secret` (mesmo padrão do `wm-sync-catalogo`), não por JWT — só
roda via chamada manual/cron com o secret `INTERNAL_SERVICE_SECRET`.

Migration `napista_mapeamento_veiculos` (marca/modelo/versão → `versionId`)
ainda não criada — próximo passo.

## Anúncios — cadastro

`POST /seller-inventory-api/seller/{sellerId}/offer`

Campos obrigatórios: `versionId`, `transmissionType`, `color`, `fuelType`,
`price`, `manufacturedYear`, `modelYear`.

```json
{
  "versionId": "75630682016",
  "description": "...",
  "modelYear": 2020,
  "manufacturedYear": 2020,
  "mileage": 500000,
  "armoured": false,
  "price": 100000,
  "plate": "AAA-9999",
  "fuelType": "GASOLINE",
  "color": "WHITE",
  "transmissionType": "MANUAL",
  "equipments": ["CAR_1_AIRBAG"],
  "numberOfDoors": 4
}
```

- `fuelType` enum: `GASOLINE`, `ALCOHOL`, `DIESEL`, `FLEX`, `ELECTRIC`,
  `HYBRID`, `NGV`, `NGV_ALCOHOL`, `NGV_GASOLINE`, `NGV_FLEX`, `MIX`, `NA`
  (+ mais — checar `/catalog/attributes` pra lista completa, tinha "Show 12
  enum values" escondendo o resto).
- `transmissionType` enum: `MANUAL`, `AUTOMATIC` (só esses dois — sem CVT
  separado, diferente do Mercado Livre).
- `color` enum: `WHITE`, `BLACK`, `YELLOW`, `BLUE`, `GOLD`, `SILVER`,
  `BRONZE`, `BROWN`, `GRAY`, `RED`, `DARKRED`, `ORANGE`, `BEIGE`, `PINK`,
  `PURPLE`, `GREEN`, `BURGUNDY`, `INDIGO`, `NAVY`, `TURQUOISE`,
  `MULTICOLOR`, `UNKNOWN`, `PEARLED` (23 valores).
- Fotos **não** vão nesse endpoint — usar o endpoint de fotos, pesquisado em
  14/08/2026 (ver seção "Fotos" abaixo).
- `id` não deve ser enviado no cadastro.

Outros endpoints de anúncio já documentados (não pesquisados em detalhe
ainda): `PATCH` atualizar por id, `PUT` atualizar status, `DELETE` remover,
`GET` buscar por id / por loja e status.

## Fotos (pesquisado em 14/08/2026)

`POST /seller-inventory-api/seller/{sellerId}/offer/{offerId}/photos/url`

Exatamente o que precisamos — aceita **URL pública da imagem** direto (nossas
fotos já são URLs públicas no storage), não precisa de upload de arquivo.

```json
{
  "list": [
    { "url": "https://.../foto1.jpg", "order": 0 },
    { "url": "https://.../foto2.jpg", "order": 1 }
  ]
}
```

**Atenção — sobrescreve tudo**: a doc é explícita ("Overwriting the
previously registered photos") — cada chamada substitui a lista inteira de
fotos do anúncio, não adiciona. Pra atualizar fotos, sempre mandar a lista
completa atual, não só as novas.

`offerId` vem da resposta do `POST /seller/{sellerId}/offer` (cadastro do
anúncio) — ou seja, o fluxo é: 1) cria o anúncio sem foto, 2) pega o `id`
retornado, 3) chama esse endpoint de fotos com esse `id` como `offerId`.

Doc não mostra exemplo de resposta de sucesso — confirmar formato quando
`napista-sync` for implementado de verdade.

Outros endpoints de foto documentados, não pesquisados em detalhe (existem,
não bloqueiam o fluxo principal):
- `POST /seller/{sellerId}/offer/{offerId}/photos` — variante sem ser por
  URL (provavelmente upload de arquivo/binário, não pesquisado).
- `DELETE .../photos/{photoId}` — remove uma foto específica.
- `DELETE .../photos` — remove todas as fotos do anúncio.

Achado à parte: existe também `GET /seller/{sellerId}/leads` ("Listar Leads
Pelo Id da Loja") — o NaPista manda lead de volta pra gente. Não pesquisado
ainda, mas relevante pro futuro (Clara/CRM podem precisar receber isso).

## Próximos passos (Fase 2 — plano de ponta a ponta, 14/08/2026)

1. ~~Deploy de `napista-auth` + migration + testar primeiro login~~ —
   **concluído em 14/08/2026**.
2. ~~`napista-sync-catalogo` + migration das tabelas de cache~~ —
   **deployado em 14/08/2026**. Botão "Sincronizar catálogo NaPista" em
   `/admin/portais` (aba NaPista) aciona via `napista-catalogo-trigger`
   (function pequena e dedicada, restrita ao e-mail da Adriana — não mexe
   em `admin-plataformas-api`, que é grande e já em produção). Testado
   manualmente com dados reais de Jeep/Compass — funcionando.
3. ~~Migration `napista_mapeamento_veiculos` + function
   `napista-mapear-veiculo`~~ — **deployado e testado em 14/08/2026** com
   veículo real (Jeep Compass). Resultado: marca e modelo casaram com
   confiança **1.0** (match exato). Versão ficou em `revisao_necessaria`
   (confiança 0,23, abaixo do limiar 0,35) — mas o candidato certo
   (`2.0 SPORT AUTO 4WD`) apareceu em 1º lugar. Motivo: `veiculos.modelo`
   já vem com o texto da versão embutido (ex.: "COMPASS SPORT 2.0 4x2 Flex
   16V Aut."), então o texto de busca fica duplicado/ruidoso ("COMPASS
   SPORT 2.0 4x2 Flex 16V Aut. SPORT 2.0 4x2 Flex 16V Aut.") e dilui o
   score de trigram. **Não é bug** — é o mesmo comportamento do
   `wm-mapear-veiculo` seguindo o desenho correto (preferir revisão manual
   a chute errado). Se isso se repetir muito na prática, o ajuste certo é
   limpar `veiculos.modelo` (separar modelo de versão de verdade) ou
   recalibrar o limiar — não decidido ainda, avaliar com dados reais.
4. ~~Tela de revisão manual~~ — **concluída e testada em 14/08/2026**.
   Diferente do fluxo do Webmotors (modal que só aparece ao salvar um
   veículo específico em `VehicleFormModal.tsx`), essa é uma tela de
   verdade: `NapistaPendenciasReview.tsx` (dentro do `NapistaCatalogPanel`,
   aba NaPista de `/admin/portais`) lista **todas** as pendências de uma
   vez, com botões pra escolher modelo/versão entre os candidatos.
   `napista-confirmar-mapeamento` (function nova) aplica a escolha.
   **Bug real encontrado e corrigido testando ao vivo**: confirmar
   modelo/versão manualmente marcava o veículo como "mapeado" sem nunca
   calcular cor/câmbio/combustível (a etapa nunca tinha rodado, porque
   `napista-mapear-veiculo` para antes de chegar lá quando falha antes) —
   corrigido, a confirmação agora sempre resolve esses 3 campos antes de
   marcar como mapeado.
   **Segundo achado**: cor do NaPista vem no masculino ("Preto", "Branco"),
   `veiculos.cor` vem no feminino ("Preta", "Branca") — quase todo veículo
   falhava o match de cor por causa disso. Adicionado
   `NAPISTA_COR_FALLBACK` em `_shared/napista-client.ts` (mesmo espírito do
   `ML_COLOR_MAP` do Mercado Livre) — tenta match exato primeiro, cai no
   fallback de gênero só se o exato falhar. Testado com Jeep Compass
   "PRETA" → `BLACK` corretamente.
5. ~~Endpoint de fotos~~ — **pesquisado em 14/08/2026**, ver seção "Fotos"
   acima. `POST /seller/{sellerId}/offer/{offerId}/photos/url`, aceita URL
   pública direto (não precisa upload), mas **sobrescreve tudo** a cada
   chamada — sempre mandar a lista completa.
6. ~~`napista-sync`~~ — **deployado e testado ao vivo em 14/08/2026**, os
   três caminhos (criar/atualizar/encerrar) confirmados funcionando de
   verdade no ambiente dev do NaPista (Jeep Compass, offerId real criado:
   `a8d18554-5cc9-45b5-a0b5-332879cb1891`).
   **Correção importante achada no meio do caminho**:
   `estoque_publicacoes.platform` tinha um CHECK restrito a
   `('facebook','instagram','webmotors')` — a suposição anterior de que a
   tabela "já era multi-plataforma" **estava errada** (nunca tinha sido
   testado). Migration `20260814150000` ampliou o CHECK pra incluir
   `'napista'`.
   **Limite de fotos não documentado**: testado empiricamente, o NaPista
   aceita **no máximo 10 fotos por anúncio** — acima disso rejeita a lista
   INTEIRA com HTTP 412 "The maximum number of photos in this Offer has
   been reached!", não só as excedentes. `napista-sync` já corta em 10.
   `PUT .../offer/{offerId}/{offerStatus}` usa `UNPUBLISHED` pra "fechar"
   (reversível, ao contrário de `DELETED`).
7. Enfileiramento automático — adaptar/generalizar o trigger que já existe
   pra Mercado Livre (`trigger_ml_sync_on_veiculo_change`) pra também
   inserir `platform='napista'` na fila quando um veículo muda. **Ainda não
   feito** — hoje o enfileiramento é manual (inserir direto em
   `estoque_publicacoes`).
8. Cron de sincronização periódica (como o do Mercado Livre, 30min) chamando
   `napista-sync`. **Ainda não feito.**
9. Pedir client_id de produção quando for hora de sair do ambiente de
   desenvolvimento (hoje só temos client_id de dev).

## Becos sem saída

- **`GET /catalog/{category}/make` (como a doc descreve) devolve 404.** O
  path real é `GET /catalog/makes/{category}` — plural "makes", categoria
  no fim, não no meio. Conferido direto na API em 14/08/2026 (`curl` com
  token real). Os outros três endpoints de catálogo (modelos, versões,
  atributos) batem exatamente com o que a doc descreve — só o de marcas
  está errado na documentação oficial.
- **Não adianta sincronizar o catálogo inteiro do NaPista de uma vez** —
  são centenas de marcas, cada uma com dezenas de modelos, cada um com
  várias versões (chamadas em cascata). `napista-sync-catalogo` só busca
  o que o estoque atual precisa (`action: 'sync_para_estoque'`), não o
  universo inteiro.
- **Não cachear `napista_versoes` sem separar por ano.** O mesmo `modelId`
  devolve conjuntos de `versionId` bem diferentes dependendo do
  `modelYear` passado na query — sem esse filtro (ou sem guardar o ano
  junto no cache), o mapeamento pode escolher uma versão de outro ano, e o
  `POST /offer` rejeita com "versionId invalid for the informed
  modelYear". Corrigido com a coluna `napista_versoes.model_year` +
  sempre passar `modelYear` na query de versões.
- **`estoque_publicacoes.platform` não era multi-plataforma de verdade** —
  tinha CHECK travado em `('facebook','instagram','webmotors')`. Ampliado
  pra incluir `'napista'` (migration `20260814150000`). Se for reaproveitar
  essa tabela pra outra plataforma nova no futuro, checar essa constraint
  de novo antes de assumir que "só funciona".
- **Limite de 10 fotos por anúncio não está em nenhum lugar da doc** —
  descoberto testando: 10 funciona, 11 já rejeita a lista inteira com 412.
  Se o comportamento mudar no futuro, testar de novo antes de confiar num
  número fixo.
