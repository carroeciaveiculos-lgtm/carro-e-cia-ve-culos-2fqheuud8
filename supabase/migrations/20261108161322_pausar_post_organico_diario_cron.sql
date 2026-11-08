-- 08/11/2026: pausa a rotina antiga (1 rascunho/dia so no Facebook, foto original).
-- Reativar: select cron.alter_job(19, active := true);
select cron.alter_job(19, active := false);
