-- =============================================
-- Migration 003: Events, general donations, fund tracking
-- =============================================

-- ── Fund categories for financial reporting ──
-- COUNSELING = love offerings from bookings
-- OPERATIONS = general ministry support
-- EVENTS     = event registration fees
-- GENERAL    = undesignated donations

-- ── Events ──
CREATE TABLE IF NOT EXISTS events (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                TEXT NOT NULL,
  description          TEXT,
  event_date           TIMESTAMPTZ NOT NULL,
  end_date             TIMESTAMPTZ,
  location             TEXT,
  registration_fee_cents INT DEFAULT 0,
  fee_label            TEXT DEFAULT 'Registration Fee',
  max_capacity         INT,
  is_active            BOOLEAN DEFAULT true,
  image_url            TEXT,
  custom_fields        JSONB DEFAULT '[]',
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── Event registrations ──
CREATE TABLE IF NOT EXISTS event_registrations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  custom_data       JSONB DEFAULT '{}',
  amount_paid_cents INT DEFAULT 0,
  stripe_payment_id TEXT,
  status            TEXT DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'CANCELLED')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Rework donations table for general use ──
-- Add fund category and make donor fields standalone (not just client-linked)
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS fund TEXT DEFAULT 'GENERAL'
    CHECK (fund IN ('COUNSELING', 'OPERATIONS', 'EVENTS', 'GENERAL')),
  ADD COLUMN IF NOT EXISTS donor_name TEXT,
  ADD COLUMN IF NOT EXISTS donor_email TEXT,
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;

-- Backfill existing donations: those linked to bookings are COUNSELING
UPDATE donations SET fund = 'COUNSELING' WHERE booking_id IS NOT NULL AND fund = 'GENERAL';

-- ── RLS ──
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active events"
  ON events FOR SELECT USING (is_active = true);

CREATE POLICY "Service role manages events"
  ON events FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can register for events"
  ON event_registrations FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role manages registrations"
  ON event_registrations FOR ALL USING (auth.role() = 'service_role');

-- Update donations policies for new insert pattern
CREATE POLICY "Public can insert donations"
  ON donations FOR INSERT WITH CHECK (true);
