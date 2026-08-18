# Google Drive (fotos e vídeos de veículo) — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Última atualização: 2026-08-18.

## O que é

Importa fotos e vídeos de veículo direto de uma pasta do Google Drive pra
dentro do sistema (R2 + `veiculos.fotos`/vídeos), sem precisar fazer upload
manual arquivo por arquivo. Cada veículo tem sua própria subpasta dentro de
uma pasta raiz fixa do Drive.

`sync-google-drive` cuida das fotos, `sync-drive-videos` cuida dos vídeos —
duas functions separadas, mesma lógica e mesma pasta raiz, cada uma com seu
próprio controle de progresso.

## Como funciona

```
Google Drive (pasta raiz fixa: 1D6UAaVY7k_Hy1gKVmjQY-sDISchOhwEY)
  └─ subpasta por veículo — nome precisa COMEÇAR com a placa
     (ex.: "ABC1D23 Toyota Corolla" → placa extraída: ABC1D23)
     ├─ sync-google-drive   lê as imagens da subpasta, casa a placa com
     │                      veiculos.placa, baixa cada foto nova, sobe pro
     │                      R2 (bucket via S3Client) e adiciona a URL em
     │                      veiculos.fotos (dedup automático)
     └─ sync-drive-videos   mesma lógica, pra vídeo — grava em logs_integracao
                             além de atualizar o veículo
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
- O offset de cada function fica salvo em `sync_control`
  (`sync_key = 'drive_offset'` pras fotos, `'drive_video_offset'` pros
  vídeos) — se a sincronização em lote for interrompida, o próximo "play"
  continua de onde parou, não do zero.

## Fatos confirmados

| Fato | Como se sabe |
|---|---|
| A pasta raiz do Drive é um ID **fixo no código** (`ROOT_FOLDER_ID`), igual nas duas functions — trocar de pasta exige editar e reimplantar o código, não é configurável pela tela | leitura de `sync-google-drive/index.ts` e `sync-drive-videos/index.ts`, linha 7-8 (mesmo ID nas duas) |
| A placa é extraída da **primeira palavra do nome da subpasta** (`extractPlate`) — se a subpasta não começar com algo que pareça placa (mín. 4 caracteres alfanuméricos), a pasta inteira é ignorada, sem erro visível pra quem está sincronizando em lote | leitura de `extractPlate()`, linha 31-35 |
| Cada chamada de "uma placa só" refaz a listagem de **todas** as subpastas da raiz até achar a que bate com a placa pedida — não é um lookup direto, é busca linear | leitura do bloco `PLACA-SPECIFIC SYNC`, linha 323-333 |
| Download/listagem do Drive tem retry automático (até 3 tentativas, espera crescente) — falha de rede pontual não quebra a sincronização, só atrasa | leitura de `downloadWithRetry`/`listWithRetry`, `MAX_RETRIES = 3` |
| Fotos já existentes em `veiculos.fotos` são deduplicadas antes de comparar com o Drive — sincronizar de novo não duplica foto já importada | leitura do bloco `dedupUrls(vehicle.fotos)` |

## Becos sem saída — não repetir

- Não testei uma sincronização em lote completa nesta sessão (só li o
  código) — o comportamento de borda (offset além do total de pastas,
  pasta raiz vazia) não foi observado ao vivo.

## Em aberto

- Não confirmado se as 3 variáveis (`DRIVE_CLIENT_EMAIL`,
  `DRIVE_PRIVATE_KEY`, `DRIVE_PROJECT_ID`) estão configuradas hoje nos
  Secrets — não investigado nesta sessão (fora do escopo pedido, que foi só
  documentar).
- Nenhum log de auditoria pra fotos (`sync-google-drive` só atualiza
  `veiculos`/`sync_control`) — se uma foto errada for importada, não tem
  como saber de qual sincronização ela veio, diferente dos vídeos que
  gravam em `logs_integracao`.
