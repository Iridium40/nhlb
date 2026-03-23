-- =============================================
-- NHLB — Full idempotent schema
-- Safe to run multiple times. Drops and rebuilds everything.
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ╔═══════════════════════════════════════════╗
-- ║  SCHEMA PERMISSIONS                       ║
-- ╚═══════════════════════════════════════════╝

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ╔═══════════════════════════════════════════╗
-- ║  TEARDOWN (reverse dependency order)      ║
-- ╚═══════════════════════════════════════════╝

DROP TABLE IF EXISTS counselor_blocked_dates CASCADE;
DROP TABLE IF EXISTS session_notes CASCADE;
DROP TABLE IF EXISTS hipaa_intakes CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS availability_slots CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS counselors CASCADE;

-- ╔═══════════════════════════════════════════╗
-- ║  TABLES                                   ║
-- ╚═══════════════════════════════════════════╝

-- ── Counselors ──
CREATE TABLE counselors (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  title            TEXT NOT NULL,
  bio              TEXT,
  photo_url        TEXT,
  specialties      TEXT[] DEFAULT '{}',
  is_active        BOOLEAN DEFAULT true,
  email            TEXT,
  phone            TEXT,
  zoom_link        TEXT,
  zoom_meeting_id  TEXT,
  zoom_passcode    TEXT,
  supabase_user_id UUID UNIQUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Availability slots ──
CREATE TABLE availability_slots (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  counselor_id  UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  day_of_week   INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  is_active     BOOLEAN DEFAULT true
);

-- ── Clients ──
CREATE TABLE clients (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name            TEXT NOT NULL,
  last_name             TEXT NOT NULL,
  email                 TEXT NOT NULL,
  phone                 TEXT,
  service_type          TEXT NOT NULL,
  brief_reason          TEXT,
  supabase_user_id      UUID,
  stripe_customer_id    TEXT,
  assigned_counselor_id UUID REFERENCES counselors(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── Bookings ──
CREATE TABLE bookings (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id            UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  counselor_id         UUID NOT NULL REFERENCES counselors(id),
  scheduled_at         TIMESTAMPTZ NOT NULL,
  duration_minutes     INT DEFAULT 60,
  type                 TEXT NOT NULL DEFAULT 'IN_PERSON' CHECK (type IN ('IN_PERSON', 'VIRTUAL')),
  status               TEXT DEFAULT 'requested' CHECK (status IN ('requested','call_pending','call_complete','confirmed','in_session','completed','cancelled')),
  donation_amount_cents INT DEFAULT 0,
  stripe_payment_id    TEXT,
  notes                TEXT,
  pre_call_notes       TEXT,
  session_notes        TEXT,
  call_completed_at    TIMESTAMPTZ,
  call_completed_by    TEXT,
  is_recurring         BOOLEAN DEFAULT false,
  recurrence_pattern   TEXT CHECK (recurrence_pattern IN ('weekly', 'biweekly', 'monthly') OR recurrence_pattern IS NULL),
  recurrence_end_date  TIMESTAMPTZ,
  parent_booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  series_index         INT DEFAULT 1,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── Session notes ──
CREATE TABLE session_notes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  counselor_id  UUID NOT NULL REFERENCES counselors(id),
  content       TEXT NOT NULL DEFAULT '',
  private_notes TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── HIPAA intake forms ──
CREATE TABLE hipaa_intakes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token        TEXT NOT NULL UNIQUE,
  completed_at TIMESTAMPTZ,
  form_data    JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Events ──
CREATE TABLE events (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                    TEXT NOT NULL,
  description              TEXT,
  event_date               TIMESTAMPTZ NOT NULL,
  end_date                 TIMESTAMPTZ,
  location                 TEXT,
  registration_fee_cents   INT DEFAULT 0,
  fee_label                TEXT DEFAULT 'Registration Fee',
  max_capacity             INT,
  is_active                BOOLEAN DEFAULT true,
  image_url                TEXT,
  custom_fields            JSONB DEFAULT '[]',
  slug                     TEXT UNIQUE,
  is_published             BOOLEAN DEFAULT false,
  registration_opens_at    TIMESTAMPTZ,
  registration_closes_at   TIMESTAMPTZ,
  min_capacity             INT,
  cancellation_deadline    TIMESTAMPTZ,
  cancellation_reason      TEXT,
  cancelled_at             TIMESTAMPTZ,
  min_check_sent_at        TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ── Event registrations ──
CREATE TABLE event_registrations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  custom_data         JSONB DEFAULT '{}',
  amount_paid_cents   INT DEFAULT 0,
  stripe_payment_id   TEXT,
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  refunded_at         TIMESTAMPTZ,
  refund_amount_cents INT,
  stripe_refund_id    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Donations ──
CREATE TABLE donations (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id                UUID REFERENCES bookings(id) ON DELETE SET NULL,
  client_id                 UUID REFERENCES clients(id) ON DELETE SET NULL,
  amount_cents              INT NOT NULL,
  stripe_payment_intent_id  TEXT UNIQUE,
  stripe_status             TEXT DEFAULT 'pending',
  message                   TEXT,
  is_anonymous              BOOLEAN DEFAULT false,
  fund                      TEXT DEFAULT 'GENERAL' CHECK (fund IN ('COUNSELING', 'OPERATIONS', 'EVENTS', 'GENERAL')),
  donor_name                TEXT,
  donor_email               TEXT,
  event_id                  UUID REFERENCES events(id) ON DELETE SET NULL,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ── Counselor blocked dates ──
CREATE TABLE counselor_blocked_dates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  counselor_id  UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  blocked_date  DATE NOT NULL,
  start_time    TIME,
  end_time      TIME,
  reason        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_blocked_dates_unique
  ON counselor_blocked_dates (counselor_id, blocked_date, COALESCE(start_time, '00:00'), COALESCE(end_time, '23:59'));


-- ╔═══════════════════════════════════════════╗
-- ║  GRANT TABLE ACCESS                       ║
-- ╚═══════════════════════════════════════════╝

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ╔═══════════════════════════════════════════╗
-- ║  ROW LEVEL SECURITY                       ║
-- ╚═══════════════════════════════════════════╝

ALTER TABLE counselors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots      ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_intakes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselor_blocked_dates ENABLE ROW LEVEL SECURITY;

-- ── counselors ──
CREATE POLICY "Public can read active counselors"
  ON counselors FOR SELECT USING (is_active = true);

-- ── availability_slots ──
CREATE POLICY "Public can read active slots"
  ON availability_slots FOR SELECT USING (is_active = true);

CREATE POLICY "Counselors can manage own availability"
  ON availability_slots FOR ALL
  USING (counselor_id IN (
    SELECT id FROM counselors WHERE supabase_user_id = auth.uid()
  ));

-- ── clients ──
CREATE POLICY "Anyone can create a client record"
  ON clients FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage clients"
  ON clients FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Counselors can read clients from own bookings"
  ON clients FOR SELECT
  USING (id IN (
    SELECT client_id FROM bookings WHERE counselor_id IN (
      SELECT id FROM counselors WHERE supabase_user_id = auth.uid()
    )
  ));

-- ── bookings ──
CREATE POLICY "Anyone can create a booking"
  ON bookings FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage bookings"
  ON bookings FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Counselors can read own bookings"
  ON bookings FOR SELECT
  USING (counselor_id IN (
    SELECT id FROM counselors WHERE supabase_user_id = auth.uid()
  ));

CREATE POLICY "Counselors can update own bookings"
  ON bookings FOR UPDATE
  USING (counselor_id IN (
    SELECT id FROM counselors WHERE supabase_user_id = auth.uid()
  ));

-- ── donations ──
CREATE POLICY "Anyone can create a donation"
  ON donations FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage donations"
  ON donations FOR ALL USING (auth.role() = 'service_role');

-- ── session_notes ──
CREATE POLICY "Service role can manage session_notes"
  ON session_notes FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Counselors can manage own session notes"
  ON session_notes FOR ALL
  USING (counselor_id IN (
    SELECT id FROM counselors WHERE supabase_user_id = auth.uid()
  ));

-- ── hipaa_intakes ──
CREATE POLICY "Service role can manage hipaa_intakes"
  ON hipaa_intakes FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can read their intake by token"
  ON hipaa_intakes FOR SELECT USING (true);

CREATE POLICY "Anyone can submit intake"
  ON hipaa_intakes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update intake by token"
  ON hipaa_intakes FOR UPDATE USING (true);

-- ── events ──
CREATE POLICY "Public can read active events"
  ON events FOR SELECT USING (is_active = true);

CREATE POLICY "Service role manages events"
  ON events FOR ALL USING (auth.role() = 'service_role');

-- ── event_registrations ──
CREATE POLICY "Anyone can register for events"
  ON event_registrations FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role manages registrations"
  ON event_registrations FOR ALL USING (auth.role() = 'service_role');

-- ── counselor_blocked_dates ──
CREATE POLICY "Service role manages blocked dates"
  ON counselor_blocked_dates FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Counselors can read own blocked dates"
  ON counselor_blocked_dates FOR SELECT
  USING (counselor_id IN (
    SELECT id FROM counselors WHERE supabase_user_id = auth.uid()
  ));

CREATE POLICY "Counselors can insert own blocked dates"
  ON counselor_blocked_dates FOR INSERT
  WITH CHECK (counselor_id IN (
    SELECT id FROM counselors WHERE supabase_user_id = auth.uid()
  ));

CREATE POLICY "Counselors can delete own blocked dates"
  ON counselor_blocked_dates FOR DELETE
  USING (counselor_id IN (
    SELECT id FROM counselors WHERE supabase_user_id = auth.uid()
  ));


-- ╔═══════════════════════════════════════════╗
-- ║  SEED DATA                                ║
-- ╚═══════════════════════════════════════════╝

INSERT INTO counselors (name, title, bio, email, phone, specialties)
VALUES (
  'Alicia Stickles',
  'Licensed Professional Counselor',
  'Founder of NHLB with a heart for restoring families through faith-based counseling.',
  'astickles@noheartleftbehind.com',
  '985-264-8808',
  ARRAY['marriage', 'family', 'individual', 'trauma']
);

INSERT INTO counselors (name, title, bio, specialties)
VALUES (
  'Team Counselor',
  'Biblical Counselor',
  'Certified counselor committed to bringing healing through the Word of God.',
  ARRAY['individual', 'grief', 'anxiety']
);

-- Mon–Fri 9am–5pm availability for Amanda
INSERT INTO availability_slots (counselor_id, day_of_week, start_time, end_time)
SELECT c.id, d.day, '09:00'::TIME, '17:00'::TIME
FROM counselors c, (VALUES (1),(2),(3),(4),(5)) AS d(day)
WHERE c.name = 'Amanda Stickles';


-- ╔═══════════════════════════════════════════╗
-- ║  SEARCH FUNCTIONS                         ║
-- ╚═══════════════════════════════════════════╝

-- Search HIPAA intake form_data (JSONB cast to text)
CREATE OR REPLACE FUNCTION search_hipaa_intakes(search_term TEXT)
RETURNS TABLE(client_id UUID) AS $$
  SELECT DISTINCT h.client_id
  FROM hipaa_intakes h
  WHERE h.completed_at IS NOT NULL
    AND h.form_data::TEXT ILIKE search_term;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Search session notes content
CREATE OR REPLACE FUNCTION search_session_notes(search_term TEXT)
RETURNS TABLE(client_id UUID) AS $$
  SELECT DISTINCT b.client_id
  FROM session_notes sn
  JOIN bookings b ON b.id = sn.booking_id
  WHERE sn.content ILIKE search_term;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Grant execute to supabase roles
GRANT EXECUTE ON FUNCTION search_hipaa_intakes(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION search_session_notes(TEXT) TO anon, authenticated, service_role;
