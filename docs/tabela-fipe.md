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
