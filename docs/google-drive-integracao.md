# Google Drive (fotos e vídeos de veículo) — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Última atualização: 2026-09-04.

## O que é

Importa fotos e vídeos de veículo direto de uma pasta do Google Drive pra
dentro do sistema (R2 + `veiculos.fotos`/vídeos), sem precisar fazer upload
manual arquivo por arquivo. Cada veículo tem sua própria subpasta dentro de
uma pasta raiz fixa do Drive — **fotos e vídeos ficam em pastas raiz
diferentes** (ver tabela de IDs abaixo), não confundir uma com a outra.

`sync-google-drive` cuida das fotos. Vídeo tem uma arquitetura diferente
desde 04/09/2026 — ver seção própria abaixo.

## Fotos — como funciona

```
Google Drive (pasta raiz de FOTOS: 1D6UAaVY7k_Hy1gKVmjQY-sDISchOhwEY)
  └─ subpasta por veículo — nome precisa COMEÇAR com a placa
     (ex.: "ABC1D23 Toyota Corolla" → placa extraída: ABC1D23)
     └─ sync-google-drive   lê as imagens da subpasta, casa a placa com
                            veiculos.placa, baixa cada foto nova, sobe pro
                            R2 (bucket via S3Client) e adiciona a URL em
                            veiculos.fotos (dedup automático)
```

**Autenticação**: conta de serviço do Google (`DRIVE_CLIENT_EMAIL` +
`DRIVE_PRIVATE_KEY` + `DRIVE_PROJECT_ID`), não OAuth de usuário — não expira
por sessão, mas depende dessas 3 variáveis estarem certas nos Secrets do
Supabase.

**Como é acionado**: sempre manual, nunca por cron.
- **Uma placa só**: botão "Sync Drive" na tela de editar veículo
  (`VehicleFormModal.tsx`) — manda `{ placa }` no corpo da chamada, processa
  só aquela subpasta na hora.
- **Em lote**: hook `useRecursiveSync` — chama a function repetidamente com
  `{ offset, limit }`, avançando o offset a cada resposta, até `remaining
  <= 0` ou a pessoa cancelar. Existe porque uma Edge Function tem tempo
  limite de execução — processar TODAS as subpastas numa chamada só
  estouraria o tempo, então cada chamada processa só `BATCH_SIZE = 1`
  subpasta e devolve quanto falta.
- O offset fica salvo em `sync_control` (`sync_key = 'drive_offset'`) — se a
  sincronização em lote for interrompida, o próximo "play" continua de onde
  parou, não do zero.

## Vídeo — arquitetura nova (desde 04/09/2026)

