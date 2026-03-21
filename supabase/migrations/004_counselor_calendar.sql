-- =============================================
-- Migration 004: Counselor calendar & blocked dates
-- =============================================

-- ── Link counselors to Supabase auth users ──
ALTER TABLE counselors
  ADD COLUMN IF NOT EXISTS supabase_user_id UUID UNIQUE;

-- ── Blocked dates (vacation, sick days, one-off unavailability) ──
CREATE TABLE IF NOT EXISTS counselor_blocked_dates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  counselor_id  UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  blocked_date  DATE NOT NULL,
  start_time    TIME,
  end_time      TIME,
  reason        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- If start_time/end_time are NULL, the entire day is blocked.
-- If set, only that time window is blocked.

CREATE UNIQUE INDEX IF NOT EXISTS idx_blocked_dates_unique
  ON counselor_blocked_dates (counselor_id, blocked_date, COALESCE(start_time, '00:00'), COALESCE(end_time, '23:59'));

-- ── RLS ──
ALTER TABLE counselor_blocked_dates ENABLE ROW LEVEL SECURITY;

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

-- ── Allow counselors to read their own bookings ──
CREATE POLICY "Counselors can read own bookings"
  ON bookings FOR SELECT
  USING (counselor_id IN (
    SELECT id FROM counselors WHERE supabase_user_id = auth.uid()
  ));

-- ── Allow counselors to update own bookings (mark complete, add notes) ──
CREATE POLICY "Counselors can update own bookings"
  ON bookings FOR UPDATE
  USING (counselor_id IN (
    SELECT id FROM counselors WHERE supabase_user_id = auth.uid()
  ));

-- ── Allow counselors to read clients for their bookings ──
CREATE POLICY "Counselors can read clients from own bookings"
  ON clients FOR SELECT
  USING (id IN (
    SELECT client_id FROM bookings WHERE counselor_id IN (
      SELECT id FROM counselors WHERE supabase_user_id = auth.uid()
    )
  ));

-- ── Allow counselors to manage their own availability ──
CREATE POLICY "Counselors can manage own availability"
  ON availability_slots FOR ALL
  USING (counselor_id IN (
    SELECT id FROM counselors WHERE supabase_user_id = auth.uid()
  ));

-- ── Allow counselors to manage session notes for own bookings ──
CREATE POLICY "Counselors can manage own session notes"
  ON session_notes FOR ALL
  USING (counselor_id IN (
    SELECT id FROM counselors WHERE supabase_user_id = auth.uid()
  ));
