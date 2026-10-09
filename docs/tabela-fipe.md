# Página pública Tabela FIPE (`/tabela-fipe`)

Criada em 08/10/2026. Consulta de valor FIPE de **carros** por marca → modelo → ano,
para a equipe e para clientes. Sem tabela nova, sem Edge Function, sem escrita no banco.

## Como funciona

- `src/pages/TabelaFipe.tsx` (página) + `src/services/fipe.ts` (funções `getFipe*`, v2).
- O **navegador do visitante** chama `https://fipe.parallelum.com.br/api/v2` direto
  (a API libera CORS `*`). A cota gratuita é **por IP do visitante**, então não
  consome nada nosso e não há proxy (os termos proíbem "revender ou redistribuir
  o acesso à API").
- Mês: `/references` (cache 6 h) → o primeiro item é o mais recente. Todas as
  chamadas levam `?reference=<código>`. Mês novo = lista nova sozinha, sem cron.
- Cache em `localStorage` (chave `fipe-v2:*`, 30 dias; a troca de mês muda a chave).
  Falha de `localStorage` nunca quebra a página.
- Variação: 1 chamada extra com o mês anterior (`refs[1]`). Plano gratuito não tem
  histórico (`priceHistory`); gráfico de 12 meses exigiria o plano Pro.
- IDs validados por regex antes de entrar na URL; erros mostrados em português
  (`FIPE_ERRO_GENERICO`), nunca o erro cru.
- As funções v1 (`getMarcas`, `getModelos`, `getAnos`) seguem só porque a home
  (`Consignment.tsx`) as usa. A `fipe-auditoria-modelo-versao` também usa a v1.

## Fatos medidos em 08/10/2026

- Limite gratuito observado: **500/dia** sem token (cabeçalho `x-ratelimit-limit`;
  um teste anterior mostrou 1000, provavelmente com cache). Plano Pro: R$ 49–59/mês,
  ilimitado e com histórico.
- Volume: só a VW tem ~549 modelos; 108 marcas. Espelhar a tabela inteira
  (modelos × anos) passaria de centenas de milhares de chamadas — inviável no plano gratuito.
- Termos (`fipe.api.br/termos-de-uso`): sem cláusula sobre uso comercial ou
  cache; proíbem revender/redistribuir o acesso, scraping massivo e burlar limites.
  O texto diz que os dados vêm de fontes públicas da Fundação FIPE e que a
  fipe.api.br não é afiliada a ela.

## Pendências / riscos

- Confirmar uso comercial com a fipe.api.br (e-mail) — não provado nos termos.
- A API gratuita é de terceiros e pode mudar limite ou sair do ar.
- Token gratuito criado em 09/10/2026 (`FIPE_API_TOKEN`, secret do Supabase). Testado: com token o limite é 1000/dia (sem token, 500); `Authorization: Bearer` e `X-Subscription-Token` funcionam; token inválido dá 401 (a function futura precisa tratar e cair para modo sem token).
- CSP: `public/_headers` (`connect-src`) precisa listar `https://fipe.parallelum.com.br`, senão a página só mostra erro no site publicado (achado 08/10/2026; no localhost não aparece). A v1 `parallelum.com.br` (home) segue fora do CSP.
- Migrar `fipe-auditoria-modelo-versao` e `Consignment.tsx` da v1 para a v2.
- Motos e caminhões: só trocar `cars` por `motorcycles`/`trucks` e acrescentar um seletor.
- SEO: o site é SPA, e robôs que não rodam JS veem a página vazia. Uma página só
  não deve ser prometida como fonte de tráfego.
- Lista de modelos grande (VW, 549) deixou a aba lenta nos testes em modo de
  desenvolvimento; reavaliar no site publicado e, se necessário, trocar o `Select`
  por uma lista filtrada com limite de itens.

## Becos sem saída

- Auditar a página da Webmotors: bloqueio de robôs (403 "Access denied"), inclusive com User-Agent de navegador.
- Espelhar a FIPE no banco: ver "Volume" acima.

## FIPE do estoque — Fase 1 (09/10/2026)

Mecanismo que guarda o valor FIPE de cada veículo **disponível**, mês a mês. NÃO altera `veiculos`.

- Function `fipe-atualizar-estoque` (`verify_jwt = false`, valida `x-internal-secret`), cron
  `fipe-atualizar-estoque-cron-job` todo dia 10:00 UTC (07h Brasília). Usa o secret `FIPE_API_TOKEN`
  (1000 consultas/dia; se a API devolver 401, cai para modo sem token e avisa no WhatsApp).
- Fluxo: `/references` (1 chamada) → veículos disponíveis sem valor `ok` no mês mais recente → se não há, termina sem
  gravar nada. Senão, por veículo: `/cars/{codigo}/years` (acha o código do ano, ex. `2023-5`, usando ano do modelo e,
  se ambíguo, o combustível) + preço do mês atual + preço do mês anterior (histórico e trava de variação).
- Tabelas (RLS: service_role escreve, autenticados leem): `fipe_valores_veiculo` (único por veículo + mês;
  `situacao` ok/revisar + `motivo`) e `fipe_estoque_execucoes` (1 linha por execução que fez algo).
- Trava: variação > 15% contra o mês anterior, ano ambíguo, código não achado ou valor zero → `revisar`, nunca chuta.
  Linha `revisar` só é consultada de novo após 7 dias.
- Orçamento: para em 110 s e marca `parcial` (retoma no dia seguinte); pausa de 800 ms entre chamadas.
- Alerta WhatsApp (dono = `social_configuracoes.whatsapp_number`): mês novo concluído, execução parcial, token recusado
  ou itens para revisar. Erro: no máximo 1 aviso a cada 20 h. `alerta_enviado` registra se a Meta aceitou — texto
  livre só chega dentro da janela de 24 h da conversa, então confira se o aviso realmente chegou.
- Primeiro teste real (09/10/2026): outubro/2026, 32 processados, 32 ok, 0 revisar, 95 chamadas, maior variação mensal
  3,5%. Conferidos contra a API: ix35 PBB9J82 (R$ 84.079) e F-Pace TCT5A21 (R$ 444.066) — idênticos.
- **Achado:** 26 dos 32 `veiculos.valor_fipe` diferiam da FIPE de outubro (ex.: F-Pace 464.684 → 444.066), ou seja,
  o valor do cadastro é uma foto antiga da consulta paga por placa.

### Fase 2 (não feita — decidir e analisar impacto antes)
Copiar o valor novo para `veiculos.valor_fipe` e `fipe_ref` (com o mês real). Antes: ler `ml-validation.ts`,
`ml-diagnosis.ts`, `ml-sync-advanced.ts` e os gatilhos `trigger_ml_sync_veiculos` / `trigger_wm_sync_veiculos`
(mexer em coluna do veículo pode disparar reenvio de todos os anúncios; se for o caso, suspender com
`SET LOCAL session_replication_role='replica'` dentro de BEGIN/COMMIT).
### Fase 3 (opcional)
"FIPE de <mês>" e histórico no cadastro lendo `fipe_valores_veiculo` (hoje `getFipeHistoryFromDB` lê `fipe_anos`, que
tem 0 linhas); aviso "preço de venda x FIPE" no estoque; migrar `fipe-auditoria-modelo-versao` e `Consignment.tsx` da v1.

### Becos sem saída / cuidados
- MCP do Supabase e `api.supabase.com` deram 502 por alguns minutos (09/10); a CLI (`supabase db query --linked -f`)
  também depende da API de gerenciamento. Esperar e repetir; não insistir em loop curto.
- Chamar a function à mão: `net.http_post` com `x-internal-secret := public.get_internal_service_secret()` e
  `timeout_milliseconds := 150000`; ler `net._http_response`. Isso envia o WhatsApp de verdade.
