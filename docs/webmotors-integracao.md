# Webmotors — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Última atualização: 2026-08-27.

## Protocolo de verificação segura (ler antes de qualquer ação real)

Destilado depois de uma sessão (27/08/2026) com vários erros reais em
sequência — todos com a mesma raiz: tratar sinal indireto como fonte de
verdade.

**Onde olhar:**
1. **O Cockpit ao vivo** (`cockpit.com.br/inventory`, sessão logada da
   Adriana, via browser) pra qualquer "está publicado/ativo agora?" — única
   fonte que não falhou numa sessão inteira de tentativas.
2. **A placa exata** antes de agir sobre qualquer veículo citado por
   marca/modelo — nunca presumir qual é "o Haval" ou "o BMW" quando existe
   mais de um na conta (achado real: 2 Haval H6, 2 BMW 320iA).
3. **`sync_log`** pra histórico de tentativas — não pra status atual.
4. **A linha específica (`id`) em `estoque_publicacoes`** antes de qualquer
   `UPDATE` — `SELECT` primeiro, sempre, pra ver se existe mais de uma linha
   pro mesmo veículo+plataforma (bug recorrente: linhas duplicadas de datas
   diferentes, nunca limpas).

**Onde NÃO confiar:**
1. **`ObterModalidade`, `ObterEstoqueAtual` e `ObterFotosCarro` como prova
   final de status "agora"** — nenhuma tem campo de status documentado
   (confirmado auditando o manual oficial), e as três já mostraram
   atraso real depois de ação manual no painel. Servem só como pista.
2. **Mexer em `publicado_webmotors`/`publicado_napista` como atalho pra
   corrigir um status errado.** Essas flags disparam gatilhos automáticos
   (`trigger_wm_sync_on_veiculo_change`) — já quase causou uma exclusão real
   e irreversível de um anúncio ativo. Corrigir sempre direto em
   `estoque_publicacoes`.
3. **Memória de conversa como identificador de veículo.** Só a placa
   identifica — descrição por marca/modelo não é suficiente nesta conta.

## O caminho de um veículo até o anúncio

```
veiculos (CRM)
  └─ wm-mapear-veiculo      traduz marca/modelo/versão/cor/câmbio/combustível
     │                      para os códigos da Webmotors
     ├─ confiança ≥ 0,35 → status "mapeado"
     └─ abaixo           → status "revisao_necessaria" + candidatos
                             └─ wm-confirmar-mapeamento  (escolha humana)
  └─ estoque_publicacoes    FILA — precisa de um registro aqui!
     │                      platform='webmotors', status em
     │                      agendado / pending_create / pending_update /
     │                      pending_close
     └─ wm-sync             monta o XML e chama IncluirCarro
```

**Estar `mapeado` não publica nada.** `wm-sync` não lê
`wm_mapeamento_veiculos` — ele lê a fila `estoque_publicacoes` e só processa o
que estiver lá com status pendente. Sem registro na fila a resposta é
`{"success":true,"processed":0}`, que parece sucesso e não é. Descoberto em
10/08/2026 depois de mapear 7 veículos e não publicar nenhum.

Enfileirar um veículo (o `status` já tem default `'agendado'`):

```sql
insert into estoque_publicacoes (veiculo_id, platform)
values ('<uuid do veiculo>', 'webmotors');
```

Tabelas: `wm_mapeamento_veiculos` (um registro por veículo),
`wm_marcas` / `wm_modelos` / `wm_versoes` / `wm_cores` / `wm_cambios` /
`wm_combustiveis` (catálogo espelhado da Webmotors).

Toda chamada SOAP passa por `_shared/wm-soap.ts` → proxy de IP fixo
(`WM_PROXY_URL`) → Webmotors. O proxy existe porque a Webmotors libera por IP.

## Fatos confirmados

| Fato | Como se sabe |
|---|---|
| `CodigoRetorno 500` = **sucesso** | tabela oficial + resposta real |
| `22\|78` = **"PrecoReal (De) deve ser maior que PrecoVenda (Por)"**, e **bloqueia mesmo** (`CodigoAnuncio` volta `0`, nenhum anúncio é criado) | suporte Webmotors (Gabriel Moreira da Silva), 10/08/2026; reconfirmado ao vivo 12/08/2026 na Honda WR-V com De=Por |
| A maioria dos outros códigos de retorno da Webmotors são **avisos**, não bloqueios — mas isso ainda não está mapeado código a código aqui, só o `22\|78` está confirmado como bloqueio | Adriana, 12/08/2026 |
| `ObterVersao` exige `pDataInicioAtualizacao` + `pDataFimAtualizacao` além do `pCodigoModelo` | suporte Webmotors, 08/2026; validado ao vivo 10/08/2026 |
| O item de versão vem como `<Versao>`, **não** `<VersaoWM>` | XML real 10/08/2026: 21 × `<Versao>`, 0 × `<VersaoWM>` |
| O item de modelo vem como `<ModeloWM>` | `wm_modelos` populada (1854 linhas) com esse parser |
| `CodigoModalidade` contratado = `2943` ("Anúncio Básico"), único | `ObterModalidade`, 07/08/2026 |
| A homologação tem **janela de horário** | 503 nginx no sábado 08/08 20h30; SOAP normal na sexta 07/08 e na segunda 10/08 17h |
| Endpoint de produção: `https://integracao.webmotors.com.br/wsEstoqueRevendedorWebMotors.asmx` (sem `/IntegracaoRevendedor/`) | collection Postman oficial |
| Credenciais atuais são as **genéricas de homologação** | `homologacaows@webmotors.com.br`, CNPJ `12.319.744/0001-52` — não o CNPJ da loja |

**ATENÇÃO — estado em 12/08/2026, tarde: Adriana trocou os secrets
(`WM_EMAIL`/`WM_SENHA`/`WM_CNPJ`) pelos dados de produção.** Testei logo
depois (`wm-catalog-fetch`) e a autenticação falhou: `401`, `CodigoRetorno
400` — código nunca visto antes, não mapeado. Adriana diz que já deveria
estar funcionando e mandou e-mail pro Gabriel perguntando. **Não testar mais
nada contra a Webmotors até essa resposta** — a partir daqui qualquer chamada
bem-sucedida bate em produção de verdade (anúncio público real), não mais
homologação. Reconferir `CodigoRetorno 400` antes de continuar.

