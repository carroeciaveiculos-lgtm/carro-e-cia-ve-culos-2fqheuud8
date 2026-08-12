# Webmotors — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Última atualização: 2026-08-12.

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
