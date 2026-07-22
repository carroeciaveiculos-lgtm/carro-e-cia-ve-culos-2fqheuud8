-- Add videos column to veiculos table (idempotent)
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS videos jsonb DEFAULT '[]'::jsonb;

-- Ensure sync_control entry for drive_video_offset
INSERT INTO public.sync_control (sync_key, current_offset, updated_at)
VALUES ('drive_video_offset', 0, NOW())
ON CONFLICT (sync_key) DO NOTHING;
