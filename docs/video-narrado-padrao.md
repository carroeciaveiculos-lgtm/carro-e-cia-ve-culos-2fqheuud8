# Vídeo narrado de veículo — padrão

Criado em 10/11/2026 a pedido da Adriana. Todo vídeo de veículo com fotos e voz segue este padrão.
O vídeo serve para **post orgânico** (Facebook e Instagram) e para **anúncio pago** (Meta Ads).

## Estado das etapas

| Etapa | O que é | Estado (10/11/2026) |
|---|---|---|
| 1 | Roteiro (`src/lib/roteiro-video.ts`) + função `narrar-veiculo` em **modo de ensaio** (áudio mudo, custo zero) | Pronta, testada localmente, aguardando merge |
| 2 | Voz real da ElevenLabs: Voice ID confirmado, cache de áudio por texto, teto diário de caracteres. **Migração de banco própria, pedido separado** | Não feita |
| 3 | Botão "Gerar vídeo narrado" no cadastro (montagem no navegador, 9:16 e 4:5) | Não feita |
| 4 | Envio para aprovação nas redes e uso como material de anúncio | Não feita |

## Prompt padrão do roteiro

O texto sai de `montarRoteiro()` (sem IA, a partir do cadastro) e a pessoa revisa antes de gerar a voz.
Se um dia a IA escrever o roteiro, usar este mesmo prompt:

```
Você escreve a narração de um vídeo curto de um veículo da Carro e Cia (Uberlândia).
Use SOMENTE os dados do cadastro abaixo. Se um dado não estiver na lista, não cite.

DADOS: marca, modelo, versão, ano, km, câmbio, combustível, cor, diferenciais do cadastro.
FORMATO: 9:16 → 50 a 65 palavras | 4:5 → 75 a 100 palavras.

ESTRUTURA:
1. Gancho (1 frase): modelo + ano + o que ele tem de melhor.
2. Destaque (1 a 2 frases): 2 ou 3 diferenciais reais do cadastro.
3. Dados (1 frase): km, câmbio e combustível.
4. Fechamento (fixo): "Chame a gente no WhatsApp e marque uma visita na loja."

REGRAS:
- Português do Brasil, tom próximo e confiante, frases curtas.
- NÃO fale preço, parcela, entrada nem número de telefone.
- Números por extenso falado: "cento e vinte mil quilômetros". Cilindrada: "dois ponto zero".
- Sem siglas soltas: diga "automático", "turbo diesel".
- Proibido: "abaixo da FIPE" (só se o cadastro comprovar 5% ou mais), "único dono", "sem detalhes",
  garantia ou financiamento que não estejam no cadastro.
- Sem emoji, sem hashtag.
SAÍDA: apenas o texto falado, sem títulos nem marcações.
```

Decisões da Adriana (10/11/2026): o **preço não é falado**; aparece na tela final do vídeo e na descrição
do post/anúncio. O fecho é o convite do WhatsApp **sem dizer o número**. Tom "próximo e confiante" aprovado.

## Padrão do vídeo

| Item | Reels/Stories 9:16 | Feed e anúncio 4:5 |
|---|---|---|
| Duração | 20 a 28 s | 30 a 42 s |
| Fotos | 6 a 8, as 4 do criativo primeiro | 8 a 10 |
| Tempo por foto | 3 a 3,5 s com zoom suave | 3,5 a 4 s |
| Abertura e fim | Logo e selo de cautelar; tela final com preço, WhatsApp e aviso | igual |
| Margens | texto longe das bordas (regra Meta Ads) | igual |

Tela final: preço de venda **do cadastro** (nunca digitado), logo, selo de cautelar e convite do WhatsApp.
Aviso de preço e disponibilidade: frase curta na tela, sem data; texto completo na legenda de cada rede.

## Onde ficam os arquivos (R2, nunca Supabase Storage)

```
criativos/<placa>/
  imagens/   feed 4x5, stories 9x16, quadrado 1x1   (hoje ainda na raiz da pasta da placa)
  videos/    <data>_reels_9x16.mp4  e  <data>_feed_4x5.mp4
  audios/    <data>_narracao.mp3
```

- Cada vídeo ganha uma linha em `veiculo_criativos` (tipo, formato, origem `video_narrado`, ligação ao áudio e ao
  roteiro, marcador "usado em: orgânico / anúncio"). **Isso é migração de banco: Etapa 2, pedido separado.**
- Refazer o vídeo cria um conjunto novo e mantém o anterior (nada publicado se perde).
- Nada fora da pasta da placa. Venda do veículo = arquivar a pasta inteira.

## Testar SEM gastar crédito (regra da Adriana)

1. Roteiro: `montarRoteiro` e `validarRoteiro` são funções puras (palavras, frases proibidas, números por extenso).
2. Voz de teste: voz do navegador (pt-BR) ou o áudio mudo da função em modo de ensaio, só para tempo e sincronia.
3. Vídeo: montagem no Chrome (como nas simulações de impressão) com o áudio de teste; conferir duração, formato e margens.
4. A função `narrar-veiculo` nasce em modo de ensaio. O modo real só liga na Etapa 2.
5. Uso real: mostrar a contagem de caracteres antes de gerar, guardar o áudio pelo texto (mesmo texto nunca é cobrado
   duas vezes) e ter teto diário de caracteres. **Uma chamada real por vídeo**, depois do "pode gerar" da Adriana.

Como validar o áudio de ensaio: `ffprobe ensaio.wav` deve mostrar a duração estimada (palavras ÷ 2,4 por segundo).

## ElevenLabs — fatos verificados (10/11/2026)

- O projeto **já usa** ElevenLabs na Clara: `supabase/functions/_shared/elevenlabs-client.ts` lê os secrets
  `ELEVENLABS_API_KEY` e `ELEVENLABS_VOICE_ID` (voz "clonada pela Adriana", 26/08/2026). Provavelmente são estes
  os secrets a reutilizar; **conferir antes da Etapa 2** (não dá para ler o valor, só confirmar com a Adriana).
- O CLI da ElevenLabs (`onboard init`) gravou uma chave local em `.env.local` (ignorado pelo Git). A conta que ele
  autorizou **não tinha vozes clonadas** (só as 21 padrão); a conta pode ser diferente da que tem a voz.
- Chave nunca no front (`VITE_*` é público) e nunca no chat. Em produção entra como secret do Supabase, inserida pela
  Adriana no painel (Edge Functions → Secrets).

## Becos sem saída e armadilhas

- **Diferenciais do cadastro são genéricos**: apareceu "Tração 4x4" em Audi A3, Kia Sportage e Fit. O roteiro só cita
  itens de uma lista segura (`DIFERENCIAIS_FALAVEIS`) e nunca 4x4.
- A cilindrada vem do banco como número (`2`, não `2.0`): o roteiro fala "dois ponto zero".
- No Git Bash, `tar -xzf C:\...` confunde `C:` com host remoto; extrair arquivos pelo PowerShell.
- Não há Deno nesta máquina: a função foi testada com `Deno.serve` simulado em Node e o WAV validado com `ffprobe`.