**Causa raiz do problema antigo (vídeo grande travava sem erro nenhum):** a
Supabase Edge Function só tem **2 segundos de tempo de CPU** por chamada
(https://supabase.com/docs/guides/functions/limits). O SDK da AWS usado pra
subir pro R2 calcula checksum do arquivo inteiro — isso é processamento de
CPU de verdade, e num vídeo de ~99MB estourava esse limite. A function
morria no meio, sem conseguir gravar log nenhum (por isso nunca aparecia
nada em `logs_integracao`).

**Solução:** o download do Drive + upload pro R2 saiu da Edge Function e foi
pra um **Cloudflare Worker** (`cloudflare/sync-drive-videos-worker/`), que
tem 5 minutos de CPU e sobe pro R2 via binding nativo (`env.BUCKET.put()`,
sem SDK, sem checksum pesado). A `sync-drive-videos` (Edge Function) virou
só uma porta de entrada fina: confere quem chamou e repassa pro Worker com
um segredo compartilhado (`SYNC_WORKER_SECRET`) — o contrato com o front
(`supabase.functions.invoke('sync-drive-videos', {...})`) não mudou nada.

```
VehicleFormModal / hook → supabase.functions.invoke('sync-drive-videos')
  └─ Edge Function (só autentica e repassa, header X-Sync-Secret)
     └─ Worker sync-drive-videos-worker (Cloudflare)
        ├─ pasta raiz de VÍDEOS: 1QKGIaPvoZLv-ifhxlaqzrirH38HAMRTo (≠ fotos!)
        ├─ getAccessToken/listDriveItems: cópia local de
        │  supabase/functions/_shared/google-drive.ts — corrigir nos DOIS
        │  lugares se mexer em auth/listagem do Drive
        └─ env.BUCKET.put(key, stream) — binding R2 nativo, streaming direto
```

**Secrets do Worker** (`wrangler secret put`, nunca ficam no `wrangler.toml`):
`DRIVE_CLIENT_EMAIL`, `DRIVE_PRIVATE_KEY`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `SYNC_WORKER_SECRET`. Esse último também existe
como secret da Edge Function `sync-drive-videos` no Supabase (mesmo valor
nos dois lados, gerado uma vez e nunca reaparece em lugar nenhum).

**Testado ao vivo em 04/09/2026:** 15 de 15 pastas de vídeo válidas
sincronizaram com sucesso (incluindo o SYR9D60, vídeo de 104.423.176
bytes/~99.6MB que travava antes, e o TFF8I00, que só sincronizou depois de
renomear a pasta no Drive) — 0 erros em `logs_integracao`. Duas pastas
ficam de fora de propósito: "HR-V EXL 2020 e HR-V EX 2017" (mistura 2
veículos, nome não extrai placa válida) e "Video CONSIGNAÇÃO" (não é
veículo do estoque).

## Botão separado de vídeo (03/10/2026)

Pedido da Adriana: o vídeo não vai mais junto do "Sync Drive". No cadastro do veículo (`VehicleFormModal.tsx`):
**"Sync Drive"** (bloco de fotos) = só `sync-google-drive`; **"Sincronizar vídeo do Drive"** (bloco "Vídeos") =
só `sync-drive-videos` (`handleSyncDriveVideos`), com mensagens próprias: "Nenhuma pasta de vídeo encontrada"
(404 do Worker), "Nenhum vídeo novo encontrado" e erro real em vermelho. Vídeo grande pode levar minutos.
Artigo de ajuda atualizado (`20261003124920_*`). **Caso SIQ5H93** (Haval H6 PHEV): o vídeo `VID_20260706_*.mp4`
(135 MB, MP4 válido, toca no endereço público) já estava em `veiculos.videos` desde 04/09 — a sincronização de
03/10 não achou nada novo; falta consultar o conteúdo da pasta (Worker novo com `detalhePastas`, ver abaixo).
As duas funções usam **contas Google diferentes**: a Edge Function vê só a raiz de fotos (0 pastas na de vídeos)
e o Worker vê só a de vídeos (0 na de fotos).

**CONCLUSÃO do caso (03/10/2026, Worker com `detalhePastas` no ar, versão `bfe15732`):** a pasta
`SIQ5H93 HAVAL H6 PHEV 2024` tem exatamente 1 vídeo (`VID_20260706_112209_657_bsl.mp4`), já importado, sem outros
arquivos nem subpastas. Percorri as **17 pastas** da raiz de vídeos (modo `offset` 0..16): **0 vídeos novos em todas** —
tudo que está na raiz de vídeos já está em `veiculos.videos`. **A sincronização de vídeo não tem defeito.** Veículo sem
vídeo no cadastro = não há pasta dele em "02-Videos de Veiculos" (20 disponíveis sem pasta no momento do teste).

## Vídeo dentro da pasta de FOTOS (achado 03/10/2026)

Relato da Adriana: "os vídeos não estão sendo carregados durante a sincronização de fotos". Diagnóstico:

- **Pipeline de vídeo saudável:** `sync-drive-videos` -> Worker respondeu 200 em 1,6 s (placa `GTN5D81`).
  A raiz de VÍDEOS só tem 17 pastas (todas já importadas, `remaining: 16`).
- **As 20 placas disponíveis sem vídeo no banco devolveram "Pasta não encontrada"** na raiz de vídeos — ou seja,
  não têm pasta lá. Hipótese (não confirmada pelo conteúdo do Drive): os vídeos novos estão sendo colocados
  **dentro da pasta de fotos do veículo**.
- **Causa no código:** `sync-google-drive` só aceita `mimeType image/*` (`allImages = files.filter(...)`) e o
  Worker de vídeo só lia a raiz de vídeos. Vídeo na pasta de fotos era ignorado pelos dois.
- **Ajuste (no repositório, Worker AINDA NÃO PUBLICADO até esta anotação):** ao sincronizar uma PLACA, o Worker
  procura a pasta nas DUAS raízes (vídeos e fotos), aceita `.mp4/.mov/.m4v/.webm`, e não reimporta o vídeo
  que já existe (compara URL e também o nome do arquivo, porque o nome da pasta entra na chave do R2). O modo em
  lote (offset) continua só na raiz de vídeos. O botão "Sync Drive" agora **avisa** quando o vídeo falha por outro
  motivo que não "pasta não encontrada" (antes sumia em silêncio e a tela dizia "nenhum vídeo novo").
- **Deploy do Worker é manual** (nunca Git integration): `npx wrangler deploy --config
  "C:/Projeto/Revenda Carro e Cia/carro-e-cia-ve-culos-2fqheuud8/cloudflare/sync-drive-videos-worker/wrangler.toml"`.
  O Claude Code bloqueou esse comando por permissão em 03/10/2026 — a Adriana roda com `! ` na frente.
- **RESULTADO DOS TESTES (03/10/2026, Worker novo publicado 2x):**
  - O Worker enxerga **17 pastas na raiz de vídeos e 0 na raiz de FOTOS** (`pastasRaizFotos: 0`), enquanto o
    `sync-google-drive` (Edge Function) acha a pasta de fotos normalmente (ex.: `RNY4F77`). Mesmo escopo
    (`drive.readonly`) nos dois => a **conta de serviço do Worker NÃO tem acesso à pasta de fotos** (Drive devolve
    lista vazia, não erro, quando a pasta não está compartilhada). Pra o Worker ler a raiz de fotos: compartilhar
    `1D6UAaVY7k_Hy1gKVmjQY-sDISchOhwEY` (Leitor) com o e-mail da conta de serviço do Worker (secret
    `DRIVE_CLIENT_EMAIL` do Worker; o e-mail aparece na lista de compartilhamento da pasta de vídeos), OU passar o
    token da Edge Function ao Worker (não implementado).
  - O `sync-google-drive` agora devolve `videosNaPasta` (só informa, não baixa). **6 veículos testados
    (RNY4F77, PQE7D92, OXK8I81, PUQ3A75, QUW5H72, TCT5A21): 0 vídeos na pasta de fotos.** A hipótese "vídeo dentro da
    pasta de fotos" NÃO se confirmou nesses 6. As 20 disponíveis sem vídeo no banco não têm pasta na raiz de vídeos.
    **Falta saber de qual veículo a Adriana notou a falta e onde o arquivo está no Drive** (pode estar em subpasta
    dentro da pasta do veículo — `listDriveItems(..., false)` ignora subpastas).
  - **Defeito antigo achado de passagem:** `sync-google-drive` da placa `PQE7D92` enviou 12 fotos ao R2 em 78 s mas
    `veiculos.fotos` ficou com 20 (sem mudança, `updated_at` igual) — provável limite de 20 fotos
    (`trigger_limite_fotos_veiculo`) barrando o update depois do upload: arquivos órfãos no R2 e nenhum aviso.

## Fatos confirmados

| Fato | Como se sabe |
|---|---|
| A pasta raiz de FOTOS (`1D6UAaVY7k_Hy1gKVmjQY-sDISchOhwEY`) e a de VÍDEOS (`1QKGIaPvoZLv-ifhxlaqzrirH38HAMRTo`) são **diferentes** — não mexer no ID de `sync-google-drive/index.ts` (fotos, funcionando) ao ajustar vídeo | confirmado pela Adriana em 03/09/2026, corrigido no Worker |
| A placa é extraída da **primeira palavra do nome da subpasta** (`extractPlate`) — se a subpasta não começar com algo que pareça placa (mín. 4 caracteres alfanuméricos), a pasta inteira é ignorada, sem erro visível | leitura de `extractPlate()` |
| Download/listagem do Drive nas fotos tem retry automático (até 3 tentativas, espera crescente) — falha de rede pontual não quebra a sincronização, só atrasa | leitura de `downloadWithRetry`/`listWithRetry`, `MAX_RETRIES = 3` em `sync-google-drive` |
| Fotos já existentes em `veiculos.fotos` são deduplicadas antes de comparar com o Drive — sincronizar de novo não duplica foto já importada | leitura do bloco `dedupUrls(vehicle.fotos)` |
| Supabase Edge Function: só 2s de CPU por chamada (não conta espera de rede); Cloudflare Worker pago: 5 min de CPU — essa diferença é a causa raiz do travamento de vídeo grande | doc oficial Supabase e Cloudflare, 03/09/2026 |
| O nome da pasta no Drive pode não bater com a placa real no cadastro por erro de digitação (ex.: "TFF8IOO" com letra O na pasta, placa real "TFF8I00" com zero) — nesse caso o sync acha a pasta mas não acha o veículo, e falha silenciosamente (sem log de erro) | achado real, 04/09/2026 — corrigir renomeando a pasta no Drive |

## Becos sem saída — não repetir

- Cloudflare Stream (upload por URL) **não resolve** o timeout de vídeo
  grande: o campo `url` da API de import só aceita link público simples, sem
  jeito de mandar header de autenticação — não dá pra apontar direto pro
  link do Drive (que exige `Authorization: Bearer`). Verificado na
  documentação oficial (`developers.cloudflare.com/stream/uploading-videos/upload-via-link/`
  e referência da API `POST /accounts/{id}/stream/copy`), 03/09/2026.
- Rodar `wrangler deploy` de dentro de uma subpasta sem `--config` explícito
  é arriscado neste repositório: há um `wrangler.jsonc` na raiz (Worker do
  site de produção) e o `cd` pra subpasta não necessariamente "gruda" entre
  comandos nesta ferramenta de terminal — já aconteceu de um `wrangler
  deploy` acabar mirando o Worker errado. **Sempre usar `--config
  "<caminho completo>/wrangler.toml"` explícito.**
- **"Workers Builds" (Git integration da Cloudflare) NÃO deve ser usado
  neste Worker — incidente real em 04/09/2026.** A Adriana conectou o
  repositório no painel; o build automático disparado pelo push pegou o
  diretório raiz errado (o `wrangler.jsonc` do site, não o
  `wrangler.toml` do Worker de vídeo) e **sobrescreveu o código do Worker
  de vídeo com o build do site, além de apagar os 5 secrets** (sem aviso,
  sem log nosso). Sintoma: `POST` no Worker passou a devolver `405` com
  corpo vazio, e os headers da resposta batiam com o CSP do site, não do
  Worker. Corrigido restaurando o código via `wrangler deploy --config` e
  recriando os 5 secrets; a Adriana desconectou o Git desse Worker no
  painel (Settings → Build → Disconnect) em seguida. **Não reconectar** —
  o deploy continua sendo manual via `wrangler deploy --config`.

## Em aberto

- Nenhum log de auditoria pra fotos (`sync-google-drive` só atualiza
  `veiculos`/`sync_control`) — se uma foto errada for importada, não tem
  como saber de qual sincronização ela veio, diferente dos vídeos que
  gravam em `logs_integracao`.
