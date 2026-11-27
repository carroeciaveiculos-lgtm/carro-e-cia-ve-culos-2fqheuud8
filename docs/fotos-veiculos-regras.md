# Fotos de veículos — regras de dimensão e tratamento

Criado em 27/11/2026, a pedido da Adriana. Fonte: leitura do código em 26–27/11/2026 (arquivos citados em cada item).
Ao mudar qualquer regra abaixo, atualizar este documento na mesma alteração.

## 1. Padrão de captura

- **4:3, deitada (paisagem), 20 fotos por carro**, na ordem do roteiro (`01_capa.jpg`, `02_frente_angulo.jpg`…).
  Origem: roteiro padrão de fotografia de 08/2026 (commit `2ecaeeb`, 08/08/2026).
- A 1ª foto da lista (`veiculos.fotos[0]`) é a **capa**: aparece no card do site, no Mercado Livre, Webmotors e NaPista, e é
  a única mantida quando a limpeza do R2 roda em carro vendido/devolvido.

## 2. Como as fotos entram

| Entrada | Tratamento | Onde |
|---|---|---|
| Google Drive (`sync-google-drive`) | **Nenhum**: vai para o R2 no tamanho e formato originais. Pasta `media/PLACA_-_MODELO/`. A sync lista só as pastas no 1º nível da pasta principal do Drive. | `supabase/functions/sync-google-drive/index.ts` |
| Botão "Fotos" do cadastro, envio em lote, Avaliação | **Só reduz, nunca corta** (desde 27/11/2026): lado maior com no máximo 1.920 px, proporção original, JPEG qualidade 0,9. Foto menor que isso segue como veio. Pasta `media/<modelo>_<placa>/`. | `src/lib/image-resize.ts` |
| Vídeo | Botão próprio, sem redimensionar, vai para `veiculos.videos` (nunca para `fotos`). | `VehicleFormModal.tsx` |

Antes de 27/11/2026 o envio manual forçava **1200×1540 em pé, cortando**: uma foto 4:3 deitada perdia ~40% da largura
(cálculo, não medido em foto real). Fotos enviadas antes dessa data continuam cortadas.

## 3. Como o site mostra (página pública `/estoque`, home, página do veículo)

- **Card (estoque e home):** quadro **4:3**, todos do mesmo tamanho; só a capa, sem carrossel. A foto **preenche** o quadro
  (`object-cover`): o que sobra é cortado, nunca há faixa cinza.
  - Foto deitada: ponto de corte um pouco abaixo do centro (`object-[center_65%]`).
  - Foto em pé ou quadrada (proporção < 1,15): corte ancorado no topo, para não perder o teto
    (`src/lib/image-cover-position.ts`).
  - Hover: a foto cresce 5% dentro do quadro (`overflow-hidden`), sem invadir o texto.
  - `object-contain` foi testado em 17/08/2026 e **revertido no mesmo dia** (cards de tamanhos diferentes; commit `a5466f6`).
- **Página do veículo:** foto principal 4:3 (mesmas regras de corte); miniaturas 16:9; vídeos em bloco próprio 16:9.

## 4. Peso das imagens (entrega)

Cloudflare Image Resizing (`/cdn-cgi/image/width=…,quality=75,format=auto/`), aplicado na entrega; o original no R2 não muda
(`src/lib/image-utils.ts`, `getImageUrl`):

| Onde | Largura |
|---|---|
| Card do estoque e da home | 400 px |
| Foto principal da página do veículo | 800 px |
| Miniaturas | 200 px |

A 1ª foto da lista carrega com prioridade (`fetchPriority="high"`); as demais só ao aparecer na tela (`loading="lazy"`).

## 5. Portais

- **Webmotors:** cada foto é baixada pelo CDN em 1280 px, qualidade 80, JPEG (limite deles: 500 KB por foto; erro `21|9` acima
  disso) e enviada em base64 (`IncluirFoto`), uma por chamada, depois de criado o anúncio (`wm-sync`). O resultado desse envio
  **não é gravado**; se um anúncio novo ficar sem fotos, marcar a publicação como `pending_update`: na atualização o `wm-sync`
  confere com `ObterFotosCarro` e, se houver zero fotos, envia todas (caso Hilux SSF5A83, 27/11/2026).
- **Mercado Livre:** recebe as URLs originais (`pictures: [{ source }]`, `_shared/ml-client.ts`).
- **NaPista:** no máximo 10 fotos por anúncio (limite real, não documentado); o envio sobrescreve a lista inteira (`napista-sync`).

## 6. Ciclo de vida (limpeza do R2)

30 dias depois de vendido ou devolvido, a rotina `r2-limpeza` (03h30) move fotos e vídeos para `lixeira/AAAA-MM-DD/`, **mantendo
a capa**; carro excluído perde todas, também após 30 dias. A lixeira expira em 30 dias (regra `lixeira-30-dias` no bucket). Detalhe:
artigo "Limpeza automática das fotos de veículos vendidos, devolvidos ou excluídos" na Central de Ajuda e `MEMORY_WORK.MD` (26/11/2026).

## 7. Becos sem saída

- Nomes de arquivo com parênteses (`IMG(1).jpg`) quebram expressões que procuram URL e param em `)` (achado 26/11/2026).
- `IncluirFotoUrl` da Webmotors sempre devolveu `21|10`; usar `IncluirFoto` com bytes (13/08/2026).
