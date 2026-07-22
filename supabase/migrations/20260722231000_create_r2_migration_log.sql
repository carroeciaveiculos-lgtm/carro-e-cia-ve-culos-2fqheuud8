CREATE TABLE IF NOT EXISTS public.r2_migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL,
  bucket TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  migrated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_r2_migration_log_bucket ON public.r2_migration_log(bucket);
CREATE INDEX IF NOT EXISTS idx_r2_migration_log_status ON public.r2_migration_log(status);

ALTER TABLE public.r2_migration_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_r2_migration_log" ON public.r2_migration_log;
CREATE POLICY "auth_all_r2_migration_log" ON public.r2_migration_log
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_r2_migration_log" ON public.r2_migration_log;
CREATE POLICY "service_role_all_r2_migration_log" ON public.r2_migration_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);
