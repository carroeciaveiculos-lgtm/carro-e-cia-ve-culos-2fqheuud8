# Webmotors — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Última atualização: 2026-08-10.

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
| `22\|78` = **"PrecoReal (De) deve ser maior que PrecoVenda (Por)"** | suporte Webmotors (Gabriel Moreira da Silva), 10/08/2026 |
| `ObterVersao` exige `pDataInicioAtualizacao` + `pDataFimAtualizacao` além do `pCodigoModelo` | suporte Webmotors, 08/2026; validado ao vivo 10/08/2026 |
| O item de versão vem como `<Versao>`, **não** `<VersaoWM>` | XML real 10/08/2026: 21 × `<Versao>`, 0 × `<VersaoWM>` |
| O item de modelo vem como `<ModeloWM>` | `wm_modelos` populada (1854 linhas) com esse parser |
| `CodigoModalidade` contratado = `2943` ("Anúncio Básico"), único | `ObterModalidade`, 07/08/2026 |
| A homologação tem **janela de horário** | 503 nginx no sábado 08/08 20h30; SOAP normal na sexta 07/08 e na segunda 10/08 17h |
| Endpoint de produção: `https://integracao.webmotors.com.br/wsEstoqueRevendedorWebMotors.asmx` (sem `/IntegracaoRevendedor/`) | collection Postman oficial |
| Credenciais atuais são as **genéricas de homologação** | `homologacaows@webmotors.com.br`, CNPJ `12.319.744/0001-52` — não o CNPJ da loja |

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

- **`CodigoAnuncio` volta 0** com validação limpa. Hipótese vigente desde
  10/08/2026: faltava o campo `PrecoReal`, agora corrigido — **não testado
  ainda**, porque o teste esbarrou na fila de publicação. Hipótese anterior
  (conta de homologação não provisiona anúncio real) fica em segundo plano.

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
- **`wm-auth` divergente:** `config.toml` diz `verify_jwt = false`, produção está
  `true`. Deploy dela **abriria** a função. Decidir antes de deployar.

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
