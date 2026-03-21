-- =============================================
-- Migration: New booking & client management architecture
-- Run AFTER 001_initial.sql (or on a fresh project)
-- =============================================

-- ── Add fields to counselors ──
ALTER TABLE counselors
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS zoom_link TEXT;

-- ── Add fields to clients ──
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS supabase_user_id UUID,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- ── Modify bookings table ──
-- Drop old constraints and columns, add new ones
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check,
  DROP CONSTRAINT IF EXISTS bookings_session_format_check;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'IN_PERSON',
  ADD COLUMN IF NOT EXISTS donation_amount_cents INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;

-- Migrate session_format → type
UPDATE bookings SET type = UPPER(REPLACE(session_format, 'in_person', 'IN_PERSON'));
UPDATE bookings SET type = 'VIRTUAL' WHERE session_format = 'virtual';

-- Update status values
UPDATE bookings SET status = 'CONFIRMED' WHERE status = 'pending';
UPDATE bookings SET status = 'CONFIRMED' WHERE status = 'confirmed';
UPDATE bookings SET status = 'CANCELLED' WHERE status = 'cancelled';
UPDATE bookings SET status = 'COMPLETED' WHERE status = 'completed';

ALTER TABLE bookings
  ADD CONSTRAINT bookings_type_check CHECK (type IN ('IN_PERSON', 'VIRTUAL')),
  ADD CONSTRAINT bookings_status_check CHECK (status IN ('CONFIRMED', 'CANCELLED', 'COMPLETED'));

-- Drop old columns no longer needed
ALTER TABLE bookings
  DROP COLUMN IF EXISTS session_format,
  DROP COLUMN IF EXISTS meeting_link,
  DROP COLUMN IF EXISTS meeting_id,
  DROP COLUMN IF EXISTS meeting_passcode;

-- ── Session notes (1:1 with completed bookings) ──
CREATE TABLE IF NOT EXISTS session_notes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  counselor_id  UUID NOT NULL REFERENCES counselors(id),
  content       TEXT NOT NULL DEFAULT '',
  private_notes TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── HIPAA intake forms ──
CREATE TABLE IF NOT EXISTS hipaa_intakes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token        TEXT NOT NULL UNIQUE,
  completed_at TIMESTAMPTZ,
  form_data    JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS for new tables ──
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_intakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage session_notes"
  ON session_notes FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage hipaa_intakes"
  ON hipaa_intakes FOR ALL USING (auth.role() = 'service_role');

-- Allow public insert for intake form submission
CREATE POLICY "Anyone can read their intake by token"
  ON hipaa_intakes FOR SELECT USING (true);

CREATE POLICY "Anyone can submit intake"
  ON hipaa_intakes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update intake by token"
  ON hipaa_intakes FOR UPDATE USING (true);

-- ── Update counselor seed data with contact info ──
UPDATE counselors SET
  email = 'astickles@noheartleftbehind.com',
  phone = '985-264-8808'
WHERE name = 'Amanda Stickles';
