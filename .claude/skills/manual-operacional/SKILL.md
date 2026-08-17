---
name: manual-operacional
description: Conduz a criação e atualização do Manual Operacional do Sistema (artigos da Central de Ajuda, tabela ajuda_conteudos) de forma guiada, setor por setor, sempre investigando a página real do painel antes de escrever qualquer coisa. Use esta skill sempre que a Adriana pedir pra "criar o manual", "escrever um artigo de ajuda", "documentar" uma tela/fluxo do painel administrativo, perguntar "o que falta documentar" ou "por onde eu começo o manual", ou mencionar a Central de Ajuda, `/admin/ajuda` ou `ajuda_conteudos` no contexto de produzir conteúdo novo (não de simplesmente consultar um artigo já existente).
---

# Manual Operacional do Sistema

Conduz a Adriana (dona da revenda, não é desenvolvedora) na escrita dos
artigos da Central de Ajuda do painel administrativo (`/admin/ajuda`,
tabela `ajuda_conteudos`), um de cada vez, com aprovação dela em cada etapa.
Não é pra despejar vários artigos de uma vez sem supervisão — é um processo
conduzido, igual uma entrevista.

A regra de fundo (por quê isso existe): o painel já teve telas que
pareciam funcionar mas eram só fachada — nenhum dado salvava de verdade.
Três foram encontradas e removidas em 17/08/2026 (ver seção "Backlog" em
`docs/manual-operacional-contexto.md`). Documentar uma tela sem confirmar
como ela funciona hoje arrisca ensinar um fluxo que não existe. Por isso o
passo de investigação (etapa 3 abaixo) nunca pode ser pulado, mesmo que a
página pareça óbvia pelo nome do menu.

## Arquivos de referência (ler ao vivo, não confiar em versão antiga)

- **`docs/manual-operacional-contexto.md`** — inventário de todas as
  páginas do sistema por setor: o que cada uma faz, sub-fluxos sugeridos
  pra documentar, complexidade (🟢🟡🔴) e se já tem artigo (coluna
  "Manual"). É o checklist principal de "o que falta escrever" — sempre
  ler antes de sugerir por onde começar, e sempre atualizar depois de
  salvar um artigo.
- **`CLAUDE.md`**, seção "Manual Operacional do Sistema" — schema oficial
  dos campos do artigo e a regra de manutenção contínua (toda função
  nova/ajustada no painel precisa de artigo correspondente).
- **`src/lib/setor-acesso.ts`** — mapa rota → setor(es). Usar pra
  descobrir o `setor_id` certo do artigo (buscar o nome do setor na tabela
  `setores` do Supabase, projeto `htpcqdbhktmvppfemnad`).
- Artigo já existente como referência de nível de detalhe: buscar em
  `ajuda_conteudos` por título "Criar Usuário no Painel" (setor
  Desenvolvedor e TI) se precisar de exemplo de tom/formato.

## Passo a passo

### 1. Mostrar o que falta

Ler `docs/manual-operacional-contexto.md` e listar pra Adriana as linhas
sem ✅ na coluna Manual, agrupadas por setor. Não despejar a tabela
inteira crua — resumir de forma que dê pra ela escolher rápido (ex.: "no
setor Vendas faltam 3: CRM, Conversador e Agendamentos — qual desses, ou
prefere outro setor?").

### 2. Deixar ela escolher

Sem impor ordem. Ela pode pedir por setor ("vamos fazer Vendas todo") ou
por página específica ("documenta o CRM"). Se pedir um setor inteiro,
sugerir começar pela página de menor complexidade (🟢) do grupo, mas
perguntar antes de assumir.

### 3. Investigar a página de verdade — nunca pular

Antes de escrever qualquer campo, ler o componente React real da rota
escolhida (usar `src/lib/setor-acesso.ts` ou o `App.tsx` pra achar o
arquivo) e confirmar:

- O fluxo realmente salva dado em alguma tabela do Supabase, ou é
  aparência (`setTimeout` fake, estado que nunca é persistido, mock)?
- Os passos que a tela pede pra usuária seguir batem com o que o código
  faz de fato?
- Existe alguma dependência (permissão de setor, outro cadastro que
  precisa existir antes, integração externa) que precisa constar no campo
  `dependencias`?

**Se a investigação revelar que a página é mock/quebrada** (como as 3 já
removidas), **parar e avisar a Adriana** em vez de documentar como se
funcionasse. Não é decisão da skill remover a tela — só reportar o
achado e esperar orientação, do mesmo jeito que aconteceu da última vez.

### 4. Escrever o artigo junto com ela

Preencher os campos do schema oficial (ver `CLAUDE.md`):

| Campo | O que vai lá |
|---|---|
| `titulo` | Nome do fluxo, não da tela (ex.: "Emitir Contrato de Consignação", não "Página Administrativo") |
| `setor_id` | Setor dono do fluxo (buscar id em `setores` pelo nome mapeado em `setor-acesso.ts`) |
| `categoria` | Módulo do sistema |
| `caminho` | Rota no painel (ex.: `/admin/crm`) |
| `o_que_e` | Explicação curta, sem jargão técnico |
| `para_que_serve` | Por que esse fluxo existe / que problema resolve |
| `quando_utilizar` | Gatilho — quando a pessoa deveria estar nessa tela |
| `como_utilizar` | Passo a passo real, testável — o que foi confirmado na investigação, não o que parece óbvio |
| `dependencias` | O que precisa existir antes (cadastro prévio, permissão de setor, integração ligada) |

Linguagem sempre simples — quem vai ler é uma vendedora ou um gerente, não
um programador. Evitar termos como "componente", "state", "endpoint";
descrever em termos de tela, botão, campo.

Mostrar o rascunho completo pra ela antes de salvar. Perguntar
explicitamente se pode salvar — não presumir aprovação por silêncio.

### 5. Salvar

Só depois da aprovação: inserir o registro em `ajuda_conteudos` via
Supabase (nível `admin_master`/`gerente` exigido por RLS — a sessão logada
da Adriana já tem isso).

### 6. Atualizar o checklist

Editar a linha correspondente em `docs/manual-operacional-contexto.md`,
trocando `—` por `✅ "Título do Artigo"` na coluna Manual. Se o artigo
cobriu só parte dos sub-fluxos listados, deixar claro no texto da célula
quais ainda faltam (não marcar ✅ se sobrou fluxo sem documentar).

## O que essa skill NÃO faz

- Não decide sozinha remover ou "consertar" uma tela mock encontrada no
  caminho — só reporta e pausa.
- Não salva artigo sem aprovação explícita da Adriana.
- Não documenta setor sem página dedicada (ex.: Consórcio, Seguros,
  Treinamentos hoje) — nesses casos, avisar que não há o que documentar
  ainda e seguir em frente.
