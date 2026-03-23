-- Session lifecycle, recurring bookings, and call-completion metadata.
-- Extends bookings with notes, call completion fields, recurrence, and series
-- linkage. Replaces the legacy status CHECK with the new workflow values.
-- Safe to re-run: IF NOT EXISTS / IF EXISTS; the status constraint is dropped
-- before UPDATEs so new literals are not rejected by the old CHECK, then it
-- is re-created.

-- ── 1. New columns (idempotent) ──
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS pre_call_notes       TEXT,
  ADD COLUMN IF NOT EXISTS session_notes        TEXT,
  ADD COLUMN IF NOT EXISTS call_completed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS call_completed_by    TEXT,
  ADD COLUMN IF NOT EXISTS is_recurring         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_pattern   TEXT CHECK (
    recurrence_pattern IN ('weekly', 'biweekly', 'monthly') OR recurrence_pattern IS NULL
  ),
  ADD COLUMN IF NOT EXISTS recurrence_end_date  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS parent_booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS series_index         INT DEFAULT 1;

-- ── 2. Status: drop old CHECK, migrate values, add new CHECK + default ──
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

UPDATE bookings SET status = 'requested'  WHERE status = 'PENDING';
UPDATE bookings SET status = 'confirmed'  WHERE status = 'CONFIRMED';
UPDATE bookings SET status = 'completed'  WHERE status = 'COMPLETED';
UPDATE bookings SET status = 'cancelled'  WHERE status = 'CANCELLED';

-- Legacy 001_initial lowercase `pending` (not covered by uppercase migrations)
UPDATE bookings SET status = 'requested' WHERE status = 'pending';

ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check CHECK (
    status IN ('requested','call_pending','call_complete','confirmed','in_session','completed','cancelled')
  );

ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'requested';
