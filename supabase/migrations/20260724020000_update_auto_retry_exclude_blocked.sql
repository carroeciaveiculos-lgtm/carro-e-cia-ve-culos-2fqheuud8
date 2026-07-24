CREATE OR REPLACE FUNCTION public.auto_retry_stuck_ml_listings()
RETURNS void AS $$
BEGIN
  UPDATE public.ml_listings
  SET status = CASE
    WHEN ml_item_id IS NOT NULL THEN 'pending_update'
    ELSE 'pending_create'
  END,
  last_synced_at = now()
  WHERE status IN ('pending_create', 'pending_update')
    AND status <> 'blocked'
    AND last_synced_at < now() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
