-- 008: Events sharing, slug-based URLs, attendance minimums, and registration refunds

-- ── events table additions ──
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS slug                   TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_published           BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_opens_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS registration_closes_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS min_capacity           INT,
  ADD COLUMN IF NOT EXISTS cancellation_deadline  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason    TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS min_check_sent_at      TIMESTAMPTZ;

-- Migrate is_active → is_published for existing rows
UPDATE events SET is_published = is_active WHERE is_published IS NULL;

-- ── event_registrations additions ──
ALTER TABLE event_registrations
  ADD COLUMN IF NOT EXISTS refunded_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_amount_cents   INT,
  ADD COLUMN IF NOT EXISTS stripe_refund_id      TEXT;

-- Widen status constraint to allow both old and new values during migration
ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_status_check;

-- Migrate old uppercase statuses to new lowercase values
UPDATE event_registrations SET status = 'confirmed' WHERE status = 'REGISTERED';
UPDATE event_registrations SET status = 'cancelled' WHERE status = 'CANCELLED';

-- Apply final constraint with all valid lowercase values
ALTER TABLE event_registrations
  ADD CONSTRAINT event_registrations_status_check CHECK (
    status IN ('pending', 'confirmed', 'cancelled', 'refunded')
  );
ALTER TABLE event_registrations ALTER COLUMN status SET DEFAULT 'pending';