## Becos sem saída — não repetir

- **Trocar nomes de campo de cor para caçar o `22\|78`.** Foram 4 rodadas
  (`CorExterna` vs `DescricaoCor`, `PrecoRevenda` vs `PrecoReal`, reordenação de
  tags). A causa nunca foi cor: é a regra de preço acima. A decomposição de
  `22|78` por posição ("Cor" + "Preço de Venda") **é enganosa**.
- **Seguir a collection Postman oficial à risca.** Reproduzir o exemplo dela
  (`CodigoCor`/`DescricaoCor`, `PrecoReal`, ordem antiga) trouxe de volta o
  `22|78`. Nem ela nem o manual HTML batem com o comportamento real.
- **Assumir que o esquema de entrada do `IncluirCarro` é o do manual.** O manual
  documenta o `AnuncioWM` de **saída** (`ObterEstoqueAtual`). Mesmo nome, campos
  diferentes por direção.
- **Acrescentar `DataInclusao`/`DataUltimaAlteracao`/`Opcional`/`CodigoRetorno`
  vazios no fim do XML.** Testado isolado: não muda nada.
- **Confiar na tabela `CODIGO_RETORNO_43`** de `wm-soap.ts`. Foi reconciliada por
  observação, não por documento. Use como pista; a verdade está em
  `wm_mapeamento_veiculos.ultima_resposta_xml`.
- **Diagnosticar 503 como credencial ou payload.** Credencial recusada volta XML
  com código; 503 volta **página nginx**, que é camada de transporte. Se o
  `catalogo: "cores"` (sem parâmetro nenhum) falhar igual, a quebra é no
  `autenticar`, antes do método.
- **Mudar `publicado_webmotors` pra `false` num veículo que tem anúncio real
  (mesmo travado) sem checar o que o trigger faz com isso.** Achado real
  27/08/2026: corrigir um falso positivo do HR-V (marcando
  `publicado_webmotors=false`) fez o `trigger_wm_sync_on_veiculo_change`
  criar sozinho uma linha `pending_close` mirando o anúncio REAL
  (`73668233`, fotos confirmadas) — se um `wm-sync` rodasse antes de eu
  perceber, teria chamado `ExcluirCarro` nesse anúncio de verdade, **sem
  volta**. Antes de mexer nessa flag em qualquer veículo com anúncio
  existente (mesmo travado/`error`), checar se virou uma linha
  `pending_close` nova e cancelar se for indevida.
- **Assumir que "aparece em `ObterEstoqueAtual`" ou "`ObterFotosCarro`
  retorna fotos" prova que um anúncio existe de verdade.** Nenhuma das duas
  é confiável sozinha pra detectar exclusão manual recente. Achado real
  27/08/2026: (1) HR-V `77614580` (excluído manualmente pela Adriana)
  apareceu em `ObterEstoqueAtual`, e só depois `ObterFotosCarro` confirmou
  vazio — parece propagação com atraso. (2) BMW 320iA `UDJ9A33`/anúncio
  `75274239`, excluído manualmente pela Adriana no mesmo dia,
  **`ObterFotosCarro` continuou retornando sucesso com 20 fotos reais**
  horas depois — contradiz a conclusão do caso (1). Conclusão: as duas
  consultas podem ficar desatualizadas por tempo indefinido depois de uma
  exclusão manual no painel. **A única fonte confiável pra "esse anúncio
  ainda existe?" é o próprio painel da Webmotors (ou a palavra da Adriana,
  que olha lá direto)** — não insista em reconferir por API quando ela já
  confirmou uma exclusão manual.

## De/para do vocabulário CRM ↔ Webmotors

O match usa **as duas** colunas: `nome_crm` (termo do CRM) e `nome_wm` (termo da
Webmotors). O XML sempre leva o `nome_wm`.

| Tabela | `codigo_wm` | `nome_wm` | `nome_crm` |
|---|---|---|---|
| `wm_cambios` | 23003 | Automática | Automático |
| `wm_cores` | 30404 | Branco | Branca |
| `wm_cores` | 30410 | Preto | Preta |
| `wm_combustiveis` | 21205 | Gasolina e álcool | Flex |
| `wm_combustiveis` | 21210 | Gasolina e elétrico | Híbrido |

`Manual`, `Azul`, `Cinza`, `Prata`, `Gasolina` e `Diesel` já batem direto. A
comparação ignora maiúsculas, então `flex`/`Flex` e `preto`/`PRETA` resolvem.

**Ao entrar valor novo no CRM** (cor, câmbio ou combustível que não exista aqui),
cadastre o `nome_crm` na linha equivalente — senão o veículo trava em
`revisao_necessaria` com motivo `catalogo_wm`. Cuidado com `Híbrido`: hoje
traduz para gasolina + elétrico, o que vale para os 5 híbridos do estoque em
10/08/2026; híbrido a diesel ou plug-in exigirá outra linha.

## Correções e regras novas — 20/08/2026

- **Causa raiz corrigida: `wm-confirmar-mapeamento` nunca gravava
  cor/câmbio/combustível.** Achado ao investigar o log de erro do Honda City
  CITY Hatchback Touring (`TCQ0B23`, 5 tentativas falhas entre 19:35 e
  19:44) — o mapeamento estava `confirmado_manualmente: true` e `status_sincronizacao:
  'mapeado'`, mas `codigo_cor_wm`/`codigo_cambio_wm`/`codigo_combustivel_wm`
  ficaram `null` porque `wm-confirmar-mapeamento` só gravava
  `codigo_modelo_wm`/`codigo_versao_wm` — nunca rodava o match de
  cor/câmbio/combustível que `wm-mapear-veiculo` já fazia. O guard em
  `wm-sync` bloqueava a publicação, mas o painel dizia "mapeamento
  confirmado! liberado para sincronização" — mentira silenciosa, mesmo
  padrão de bug já visto em `publicar-social` (ver `docs/meta-integracao.md`).
  Corrigido: `matchCatalogoExato` extraída para `_shared/wm-catalogo-match.ts`
  (antes só existia dentro de `wm-mapear-veiculo`) e `wm-confirmar-mapeamento`
  agora roda o mesmo match antes de marcar como `mapeado`; se cor/câmbio/
  combustível não baterem no catálogo, volta pra `revisao_necessaria` com
  `erro_msg` explicando o que falta, e o front (`VehicleFormModal.tsx`) mostra
  esse aviso em vez do toast de sucesso genérico.
