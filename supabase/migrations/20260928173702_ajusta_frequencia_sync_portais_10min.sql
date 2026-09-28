-- Reduz o intervalo dos crons de sync de veiculo/portal de 30 para 10 minutos
-- (pedido direto da Adriana, 28/09/2026 -- sem rate limit documentado em
-- nenhuma das 3 plataformas, verificado antes de aplicar)
do $$
declare
  job record;
begin
  for job in
    select jobid, jobname from cron.job
    where jobname in ('wm-sync-cron-job', 'napista-sync-cron-job', 'ml-sync-cron-job')
  loop
    perform cron.alter_job(job_id := job.jobid, schedule := '*/10 * * * *');
  end loop;
end $$;
