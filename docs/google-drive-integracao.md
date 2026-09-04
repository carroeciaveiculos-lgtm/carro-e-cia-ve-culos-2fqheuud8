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
