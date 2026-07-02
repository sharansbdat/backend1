-- Comprehensive database schema for SIDCMS Express backend
-- Copy and run this script in your Supabase SQL Editor to initialize all tables.

-- 1. Create schools table
CREATE TABLE IF NOT EXISTS schools (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(200) NOT NULL,
  address        TEXT,
  phone          VARCHAR(20),
  email          VARCHAR(100),
  logo_url       TEXT,
  logo_public_id TEXT,
  status         VARCHAR(20) DEFAULT 'active',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id         SERIAL PRIMARY KEY,
  school_id  INT REFERENCES schools(id) ON DELETE SET NULL,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  role       VARCHAR(20) DEFAULT 'school',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create students table
CREATE TABLE IF NOT EXISTS students (
  id              SERIAL PRIMARY KEY,
  school_id       INT REFERENCES schools(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  roll_no         VARCHAR(50) NOT NULL,
  class           VARCHAR(50),
  section         VARCHAR(10) DEFAULT 'A',
  father_name     VARCHAR(100),
  phone           VARCHAR(20),
  email           VARCHAR(100),
  address         TEXT,
  dob             DATE,
  blood_group     VARCHAR(10),
  gender          VARCHAR(20),
  photo_url       TEXT,
  photo_public_id TEXT,
  student_id      VARCHAR(50),
  enrollment_year VARCHAR(10),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_student_roll UNIQUE(roll_no, school_id)
);

-- 4. Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id             SERIAL PRIMARY KEY,
  class_name     VARCHAR(100) NOT NULL,
  class_teacher  VARCHAR(255),
  room_number    VARCHAR(50),
  academic_year  VARCHAR(20) NOT NULL,
  description    TEXT,
  section        VARCHAR(50) DEFAULT 'A',
  grade_level    VARCHAR(50),
  status         VARCHAR(50) DEFAULT 'Active',
  max_students   INT DEFAULT 50,
  school_id      INT REFERENCES schools(id) ON DELETE CASCADE,
  created_by     INT REFERENCES admins(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_class_academic_school UNIQUE(class_name, academic_year, school_id)
);

-- 5. Create staff sequence and table
CREATE SEQUENCE IF NOT EXISTS staff_emp_id_seq;

CREATE TABLE IF NOT EXISTS staff (
  id              SERIAL PRIMARY KEY,
  school_id       INT REFERENCES schools(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  emp_id          VARCHAR(50) UNIQUE NOT NULL DEFAULT 'EMP-' || LPAD(nextval('staff_emp_id_seq')::TEXT, 5, '0'),
  type            VARCHAR(20) NOT NULL,
  department      VARCHAR(100),
  subject         VARCHAR(100),
  phone           VARCHAR(20),
  email           VARCHAR(100),
  address         TEXT,
  doj             DATE,
  photo_url       TEXT,
  photo_public_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create forms table
CREATE TABLE IF NOT EXISTS forms (
  id             SERIAL PRIMARY KEY,
  form_id        VARCHAR(100) UNIQUE NOT NULL,
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  has_photo      BOOLEAN DEFAULT FALSE,
  field_data     JSONB,
  status         VARCHAR(50) DEFAULT 'Active',
  school_id      INT REFERENCES schools(id) ON DELETE CASCADE,
  created_by     INT REFERENCES admins(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id              SERIAL PRIMARY KEY,
  form_id         VARCHAR(100) REFERENCES forms(form_id) ON DELETE CASCADE,
  submission_data JSONB,
  photo_data      TEXT,
  submitted_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Default data seeding
-- ============================================

-- Insert default school (ID = 1) if not exists
INSERT INTO schools (id, name, address, phone, email, status)
VALUES (
  1,
  'ABC School',
  '123 Main Street, City',
  '+1234567890',
  'admin@abcschool.com',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Sync school ID sequence so SERIAL starts at 2
SELECT setval(pg_get_serial_sequence('schools', 'id'), COALESCE(MAX(id), 1)) FROM schools;

-- Insert default admin linked to school ID 1 (username: admin@abcschool.com, password: admin123)
INSERT INTO admins (name, email, password, role, school_id)
VALUES (
  'Admin User',
  'admin@abcschool.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lihC',
  'admin',
  1
) ON CONFLICT (email) DO NOTHING;