# Integridade de migrations e deploys no Supabase

Como manter o histórico de migrations e os crons do banco consistentes — e o
que já deu errado, pra não reinvestigar do zero.

## Regras

1. **Nunca `execute_sql` direto pra mudança de schema ou cron.** Sempre via
   migration (`apply_migration` do MCP, ou `supabase db push`). É o que
   deixa rastro no histórico (`supabase_migrations.schema_migrations`).
   Mudança de schema fora de migration é invisível e irrecuperável numa
   reconstrução do banco a partir dos arquivos.

2. **Depois de aplicar uma migration via MCP, sempre conferir**
   (`supabase migration list`, ou o tool `list_migrations`) **e renomear o
   arquivo local** pro timestamp real que o banco registrou. A ferramenta
   MCP carimba o momento em que rodou, não a data escrita no nome do
   arquivo — nunca assumir que "aplicou" = "sincronizado".

3. **Antes de criar um cron novo, checar se já existe um**
   (`select * from cron.job`). Renomear/reagendar é `cron.alter_job` ou
   unschedule-e-recriar-com-mesmo-nome — nunca criar um job com nome
   diferente e deixar o antigo pra trás rodando em paralelo.

4. **Antes de reparo ou qualquer operação em lote no histórico de
   migrations, testar num item só primeiro, ou tirar backup.**
   `supabase migration repair --status reverted <versão>` **apaga** a
   linha inteira da tabela de controle — inclusive o texto original do SQL
   que rodou (coluna `statements`) — sem chance de desfazer. Reparo com
   `--status applied` exige um arquivo local com aquele timestamp pra
   funcionar (lê o nome dali); sem arquivo, só dá pra inserir a versão+nome
   direto por SQL, sem recuperar o texto original.

5. **Antes de propor qualquer mudança em produção (migration, deploy,
   config), rodar autocrítica proativa** ("o que um especialista crítico
   atacaria nisso?") antes de apresentar — sem esperar ser perguntado. Três
   perguntas específicas:
   - Informação reaproveitada de uma investigação anterior ainda vale pro
     objetivo atual, ou só valia pro objetivo original?
   - Uma busca que não achou nada — que escopo exato foi buscado? "Não
     achei evidência" não é o mesmo que "não existe".
   - A proposta nova é consistente com o que já foi afirmado antes na
     mesma conversa, ou contradiz um princípio já declarado?

## Becos sem saída (o que já foi tentado/descoberto)

- **`supabase db pull` e `supabase db dump` exigem Docker Desktop rodando
  localmente** (usam um "banco espelho" pra calcular a diferença de
  schema). Sem Docker instalado nesta máquina, essas ferramentas
  simplesmente falham — não tem como contornar sem instalar.
- **Migrations aplicadas via MCP (`apply_migration`) recebem timestamp do
  momento em que rodaram, não da hora escrita no nome do arquivo.** Isso
  causou 47 migrations descasadas entre 02/08 e 15/08/2026 — reconciliado
  em 16/08: 26 renomeadas pro timestamp real (conteúdo idêntico, git
  confirma como rename puro), 21 sem arquivo local recuperável ficaram
  documentadas como lacuna conhecida (ver item Docker acima).
- **Timestamp duplicado entre dois arquivos locais diferentes** (achado:
  `20260624000000_crm_improvements.sql` e
  `20260624000000_qr_code_and_realtime.sql`) faz `migration repair` pegar
  o arquivo errado ao tentar registrar uma versão ambígua — sobrescreveu o
  nome do registro correto por engano em 16/08/2026 (corrigido via UPDATE
  direto na tabela de controle, `supabase_migrations.schema_migrations`).
- **A tabela `supabase_migrations.schema_migrations` guarda o SQL real que
  rodou** na coluna `statements` (array) — dá pra comparar com o conteúdo
  do arquivo local pra confirmar que batem antes de renomear um arquivo
  achando que é o mesmo. Verificado em 16/08/2026 pra 26 migrations, achou
  um caso com senha hardcoded no meio (ver regra de segurança no
  `CLAUDE.md`, seção Migrations).
- **Migrations que só existem pra criar/atualizar cron não são idempotentes
  por padrão** — rodar de novo sem `cron.unschedule` prévio pode duplicar
  o job. Ver `20260816113019_remove_duplicate_crons.sql`: dois pares de
  cron duplicados foram encontrados, criados assim (alguém tentou
  renomear/reagendar um job existente e criou um novo em vez de alterar o
  original, sem desligar o antigo).
