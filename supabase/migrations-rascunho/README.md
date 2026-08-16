# Migrations rascunho

Migrations que existem, mas **de propósito não ficam** em
`supabase/migrations/` — se ficassem lá, o próximo `supabase db push`
aplicaria elas de verdade, sem ninguém decidir isso primeiro.

Detalhe de cada uma e o que falta pra decidir: ver `MEMORY_WORK.MD`,
pendência 9.

- `desliga_cron_wm_sync.sql` — aguardando o fluxo manual "Sincronizar
  Agora" ser testado de ponta a ponta antes de desligar a sincronização
  automática da Webmotors.
- `crm_improvements.sql` — código morto, candidata a apagar.
