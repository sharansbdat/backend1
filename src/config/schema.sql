-- Run: psql -d sidcms -f src/config/schema.sql

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

CREATE TABLE IF NOT EXISTS admins (
  id         SERIAL PRIMARY KEY,
  school_id  INT REFERENCES schools(id) ON DELETE SET NULL,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  role       VARCHAR(20) DEFAULT 'school',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id              SERIAL PRIMARY KEY,
  school_id       INT REFERENCES schools(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  roll_no         VARCHAR(20),
  class           VARCHAR(20),
  section         VARCHAR(5),
  father_name     VARCHAR(100),
  phone           VARCHAR(20),
  email           VARCHAR(100),
  address         TEXT,
  dob             DATE,
  blood_group     VARCHAR(5),
  gender          VARCHAR(10),
  photo_url       TEXT,
  photo_public_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff (
  id              SERIAL PRIMARY KEY,
  school_id       INT REFERENCES schools(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  emp_id          VARCHAR(30) UNIQUE NOT NULL,
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

-- Default super admin (password: admin123)
INSERT INTO admins (name, email, password, role)
VALUES (
  'Super Admin',
  'admin@sidcms.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lihC',
  'super'
) ON CONFLICT (email) DO NOTHING;