- **Nova regra: exclusão manual permanente de um veículo na Webmotors.**
  Pedido da Adriana (20/08/2026): Toyota Hilux SW4 SRX 4x4 (`PYT5J89`) e RAM
  Rampage R/T Hurricane (`GTN5D81`) não serão publicados na Webmotors, decisão
  de negócio, não pendência técnica. `wm_mapeamento_veiculos.status_sincronizacao`
  ganhou o valor `'excluido_manualmente'` (coluna é `text` livre, sem CHECK —
  não precisou de migration) e `wm-mapear-veiculo` agora checa esse status
  logo no início e sai sem reavaliar nada — sem esse guard, salvar o veículo
  de novo no admin ("Validar e Salvar" chama essa function) recalcularia o
  mapeamento do zero e podia trazer o veículo de volta pra fila de revisão.
  Pra reverter uma exclusão dessas no futuro, mude o `status_sincronizacao`
  direto no banco (não existe tela pra isso ainda) e salve o veículo de novo
  no admin pra remapear.
- **Nova regra: fila não fica mais travada com erro de cota estourada.**
  Achado junto: 4 veículos (Toyota Hilux SW4 SRX `SSF5A83`, Audi A3
  `PQE7D92`, Ford Mustang Mach 1 `SFZ3G06`, Land Rover Freelander2
  `OPZ2408`) falharam em 13/08/2026 por falta de vaga na modalidade Básico e
  ficaram com `status='error'` em `estoque_publicacoes` **sem nunca serem
  retentados** — 7 dias parados, sem ninguém conseguir agir (não é problema
  de mapeamento, é capacidade da conta). Corrigido em `wm-sync`: quando a
  cota está cheia, a linha é **removida** da fila (`estoque_publicacoes`,
  não fica marcada como erro permanente) — publicar de novo é ação manual
  (toggle ou "Sincronizar Agora" no painel) pra quando houver vaga. O que
  aconteceu continua registrado em `sync_log`, só não fica mais um "erro"
  parado no painel. As 4 linhas antigas foram limpas manualmente também
  (20/08/2026) — os 4 veículos continuam `disponivel`, só não têm mais
  tentativa pendente na fila; publicar de novo precisa de ação manual
  quando houver vaga na modalidade Básico.

## Em aberto

- ~~`CodigoAnuncio` volta 0~~ **RESOLVIDO em 10/08/2026.** Primeiro anúncio
  criado: VW up! move, `CodigoAnuncio` **26117966**, status `created`. A causa
  era o campo `CodigoCambio` ausente, não a conta de homologação — a hipótese de
  "conta genérica não provisiona anúncio" estava **errada**. A homologação cria
  anúncio de verdade.

