# Consultas externas (CNPJ, CPF, Placa/FIPE) — referência técnica

**Como usar este documento.** Vá direto à seção do seu assunto. A seção
_Becos sem saída_ lista o que já foi testado e falhou — **não repita**. Ao
descobrir algo novo, acrescente aqui com data e fonte, em vez de deixar só no
histórico de conversa.

Última atualização: 2026-08-18.

## O que é

Três Edge Functions chamadas pelo frontend autenticado (`verify_jwt = true`
nas três) pra preencher formulário automaticamente a partir de um documento:
CNPJ (dados da empresa), CPF (dados da pessoa) e placa (dados do veículo +
tabela FIPE). Não são webhooks nem cron — só respondem quando alguém do
painel pede.

| Function | Consulta | Provedor | Custo |
|---|---|---|---|
| `consultar-cnpj` | Razão social/endereço de uma empresa | [BrasilAPI](https://brasilapi.com.br/) — `GET /api/cnpj/v1/{cnpj}` | Gratuito, sem chave |
| `consultar-cpf` | Dados cadastrais de uma pessoa | [ApiBrasil](https://apibrasil.io/) — `POST /api/v2/consulta/cpf/credits` | Pago, consome crédito por consulta |
| `consultar-placa` | Dados do veículo + histórico FIPE | ApiBrasil — `POST /api/v2/consulta/veiculos/credits` | Pago, consome crédito por consulta |

## Fatos confirmados

| Fato | Como se sabe |
|---|---|
| `consultar-cpf` e `consultar-placa` usam a mesma variável de ambiente, `API_BRASIL_TOKEN` — token único pra pessoa e veículo | leitura de `consultar-cpf/index.ts` e `consultar-placa/index.ts` |
| `consultar-cnpj` **não precisa de nenhuma chave** — a BrasilAPI é pública | leitura de `consultar-cnpj/index.ts`; nenhuma variável de ambiente lida no arquivo |
| **`consultar-cpf` e `consultar-placa` têm um modo mock**: se `API_BRASIL_TOKEN` não estiver configurado, cada uma gera um resultado fake determinístico (baseado num hash do CPF/placa digitado — sempre a mesma pessoa/carro fake pro mesmo documento) **e grava esse resultado fake na tabela de cache real** (`clientes` pro CPF, `veiculos_cache` pra placa), sem nenhum aviso visual de que é mock | leitura de `consultar-cpf/index.ts` linhas 79-109 e `consultar-placa/index.ts` linhas 45-124 |
| **Hoje não há contaminação de dado mock nas tabelas reais** — conferido em 18/08/2026: 24 clientes cadastrados, nenhum com o padrão do mock (`email = 'mock@exemplo.com'` ou `rg = '123456789'`); 45 linhas em `veiculos_cache`, nenhuma com `mes_referencia = 'Mês Atual'` (marca do mock de placa). Indício de que `API_BRASIL_TOKEN` está configurado e funcionando, mas não é uma confirmação direta (não testei consulta real) | `select count(*) ... from clientes` e `from veiculos_cache`, 18/08/2026 |
| As duas consultas (CPF e placa) **checam cache antes de gastar crédito**: se já existe linha com o mesmo CPF/placa em `clientes`/`veiculos_cache`, devolve o valor salvo (`cached: true`) sem chamar a ApiBrasil de novo | leitura das duas functions, bloco "Verificação no Cache Inteligente" |
| `consultar-cpf` tenta extrair o nome da pessoa de formatos de resposta bem variados da ApiBrasil (função `findNome`, busca recursiva no JSON) — indício de que o formato de retorno real da ApiBrasil já mudou ou é inconsistente entre tipos de consulta | leitura do código, linhas 11-43 |
| Nenhuma das três grava log de auditoria (quem consultou o quê, quando) — só atualiza a linha de cache | leitura das três functions, nenhuma escreve em tabela de log/histórico |

## Becos sem saída — não repetir

- Não é possível confirmar se `API_BRASIL_TOKEN` está configurado sem
  disparar uma consulta real (custa crédito) ou sem acesso aos Secrets do
  Supabase (não exposto por SQL) — a ausência de dado mock nas tabelas é
  indício forte, não prova definitiva.

## Em aberto

- **Risco silencioso, não corrigido**: se o crédito da ApiBrasil acabar ou o
  token expirar no futuro, `consultar-cpf` e `consultar-placa` voltam a
  gerar dado fake e gravar automaticamente em `clientes`/`veiculos_cache`
  sem avisar ninguém — mesmo padrão de risco já achado no Autentique (ver
  `docs/autentique-integracao.md`). Não corrigido agora — decisão da
  Adriana foi só documentar, sem investigar/corrigir nesta sessão.
- Não confirmado se existe algum limite de créditos configurado ou alerta
  de saldo baixo na conta da ApiBrasil — fora do escopo desta sessão.
