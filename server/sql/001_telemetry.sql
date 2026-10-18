-- MARISLINK: Intelligent Underwater Acoustic Communication & Digital Twin
-- Database Migration: 001_telemetry.sql
-- Target: Supabase PostgreSQL

-- 1. Create telemetry_readings table
CREATE TABLE IF NOT EXISTS telemetry_readings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  node_id TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  depth_m NUMERIC(8, 2),
  temperature_c NUMERIC(5, 2),
  pressure_mpa NUMERIC(8, 2),
  battery_level NUMERIC(5, 2),
  signal_strength NUMERIC(6, 2),
  latency_ms NUMERIC(8, 2),
  packet_loss NUMERIC(5, 2),
  communication_status TEXT,
  node_status TEXT,
  source TEXT NOT NULL DEFAULT 'simulation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validation constraints
  CONSTRAINT chk_node_id_not_empty CHECK (length(trim(node_id)) > 0),
  CONSTRAINT chk_battery_level CHECK (battery_level IS NULL OR (battery_level >= 0 AND battery_level <= 100)),
  CONSTRAINT chk_packet_loss CHECK (packet_loss IS NULL OR (packet_loss >= 0 AND packet_loss <= 100)),
  CONSTRAINT chk_depth_m CHECK (depth_m IS NULL OR depth_m >= 0)
);

-- 2. Performance indexes for time-series and node-level querying
CREATE INDEX IF NOT EXISTS idx_telemetry_node_recorded_at
  ON telemetry_readings (node_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_recorded_at
  ON telemetry_readings (recorded_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE telemetry_readings ENABLE ROW LEVEL SECURITY;

-- 4. RLS Access Policies
-- Unrestricted public write is explicitly disallowed.
-- Read access: Anyone can read telemetry for monitoring (or restrict to authenticated if preferred)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'telemetry_readings' AND policyname = 'Allow read telemetry'
  ) THEN
    CREATE POLICY "Allow read telemetry"
      ON telemetry_readings
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Write access: In Supabase, the backend server uses SUPABASE_SECRET_KEY / service_role
-- which bypasses RLS by default. If using an authenticated user token:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'telemetry_readings' AND policyname = 'Allow service role insert'
  ) THEN
    CREATE POLICY "Allow service role insert"
      ON telemetry_readings
      FOR INSERT
      WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');
  END IF;
END $$;
