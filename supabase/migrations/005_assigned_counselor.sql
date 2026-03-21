-- Add assigned_counselor_id to clients table
-- Set on first booking so returning clients are locked to their counselor
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'assigned_counselor_id'
  ) THEN
    ALTER TABLE public.clients
      ADD COLUMN assigned_counselor_id UUID REFERENCES counselors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Backfill: for existing clients, set assigned_counselor_id from their earliest non-cancelled booking
UPDATE clients c
SET assigned_counselor_id = sub.counselor_id
FROM (
  SELECT DISTINCT ON (client_id) client_id, counselor_id
  FROM bookings
  WHERE status != 'CANCELLED'
  ORDER BY client_id, scheduled_at ASC
) sub
WHERE c.id = sub.client_id
  AND c.assigned_counselor_id IS NULL;
