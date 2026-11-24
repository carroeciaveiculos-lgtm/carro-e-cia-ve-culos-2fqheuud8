-- 24/11/2026 (B1, autorizado pela Adriana): a tabela de backup da fase 4
-- (modelo/versão) tinha FK sem ON DELETE para veiculos, o que impedia excluir
-- qualquer veículo que estivesse no backup (Audi PQE7D92, Land Rover FJK7E17).
-- Backup é histórico: precisa sobreviver à exclusão do veículo, então o vínculo
-- é removido e as 26 linhas ficam intactas.
-- Rollback: ALTER TABLE public.veiculos_modelo_versao_backup_fase4
--   ADD CONSTRAINT veiculos_modelo_versao_backup_fase4_veiculo_id_fkey
--   FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id) NOT VALID;
ALTER TABLE public.veiculos_modelo_versao_backup_fase4
  DROP CONSTRAINT IF EXISTS veiculos_modelo_versao_backup_fase4_veiculo_id_fkey;