- ~~**BUG — laço de republicação.**~~ **RESOLVIDO, confirmado em 12/08/2026.**
  O trigger `trigger_wm_sync_on_veiculo_change` já tem a proteção
  `AND existing_post_id IS NULL` no ramo que insere `pending_create` — verificado
  lendo `pg_proc` ao vivo. Antes da correção o bug **chegou a se manifestar de
  verdade**: o VW up! move (`cbaa3a69-3db9-4fa2-b4c2-7de9ba53e50b`) foi publicado
  duas vezes na Webmotors em 10/08/2026 — `CodigoAnuncio` **26117966** às 21:04:37
  e **26117968** às 21:30:12, os dois com status `publicado` na fila.

  ~~**Pendente:** o anúncio duplicado continua ativo~~ **Um dos dois já foi
  despublicado** — `26117966` está `despublicado` na fila desde 12/08 13:36:33
  (`ObterEstoqueAtual` ao vivo confirma: só `26117968` continua ativo na
  Webmotors, placa `PZL2G96`). Não sei quem/o quê despublicou; não fui eu nesta
  sessão. Vale confirmar com a Adriana se foi ação manual dela.

  **Regra de produto definida por Adriana em 12/08/2026 — IMPLEMENTADA e
  VERIFICADA AO VIVO em 12/08/2026.** `wm-sync` agora chama `ObterEstoqueAtual`
  uma vez por execução e pula a criação (marcando `publicado` com o
  `CodigoAnuncio` existente, sem bloquear o operador) quando a placa já está
  anunciada. Fail-open se a consulta falhar.

  **BUG encontrado e corrigido no mesmo dia, antes de ir pra produção:** o
  parser (`parseEstoqueAtual` em `_shared/wm-soap.ts`) procurava a tag
  `<AnuncioWM>`, mas a resposta real da Webmotors usa `<Anuncio>` — mesmo risco
  de nome de tag já visto no `ObterVersao` (`<Versao>` vs `<VersaoWM>`).
  Resultado: a lista sempre voltava vazia e a checagem de duplicidade nunca
  disparava, silenciosamente — o sistema "achava" que não tinha nada publicado.
  Confirmado ao vivo via `wm-catalog-fetch` com `{"catalogo":"estoque_atual"}`
  (adicionado nesse catálogo especificamente pra este teste): 49 ocorrências de
  `<Anuncio>`, 0 de `<AnuncioWM>`. Corrigido e reimplantado; teste local
  reprocessando a resposta real confirmou os 49 itens e agrupou corretamente
  várias placas com anúncios duplicados (a homologação já acumula bastante lixo
  de teste — uma placa chegou a ter 7 `CodigoAnuncio` diferentes).

  **Achado durante o teste, ainda não confirmado:** às 15:09:27 de 12/08 (antes
  da correção acima estar no ar) uma tentativa de sincronizar de novo o VW up!
  falhou com `CodigoRetorno 32`. Esse código tem duas traduções diferentes no
  código (`CODIGO_RETORNO_MENSAGENS['32']` = "Falha inesperada — payload
  incorreto"; `CODIGO_RETORNO_43['32']` = "Número de anúncios disponíveis para
  a modalidade esgotado") — a segunda é mais plausível aqui, dado que a
  homologação já tem 49 anúncios ativos/duplicados acumulados de testes. Se for
  isso, o `IncluirCarro` vai continuar falhando até alguém limpar os anúncios de
  teste na homologação ou perguntar ao suporte (Gabriel) sobre o limite da
  modalidade `2943`. **Não confirmado — só uma hipótese.** A publicação que
  gerou esse erro ficou com `status='error'` na fila (`estoque_publicacoes` id
  `9927c922-8aea-43ca-9fff-4a326dc322ea`) e não é reprocessada sozinha —
  precisa de reenvio manual (agora já com a checagem de duplicidade corrigida,
  que deve pular a criação e só marcar como publicado usando o `26117968`
  existente).

- **`processed` do `wm-sync` não conta item que falhou.** Uma publicação que
  falha devolve `{"success":true,"processed":0}`, que parece sucesso. A verdade
  está em `estoque_publicacoes.erro_msg` e em
  `wm_mapeamento_veiculos.ultima_resposta_xml`.

### Estado do estoque em 10/08/2026, depois do de/para

Mapeamento rodado nos 26 disponíveis: **7 `mapeado`**, 18 em revisão por
**versão**, 1 por **modelo**. Nenhuma falha por catálogo — o de/para resolveu
essa porta inteira.

Dos 7 mapeados, **só 1 tem "De" maior que "Por"**: o VW up! move
(`cbaa3a69-3db9-4fa2-b4c2-7de9ba53e50b`, 52.497 por / 54.897 de). Os outros 6
têm `preco_revenda` igual ao `preco_venda` e cairiam no `22|78`.

Os 18 em revisão por versão são o efeito do limiar 0,35 contra texto duplicado —
o candidato certo costuma vir em 1º lugar, só abaixo do limiar. Confirmar via
`wm-confirmar-mapeamento` resolve, mas **atenção**: essa função grava apenas
modelo e versão. Se o veículo travou antes da etapa de cor/câmbio/combustível,
esses códigos ficam vazios e o guard do `wm-sync` bloqueia. Depois do de/para
isso deixou de acontecer para quem passa da versão, mas vale conferir.

A fila `estoque_publicacoes` tinha 2 registros `webmotors` com status `error`,
resíduo das tentativas anteriores ao `PrecoReal`.
- **20 dos 26 disponíveis têm `preco_revenda` igual ao `preco_venda`**, o que
  viola a regra do `22|78`. Só 6 têm "De" maior. Preencher um "De" fictício é
  decisão comercial da Adriana, não técnica.
- **Limiar de confiança 0,35** ainda não calibrado. Exemplo real: a HR-V EX
  pontuou 0,304 contra a versão correta, porque `modelo` e `versao` no CRM
  guardam texto duplicado e o nome da Webmotors não inclui o modelo.
- **Janela da homologação** não documentada pela Webmotors — perguntar ao
  Gabriel, é necessário para agendar as sincronizações.
- ~~**`wm-auth` divergente**~~ **RESOLVIDO em 12/08/2026.** `config.toml`
  corrigido para `verify_jwt = true`, alinhado à produção. No mesmo commit,
  achada e corrigida uma segunda divergência não documentada: `wm-catalog-fetch`
  estava `true` no `config.toml` e `false` em produção — corrigido para `false`
  (é chamada com a anon key, sem sessão, para diagnóstico).
- ~~**Preço "De" — regra definida por Adriana em 12/08/2026, falta
  implementar.**~~ **IMPLEMENTADO em 12/08/2026**, em `VehicleFormModal.tsx`.
  O "De" (`preco_revenda`) **não é mais digitado** — o campo no formulário fica
  travado (`disabled`) e sempre espelha o Valor FIPE; no `save()`,
  `preco_revenda` é forçado a `= valor_fipe` (não lê mais input do operador).

  A validação de faixa (65%-135% da FIPE, confirmada pelo suporte: "aceitamos
  percentual mínimo (35%) e máximo (35%) baseado na FIPE") **mudou de campo**:
  corrigido pela Adriana em 12/08/2026 — a faixa vale para o **"Por"**
  (`preco_venda`), não para o "De". O "De" é só a referência (=FIPE), sem
  validação própria.

  **Decisão consciente de risco, tomada por Adriana em 12/08/2026:** a faixa do
  "Por" fica com os 135% cheios, mesmo sabendo que isso permite `Por > FIPE`, e
  portanto `De (=FIPE) < Por` — configuração que o teste ao vivo na Honda WR-V
  (ver "Fatos confirmados" acima) mostrou que a Webmotors bloqueia com
  `CodigoRetorno 22|78`. Adriana decidiu manter assim porque entende que a
  Webmotors aceita dentro da faixa de 35% mesmo retornando esse código. **Ainda
  não testado ao vivo com `Por` entre 100% e 135% da FIPE** — se um veículo
  nessa faixa for bloqueado na prática, é esperado, não é bug; registrar o
  resultado aqui quando acontecer.
- **Tela de log por integração/plataforma — pedido por Adriana em 12/08/2026,
  não existe ainda.** Todo `CodigoRetorno` da sincronização (não só falhas)
  precisa aparecer numa tela de log separada por plataforma, para o operador ver
  o que aconteceu em cada tentativa — inclusive os que são só aviso, não
  bloqueio.

- **NOVO — `43|41,43|37` ("Marca-Modelo-Versão-Ano Modelo Inconsistentes" +
  "Ano do modelo inválido") em veículo recente (AnoDoModelo 2024).** Testado
  ao vivo em 12/08/2026: VW T-Cross, `CodigoModelo` 3728, `CodigoVersao`
  347981 ("1.0 200 TSI TOTAL FLEX COMFORTLINE AUTOMÁTICO"), `AnoDoModelo`
  2024, `AnoFabricacao` 2023 — `IncluirCarro` bloqueou, `CodigoAnuncio` voltou
  `0`. XML completo (request+response) em
  `wm_mapeamento_veiculos.ultima_resposta_xml` pra esse veículo
  (`78ffd6ed-b1c2-49e1-ab6d-b0e0c3b2f498`).

  Descartado como causa: não é duplicidade de versão (só existe 1 `CodigoVersao`
  pra "COMFORTLINE AUTOMÁTICO" em `wm_versoes`) nem duplicidade de modelo (só 1
  `CodigoModelo` pra "T-CROSS"). Câmbio/cor/combustível batem certo no XML.

  **Hipótese forte, não confirmada:** o manual do tipo `AnuncioWM` (o schema
  correto de usado, `https://integracao.webmotors.com.br/manualintegracao/TiposFormatosDeDados/TipoDados/Carros/AnuncioWM.htm`)
  documenta um campo `CodigoVersaoAno` — "código da versão-ano correspondente
  ao ano e versão do carro" —, informativo (não precisa ser enviado), mas cuja
  existência sugere que a Webmotors trata **versão + ano-modelo como um par
  com identidade própria** internamente. O nosso `ObterVersao` (que popula
  `wm_versoes`) **não captura ano nenhum** — só `codigo_wm` + `nome_wm`. Se a
  Webmotors tem códigos de versão diferentes por ano do modelo pro mesmo nome
  de trim, o nosso catálogo local não tem como saber qual é o certo pra
  2024 — pode estar usando um código válido só pra anos anteriores.

  Único teste que deu certo até agora (VW up! move, 10/08/2026) era
  `AnoDoModelo` **2017** — não é prova, mas é consistente com a hipótese.

  **Em aberto:** confirmar com o suporte (Gabriel) se `CodigoVersao` é
  ano-específico e como descobrir o código certo por ano; ou testar
  isoladamente (`wm-catalog-fetch`, sem afetar veículo real) se o mesmo
  `CodigoVersao` 347981 funciona com um `AnoDoModelo` mais antigo pra isolar
  se o problema é o ano 2024 especificamente.

  Sobre os 3 links de `VersaoWM`/`DetalhesNovoWM`/`OpcionalNovoWM` também
  consultados: são do fluxo de carro **novo** (`DetalhesNovoWM.Ano` só existe
  "para versões que permitem anúncios de carros novos"), tipo diferente do que
  usamos (`AnuncioWM`, `TipoAnuncio=U`) — não geraram pista direta, mas
  reforçam o beco sem saída já registrado acima sobre schemas do manual não
  baterem entre métodos/direções diferentes.

## Achados — 27/08/2026

**`TrocarModalidadeCarro` — troca a modalidade de um anúncio JÁ existente.**
Extraído do manual oficial (as 3 páginas que a Adriana mandou):
- Entrada: `pHashAutenticacao`, `pCodigoAnuncio` (o anúncio a alterar) e **ou**
  `pCodigoModalidade` (código direto da modalidade nova) **ou**
  `pCodigoAnuncio2` (troca com a modalidade de outro anúncio seu).
- Retorno: `RetornoTrocaModalidade` — mesmo padrão `CodigoRetorno` do resto da
  API.
- **Não existe Ativar/Desativar/Reativar anúncio.** "Despublicar" na
  Webmotors é `ExcluirCarro` de verdade (apaga o `CodigoAnuncio`) — não tem
  volta pro mesmo código.

**Cota de modalidade confirmada ao vivo (`ObterModalidade` + `ObterEstoqueAtual`
cruzados, 27/08/2026):** 19 anúncios reais ativos = 18 em Básico (`6351`,
cheio, 18/18) + 1 em VIP "Super Acelerador Vip - M" (`6914`, 1/2 — 1 vaga
livre, ocupada hoje pelo Jeep Compass `QUK1J80`). As duas fontes batem exato.

**H6 19 (`SGI9C15`) rejeitado em VIP (`43|41`+`43|37`) — causa mais provável:
versão errada escolhida por falta de dado de ano, não restrição de
elegibilidade Webmotors.** Auditei o WSDL real
(`wsEstoqueRevendedorWebMotors.asmx?WSDL`): o tipo `Versao` tem um campo real
`AnoModelo` (`ArrayOfAnoModeloWM` — lista de anos válidos por versão), que
nosso parser em `wm-mapear-veiculo/index.ts` **descarta** (só lê
`NomeVersao`/`CodigoVersao`). O H6 19 tem 3 candidatos de versão com nomes
quase idênticos (`HEV ONE`/`HEV2`/`PHEV19`, todos "E-TRACTION") e scores de
texto pífios (0,058/0,062/0,082 — bem abaixo do `LIMIAR_CONFIANCA=0.35`), mas
o registro está `confirmado_manualmente=true` — a tela de confirmação também
nunca mostrou ano, porque o dado nem chega a ser salvo. **Proposto, não
implementado:** capturar `AnoModelo` em `wm_versoes` e usar como filtro
obrigatório no matching (texto só desempata versões do mesmo ano).

**`ObterVersao` não é confiável para recarga sob demanda — mesma chamada,
resultado diferente em datas diferentes.** Reproduzido ao vivo 27/08/2026:
chamar `ObterVersao` para o modelo do H6 19 (`20891`) com os MESMOS parâmetros
exatos que `wm-mapear-veiculo` usa em produção (`pDataInicioAtualizacao
2010-01-01`, `pDataFimAtualizacao` = hoje) devolve `CodigoVersao=0`/`AnoModelo`
vazio — nada. As 3 versões hoje em `wm_versoes` para esse modelo vieram de um
cache antigo, gravado num momento em que essa mesma chamada retornou dado
real. Hipótese mais provável: a Webmotors não respeita de verdade o intervalo
de datas enviado — só devolve o que mudou numa janela curta e recente do lado
deles. **Não confirmado sem abrir chamado com o suporte.**

**HR-V (`PZQ2F46`) — `43|36` ("Anúncio não pode ser alterado") em
`73668233`.** Dois achados reais:
1. **Bug real, corrigido:** `wm_mapeamento_veiculos.codigo_modalidade_wm`
   estava `6914` (VIP) pra esse veículo — nenhum código atual grava esse
   valor (`wm-mapear-veiculo` sempre grava Básico via
   `obterCodigoModalidadeBasico()`), então era um valor manual/antigo
   destoante. A cota VIP real (`ObterModalidade`, 1 uso = só o Jeep Compass)
   confirma que esse anúncio não é VIP de verdade. Corrigido pra `6351`.
2. **Testado ao vivo depois da correção — o erro 43|36 PERSISTIU.** A
   modalidade errada era um bug real, mas não era a causa raiz. O anúncio
   `73668233` responde com sucesso e fotos reais em `ObterFotosCarro` (existe
   de verdade), mas **não aparece em `ObterEstoqueAtual`** (lista de
   anúncios "ativos") e continua recusando qualquer `AlterarCarro`. Aponta
   pra um travamento do lado da Webmotors nesse anúncio específico (revisão
   manual, sinalização de compliance, etc.) — não é diagnosticável só com os
   dados que temos. **Precisa de chamado com o suporte Webmotors citando esse
   `CodigoAnuncio`.**

**Achado dentro do mesmo diagnóstico — linha duplicada em
`estoque_publicacoes`.** O HR-V tinha 2 linhas pra webmotors, mesmo `post_id`,
criadas em datas diferentes (13/08 e 26/08) — o `wm-sync` processava as duas
por rodada. Removida a mais antiga. Vale conferir se outros veículos têm o
mesmo problema (não auditado além do HR-V).

**Confirmado — não existe, no manual oficial, nenhuma forma documentada de
checar se um anúncio está realmente ativo agora, nem garantia de tempo
real.** Auditei as páginas oficiais do manual (as que a Adriana mandou):

- **`ObterEstoqueAtual` (entrada)**: só recebe `pHashAutenticacao` — nenhum
  parâmetro de filtro por status. Bate com o que o código já usa.
- **`AnuncioWM2` (tipo de retorno do `ObterEstoqueAtual`)** — tabela completa
  (extraída pela Adriana direto do manual, 27/08/2026), **nenhum campo de
  status/situação do anúncio** entre eles:

  | Atributo | Obrigatório | Tipo | Descrição |
  |---|---|---|---|
  | CodigoAnuncio | Sim | Decimal | Código identificador do anúncio |
  | CodigoModalidade | Sim | Decimal | Código da modalidade do anúncio |
  | TipoAnuncio | Sim | String | Código do tipo de anúncio |
  | CodigoMarca | Sim | Decimal | Código da marca do carro |
  | CodigoModelo | Sim | Decimal | Código do modelo do carro |
  | CodigoVersao | Sim | Decimal | Código da versão do carro |
  | AnoDoModelo | Sim | Inteiro | Ano do modelo do carro |
  | AnoFabricacao | Sim | Inteiro | Ano de fabricação do carro |
  | Km | Não *05 | Inteiro | Quilometragem atual (só usados) |
  | Placa | Sim *07 | String | Placa do veículo |
  | CodigoCambio | Sim | Decimal | Código do câmbio |
  | DescricaoCambio | Sim | String | Descrição do câmbio |
  | NrPortas | Sim | Inteiro | Número de portas |
  | CodigoCor | Não *02 | Decimal | Código de cor genérica |
  | DescricaoCor | Não | String | Descrição da cor |
  | CodigoCombustivel | Sim | Decimal | Código do combustível |
  | DescricaoCombustivel | Sim | String | Descrição do combustível |
  | Blindado | Sim | String | Indica blindagem |
  | AdaptadoDeficientesFisicos | Sim | String | Indica adaptação |
  | UnicoDono | Sim ** | String | Indica único dono |
  | Alienado | Sim ** | String | Indica alienação |
  | IpvaPago | Sim ** | String | Indica IPVA pago |
  | RevisadoOficinaAgendaDoCarro | Sim ** | String | Revisão em oficina credenciada |
  | RevisoesEmConcessionaria | Sim ** | String | Revisões em concessionária |
  | GarantiaDeFabrica | Sim ** | String | Garantia de fábrica |
  | Licenciado | Sim ** | String | Indica licenciamento |
  | PrecoVenda | Sim | Decimal | Preço de venda *09 |
  | Observacao | Não | String | Observações, máx. 500 caracteres *06 |
  | DataInclusao | Não *03 | String | Só consulta |
  | DataUltimaAlteracao | Não *04 | String | Só consulta |
  | Opcional | Não | OpcionalWM[] | Lista de opcionais |
  | CodigoRetorno | Não | String | Código de retorno do método |

  `** Depende do tipo de anúncio (novo x usado) — ver detalhe no rodapé da
  página do manual.` `*02/*03/*04/*01` não valem pra manutenção (só
  consulta ou dispensável). `*05` só usados. `*06` máx. 500 caracteres.
  `*07` obrigatório só em usados. `*09` usado nas buscas do site.

  A simples presença na lista é o único sinal que a API dá sobre um
  anúncio, e — pelos casos reais de hoje (HR-V, BMW) — esse sinal pode
  ficar desatualizado por tempo indefinido depois de uma exclusão manual no
  painel.
- **`EntradaModalidadeManutCarros` (entrada do `ObterModalidade`)**: também
  só `pHashAutenticacao`, sem parâmetro adicional.
- **`ModalidadeWM` (tipo de retorno do `ObterModalidade`)**: 10 campos —
  `QuantidadeAnunciosTotal`/`QuantidadeAnuncios` entre eles, mas **sem campo
  de status** e sem qualquer nota sobre o quão "em tempo real" esse número
  é.
- **`RetornoManutencao`/`RetornoObterModalidade`**: só a tabela genérica de
  `CodigoRetorno`, nada específico sobre frescor de dado ou cache.

**FECHADO DE VERDADE 27/08/2026 — auditado direto no Cockpit (painel oficial,
sessão logada da Adriana), não só por conta.** Lista completa dos 17
veículos reais (via `read_page` no `cockpit.com.br/inventory`):

| Placa | Veículo | publishId (CodigoAnuncio real) |
|---|---|---|
| PUQ-3A75 | Honda Fit | 78447550 |
| TCQ-0B23 | Honda City | 78229773 |
| QMY-0E06 | Toyota RAV4 | 77894794 |
| RFV-1E55 | Hyundai HB20X | 77894718 |
| STE-4D79 | VW T-Cross | 77533344 |
| LSL-9F31 | Range Rover Evoque | 76829636 |
| RCC-9H74 | Ford Ranger | 76953232 |
| FJK-7E17 | Discovery Sport | 76240125 |
| TZG-3I61 | Fiat Toro | 76126328 |
| JKJ-1C64 | Kia Sportage | 75501198 |
| UDJ-9A33 | BMW 320i (2026) | 75274239 |
| PZL-2G96 | VW up! | 74807577 |
| SYI-6C55 | Volvo XC60 | 74036597 |
| RUG-8F56 | Toyota Hilux | 74036318 |
| QUK-1J80 | Jeep Compass (**VIP**) | 73666856 |
| SIQ-5H93 | Haval H6 (outro, não confundir com o SGI9C15) | 73579434 |
| GTN-5D81 | RAM Rampage | 73318104 |

16 Básico + 1 VIP = 17, exato. **Não incluem HR-V, SW4 2017, SW4 2020 nem
H6 19 (`SGI9C15`)** — confirmado que nenhum dos 4 está publicado agora.

**Correção de um erro meu no caminho**: eu tinha marcado o BMW `UDJ9A33`
como excluído, achando que era o carro que a Adriana tinha apagado — errado.
Quem ela excluiu de verdade foi outro BMW 320iA, **`FVY4J44` (2015)**, que
por isso não aparece na lista acima. Os dois têm marca/modelo idênticos
(fácil de confundir numa conversa) — o dado real do Cockpit desfez a
confusão.

**Conclusão prática, agora quantificada com certeza**: a cota real de
Básico é **16 de 18 usados — 2 vagas livres de verdade** — mas
`ObterModalidade` (usado pelo guard de quota do `wm-sync`) continua
reportando `18/18`, bloqueando publicações novas que na realidade caberiam.
Não existe, hoje, uma forma 100% confiável — nem pela API, nem documentada
pela Webmotors — de perguntar "esse anúncio específico está ativo agora?"
logo depois de uma ação manual no painel; **o Cockpit (navegador, sessão
logada) é a única fonte que nunca falhou nesse diagnóstico.** As únicas
fontes que temos (`ObterEstoqueAtual`, `ObterModalidade`, `ObterFotosCarro`)
já mostraram, em teste real, atraso após exclusão manual. **Decisão da
Adriana (27/08/2026): não existe canal de e-mail/chamado com o suporte
Webmotors disponível — parar de tentar esse caminho.** A partir daqui, a
verificação de "isso está mesmo no ar?" é sempre manual, feita por ela
olhando o painel — não por tentativa de contato ou nova chamada de API.

**BUG REAL encontrado no `wm-sync`, não só nos meus testes: o guard de
duplicidade confia cegamente em `ObterEstoqueAtual`.** Testado ao vivo
27/08/2026: ao tentar publicar o HR-V (`PZQ2F46`) de novo, o `wm-sync`
achou a placa em `ObterEstoqueAtual` sob o código `77614580` e marcou como
`already_published` — **mas esse código já tinha sido excluído
manualmente pela Adriana** (confirmado por ela, e reconfirmado ao vivo por
`ObterFotosCarro`, que devolveu `CodigoAnuncio=0`/`0 fotos` pra esse mesmo
código, mesmo `ObterEstoqueAtual` ainda listando ele). Ou seja: não é só um
problema de diagnóstico manual — a checagem de duplicidade em produção
(`wm-sync/index.ts`, comentário "achado real 12/08/2026") pode gerar falso
positivo real, bloqueando uma publicação legítima achando (errado) que já
existe. **Não corrigido ainda** — precisaria de uma segunda confirmação
(ex.: `ObterFotosCarro`) antes de aceitar o resultado de
`ObterEstoqueAtual` como definitivo, o que gasta mais uma chamada por
veículo a cada sync.

## Correções reais implementadas — 27/08/2026, noite (código de produção)

**1. Bug real corrigido: guard de duplicidade do `wm-sync` confiava cego em
`ObterEstoqueAtual`.** Achado ao vivo (HR-V, `CodigoAnuncio 77614580`): esse
endpoint pode continuar listando um anúncio já excluído manualmente no
painel por mais de 24h — e o guard usava só isso pra decidir "já está
publicado", quase bloqueando uma publicação legítima com um falso positivo.
**Corrigido em `wm-sync/index.ts`**: antes de aceitar um match de placa em
`estoqueAtualWebmotors`, chama `ObterFotosCarro` pro `CodigoAnuncio`
candidato — só aceita como "já publicado" se o `CodigoAnuncio` ecoado bater
(anúncio fantasma ecoa `0`). **Testado ao vivo, funcionou**: reprocessar o
HR-V depois do fix não caiu mais no falso positivo, chegou até a checagem
real de cota (que aí sim bloqueou por falta de vaga genuína).

**2. Campo novo `wm_mapeamento_veiculos.ano_modelo_override_wm`** — permite
sobrescrever, só no XML mandado à Webmotors, o `AnoDoModelo` de uma
`CodigoVersao` específica, sem tocar em `veiculos.ano_modelo` (dado real do
carro, usado por NaPista/ML/contratos). Implementado em
`_shared/wm-soap.ts` (`buildAnuncioXML` usa
`mapa.ano_modelo_override_wm ?? veiculo.ano_modelo`) e propagado em
`wm-sync/index.ts`.

**3. H6 19 (`SGI9C15`) — RESOLVIDO DE VERDADE. Causa raiz real: marca e
modelo errados no cache, não o ano.** Depois de refutar a hipótese do ano
2024 por teste real (XML confirmado com `AnoDoModelo=2024`, recusado do
mesmo jeito com `43|41,43|37`), comparei ao vivo com o outro Haval H6 do
estoque (`SIQ5H93`), já publicado com sucesso, puxando o anúncio real dele
via `ObterEstoqueAtual`. **Descoberta**: `SIQ5H93` usa `CodigoMarca=352` e
`CodigoModelo=3895` — completamente diferentes do que estava cacheado pro
GWM/Haval H6 no nosso sistema (`CodigoMarca=5296`, `CodigoModelo=20891`).
Confirmei via `ObterModelo(352)` que `3895` é mesmo "HAVAL H6" — um código
de catálogo real e válido que nosso cache nunca tinha. Chamei `ObterVersao`
pra esse modelo correto e (ao contrário do modelo errado, que sempre
voltava vazio) **voltou o catálogo completo, com `AnoModelo` real por
versão** — incluindo `379677 "1.5 PHEV19 E-TRACTION"`, válida pra
`AnoModelo 2025/2026`, batendo exato com o carro (ano real 2025, "H6 19" no
nome). Corrigi o cache (`wm_marcas`, `wm_modelos`, `wm_versoes`) e o
mapeamento do veículo pros códigos certos, sem nenhum override de ano
necessário — e **publiquei de verdade em VIP**: `CodigoAnuncio 78502365`,
20 fotos enviadas, 0 falhas. `CodigoMarca=5296`/`CodigoModelo=20891` ficam
órfãos no cache (não apagados, por histórico) — se aparecer outro GWM na
mesma situação, usar 352/3895.

**4. Os 3 veículos pedidos pela Adriana — SW4 2020, H6 19 e HR-V —
processados pelo fluxo real, sem nenhum script avulso.**
- **SW4 2020**: publicado com sucesso (`CodigoAnuncio 78502185`, 17 fotos)
  assim que uma vaga real de Básico apareceu (`ObterModalidade` passou de
  18/18 pra 17/18 sozinho, depois de um tempo).
- **H6 19**: publicado com sucesso em VIP (`CodigoAnuncio 78502365`, 20
  fotos) depois da correção real de marca/modelo (item 3 acima).
- **HR-V**: anúncio antigo travado (`73668233`) removido de verdade via
  `ExcluirCarro` real; **publicado com sucesso** depois (item 5 abaixo),
  `CodigoAnuncio 78502438`, 20 fotos.

**5. Trava local de cota REMOVIDA do `wm-sync` (pedido da Adriana,
27/08/2026) — auditoria agora é só pelo retorno real da Webmotors.** O
guard que bloqueava `IncluirCarro` comparando com `ObterModalidade`
(`quota.usados >= quota.total`) foi removido de `wm-sync/index.ts`. Motivo:
essa consulta provou, repetidas vezes nesta sessão, ficar desatualizada por
horas depois de exclusões manuais no painel — bloqueando publicações que
cabiam de verdade. **Confirmado ao vivo**: o Cockpit mostrava 18/18 em
Básico minutos antes, e mesmo assim o HR-V foi aceito e publicado de
verdade ao tentar sem a trava. A partir de agora, a única trava real é a
própria resposta da Webmotors no `IncluirCarro` — `43|32` (modalidade
esgotada) ou `43|33` (pacote esgotado) — tratada pelo fluxo de erro
normal. `ObterModalidade` continua sendo chamada e `wm_modalidades`
continua sendo atualizada a cada rodada, só que agora é informativo
(painel/dashboard), não trava mais nada.

## Verificações comprovadas — 28/08/2026

**1. A troca de `codigo_wm` (5296→352, 20891→3895) em `wm_marcas`/`wm_modelos`
não afeta o `SIQ5H93` (outro Haval H6, já publicado) nem qualquer outro
veículo já mapeado — confirmado lendo o código-fonte real, não por
suposição.** `wm-sync/index.ts` não tem nenhuma referência a `wm_marcas`
nem `wm_modelos` (confirmado por busca no arquivo inteiro) — o XML enviado
usa sempre o valor já gravado em `wm_mapeamento_veiculos`, nunca relê essas
tabelas. Só `wm-mapear-veiculo/index.ts` lê `wm_marcas`/`wm_modelos`, e só
durante o match por trigram de um veículo **ainda não mapeado** ou
remapeado com `force:true`. `SIQ5H93` está com `status_sincronizacao =
'mapeado'` e mantém `codigo_marca_wm='5296'`/`codigo_modelo_wm='20891'` na
própria linha (inalterado pela migração de hoje) — seu anúncio real
(`73579434`) foi criado em 14/07/2026 e nunca sofreu um `AlterarCarro`
desde então (confirmado via `sync_log`: único evento depois da criação foi
`skip_duplicado` em 13/08/2026). Não há, portanto, nenhuma tentativa real
registrada de enviar esses códigos antigos numa alteração — não dá pra
afirmar se um `AlterarCarro` futuro pra esse veículo funcionaria ou não com
os códigos que ele já tinha antes de hoje; isso é inalterado pela correção
de hoje, não uma consequência dela.

**2. Código publicado no Supabase confirmado idêntico ao commitado no
GitHub — diff byte a byte, sem diferença.** Busquei o código real via
`get_edge_function` (API do Supabase), extraí o conteúdo de
`wm-sync/index.ts` e `_shared/wm-soap.ts` preservando UTF-8, e comparei
contra `git show HEAD:...` dos mesmos arquivos (normalizando só CRLF vs LF,
que é convenção de quebra de linha, não código). **Resultado: `diff`
retornou vazio nos dois arquivos (exit code 0).** Uma primeira tentativa
de comparação apontou dezenas de diferenças — todas eram mojibake
(acentos corrompidos) introduzido pela minha própria extração via
PowerShell, confirmado comparando o JSON bruto original (que já vinha com
UTF-8 correto da API) antes de qualquer processamento meu. Refeita a
extração sem esse problema, a comparação real deu zero diferenças.

## Diagnóstico rápido

```sql
-- o catálogo de versões está populado?
select count(*) from wm_versoes;

-- onde os veículos estão travando?
select status_sincronizacao, count(*) from wm_mapeamento_veiculos group by 1;

-- quantos veículos casam nos 3 catálogos?
select count(*) filter (where
      exists (select 1 from wm_cores c where v.cor ilike any(array[c.nome_wm, c.nome_crm]))
  and exists (select 1 from wm_cambios c where v.cambio ilike any(array[c.nome_wm, c.nome_crm]))
  and exists (select 1 from wm_combustiveis c where v.combustivel ilike any(array[c.nome_wm, c.nome_crm])))
from veiculos v where status = 'disponivel';

-- a resposta bruta do último IncluirCarro
select veiculo_id, left(ultima_resposta_xml, 800)
from wm_mapeamento_veiculos where ultima_resposta_xml is not null;
```

Teste do `ObterVersao` sem publicar nada (`POST` com a anon key):

```
/functions/v1/wm-catalog-fetch
{"catalogo":"versao","codigo_modelo":"730","data_inicio":"2010-01-01","data_fim":"<hoje>"}
```
