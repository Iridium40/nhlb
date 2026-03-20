CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Counselors ──
CREATE TABLE counselors (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  title         TEXT NOT NULL,
  bio           TEXT,
  photo_url     TEXT,
  specialties   TEXT[] DEFAULT '{}',
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Availability windows per counselor ──
CREATE TABLE availability_slots (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  counselor_id  UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  day_of_week   INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  is_active     BOOLEAN DEFAULT true
);

-- ── Clients (intake info) ──
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  service_type  TEXT NOT NULL CHECK (service_type IN ('individual', 'marriage', 'family')),
  brief_reason  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Bookings ──
CREATE TABLE bookings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  counselor_id      UUID NOT NULL REFERENCES counselors(id),
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  INT DEFAULT 60,
  session_format    TEXT NOT NULL DEFAULT 'in_person' CHECK (session_format IN ('in_person', 'virtual')),
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  meeting_link      TEXT,
  meeting_id        TEXT,
  meeting_passcode  TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Donations (love offerings) ──
CREATE TABLE donations (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id                UUID REFERENCES bookings(id) ON DELETE SET NULL,
  client_id                 UUID REFERENCES clients(id) ON DELETE SET NULL,
  amount_cents              INT NOT NULL,
  stripe_payment_intent_id  TEXT UNIQUE,
  stripe_status             TEXT DEFAULT 'pending',
  message                   TEXT,
  is_anonymous              BOOLEAN DEFAULT false,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──
ALTER TABLE counselors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active counselors"
  ON counselors FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active slots"
  ON availability_slots FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can create a client record"
  ON clients FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can create a booking"
  ON bookings FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage bookings"
  ON bookings FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can create a donation"
  ON donations FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage donations"
  ON donations FOR ALL USING (auth.role() = 'service_role');

-- ── Seed counselors ──
INSERT INTO counselors (name, title, bio, specialties) VALUES
  (
    'Amanda Stickles',
    'Licensed Professional Counselor',
    'Founder of NHLB with a heart for restoring families through faith-based counseling.',
    ARRAY['marriage', 'family', 'individual', 'trauma']
  ),
  (
    'Team Counselor',
    'Biblical Counselor',
    'Certified counselor committed to bringing healing through the Word of God.',
    ARRAY['individual', 'grief', 'anxiety']
  );

-- ── Seed availability (Mon–Fri 9am–5pm for Amanda) ──
INSERT INTO availability_slots (counselor_id, day_of_week, start_time, end_time)
SELECT c.id, d.day, '09:00'::TIME, '17:00'::TIME
FROM counselors c, (VALUES (1),(2),(3),(4),(5)) AS d(day)
WHERE c.name = 'Amanda Stickles';
