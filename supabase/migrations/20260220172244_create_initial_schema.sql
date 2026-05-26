/*
  # AI CCTV Test Security Platform - Initial Schema

  ## Overview
  This migration creates the foundational database structure for the AI CCTV platform that helps test security investigators identify and review potential cheating incidents in testing center video recordings.

  ## 1. New Tables
  
  ### `user_profiles`
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `role` (text) - User role: internal_investigator, internal_case_manager, external_case_manager, admin
  - `organization` (text) - Organization/client they belong to
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `programs`
  - `id` (uuid, primary key) - Program identifier
  - `name` (text) - Program name (e.g., "SAT", "GRE", "MCAT")
  - `description` (text) - Program description
  - `client_organization` (text) - Client organization name
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `testing_centers`
  - `id` (uuid, primary key) - Testing center identifier
  - `name` (text) - Center name
  - `location` (text) - City/region
  - `country` (text) - Country
  - `address` (text) - Full address
  - `timezone` (text) - Timezone
  - `created_at` (timestamptz) - Creation timestamp

  ### `videos`
  - `id` (uuid, primary key) - Video identifier
  - `program_id` (uuid, foreign key) - Associated program
  - `testing_center_id` (uuid, foreign key) - Testing center where recorded
  - `test_date` (date) - Date of test administration
  - `session_id` (text) - Test session identifier
  - `video_url` (text) - URL to video file
  - `duration_seconds` (integer) - Video duration
  - `status` (text) - processing, ready, flagged, reviewed
  - `total_violations` (integer) - Count of detected violations
  - `reviewed_violations` (integer) - Count of reviewed violations
  - `metadata` (jsonb) - Additional metadata
  - `created_at` (timestamptz) - Upload timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `violation_types`
  - `id` (uuid, primary key) - Violation type identifier
  - `code` (text, unique) - Short code (e.g., "PHONE", "NOTES", "TALKING")
  - `name` (text) - Display name
  - `description` (text) - Detailed description
  - `severity` (text) - low, medium, high, critical
  - `color` (text) - UI color code for display
  - `created_at` (timestamptz) - Creation timestamp

  ### `violations`
  - `id` (uuid, primary key) - Violation identifier
  - `video_id` (uuid, foreign key) - Associated video
  - `violation_type_id` (uuid, foreign key) - Type of violation
  - `timestamp_seconds` (integer) - Time in video where violation occurs
  - `confidence_score` (numeric) - AI confidence (0-1)
  - `status` (text) - pending, confirmed, rejected, needs_review
  - `ai_metadata` (jsonb) - Additional AI detection data
  - `thumbnail_url` (text) - Screenshot of violation moment
  - `created_at` (timestamptz) - Detection timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `adjudications`
  - `id` (uuid, primary key) - Adjudication identifier
  - `violation_id` (uuid, foreign key) - Violation being reviewed
  - `reviewer_id` (uuid, foreign key) - User who reviewed
  - `decision` (text) - confirmed, rejected, escalated
  - `notes` (text) - Reviewer notes
  - `reviewed_at` (timestamptz) - Review timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Policies restrict access based on user roles and organization
  - Admins can view all data
  - External users can only view data from their organization
  - Internal users can view all client data

  ## 3. Indexes
  - Performance indexes on frequently queried columns
  - Foreign key indexes for joins
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('internal_investigator', 'internal_case_manager', 'external_case_manager', 'admin')),
  organization text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  client_organization text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view programs"
  ON programs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage programs"
  ON programs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Create testing_centers table
CREATE TABLE IF NOT EXISTS testing_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  country text NOT NULL,
  address text,
  timezone text DEFAULT 'UTC',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE testing_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view testing centers"
  ON testing_centers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage testing centers"
  ON testing_centers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  testing_center_id uuid NOT NULL REFERENCES testing_centers(id) ON DELETE CASCADE,
  test_date date NOT NULL,
  session_id text NOT NULL,
  video_url text NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'flagged', 'reviewed')),
  total_violations integer DEFAULT 0,
  reviewed_violations integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_videos_program_id ON videos(program_id);
CREATE INDEX IF NOT EXISTS idx_videos_testing_center_id ON videos(testing_center_id);
CREATE INDEX IF NOT EXISTS idx_videos_test_date ON videos(test_date);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal users can view all videos"
  ON videos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('internal_investigator', 'internal_case_manager', 'admin')
    )
  );

CREATE POLICY "External users can view their organization videos"
  ON videos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN programs ON programs.client_organization = user_profiles.organization
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'external_case_manager'
      AND programs.id = videos.program_id
    )
  );

-- Create violation_types table
CREATE TABLE IF NOT EXISTS violation_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  color text DEFAULT '#f59e0b',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE violation_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view violation types"
  ON violation_types FOR SELECT
  TO authenticated
  USING (true);

-- Create violations table
CREATE TABLE IF NOT EXISTS violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  violation_type_id uuid NOT NULL REFERENCES violation_types(id) ON DELETE CASCADE,
  timestamp_seconds integer NOT NULL,
  confidence_score numeric(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'needs_review')),
  ai_metadata jsonb DEFAULT '{}'::jsonb,
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_violations_video_id ON violations(video_id);
CREATE INDEX IF NOT EXISTS idx_violations_type_id ON violations(violation_type_id);
CREATE INDEX IF NOT EXISTS idx_violations_status ON violations(status);
CREATE INDEX IF NOT EXISTS idx_violations_timestamp ON violations(timestamp_seconds);

ALTER TABLE violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view violations for accessible videos"
  ON violations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM videos
      WHERE videos.id = violations.video_id
      AND (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('internal_investigator', 'internal_case_manager', 'admin')
        )
        OR EXISTS (
          SELECT 1 FROM user_profiles
          JOIN programs ON programs.client_organization = user_profiles.organization
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role = 'external_case_manager'
          AND programs.id = videos.program_id
        )
      )
    )
  );

-- Create adjudications table
CREATE TABLE IF NOT EXISTS adjudications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_id uuid NOT NULL REFERENCES violations(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('confirmed', 'rejected', 'escalated')),
  notes text,
  reviewed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adjudications_violation_id ON adjudications(violation_id);
CREATE INDEX IF NOT EXISTS idx_adjudications_reviewer_id ON adjudications(reviewer_id);

ALTER TABLE adjudications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view adjudications for accessible violations"
  ON adjudications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM violations
      JOIN videos ON videos.id = violations.video_id
      WHERE violations.id = adjudications.violation_id
      AND (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('internal_investigator', 'internal_case_manager', 'admin')
        )
        OR EXISTS (
          SELECT 1 FROM user_profiles
          JOIN programs ON programs.client_organization = user_profiles.organization
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role = 'external_case_manager'
          AND programs.id = videos.program_id
        )
      )
    )
  );

CREATE POLICY "Investigators can create adjudications"
  ON adjudications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('internal_investigator', 'internal_case_manager', 'external_case_manager')
    )
  );

-- Insert default violation types
INSERT INTO violation_types (code, name, description, severity, color) VALUES
  ('PHONE', 'Mobile Phone Use', 'Test taker using or accessing a mobile phone during the exam', 'critical', '#dc2626'),
  ('NOTES', 'Unauthorized Notes', 'Test taker using or referencing unauthorized notes or materials', 'high', '#ea580c'),
  ('TALKING', 'Verbal Communication', 'Test taker talking or communicating with others', 'high', '#d97706'),
  ('LOOKING', 'Suspicious Looking', 'Test taker looking at another test taker''s materials', 'medium', '#f59e0b'),
  ('WRITING', 'Writing on Materials', 'Test taker writing on unauthorized materials', 'medium', '#eab308'),
  ('LEAVING', 'Unauthorized Absence', 'Test taker leaving designated area without permission', 'medium', '#84cc16'),
  ('DEVICE', 'Electronic Device', 'Test taker using unauthorized electronic device (calculator, smartwatch)', 'critical', '#dc2626'),
  ('GESTURE', 'Suspicious Gestures', 'Test taker making suspicious hand signals or gestures', 'low', '#3b82f6')
ON CONFLICT (code) DO NOTHING;