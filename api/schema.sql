-- EduConnect MySQL schema (Hostinger / phpMyAdmin)
--
-- Hostinger steps:
-- 1) hPanel → MySQL Databases → create database + user (already done by Hostinger)
-- 2) phpMyAdmin → left side pe APNA database select karo
-- 3) top pe "SQL" tab → ye pura file copy-paste → Go
--    OR "Import" tab → schema.sql upload
--
-- NOTE: CREATE DATABASE / USE yahan nahi hai — Hostinger pe pehle se selected DB use hoti hai.

-- Students (registration: name, college, branch, phone, email)
CREATE TABLE IF NOT EXISTS students (
  id            VARCHAR(64)  NOT NULL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  email         VARCHAR(160) NOT NULL,
  college_name  VARCHAR(200) NOT NULL,
  branch        VARCHAR(120) NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_students_email (email),
  UNIQUE KEY uq_students_phone (phone)
) ENGINE=InnoDB;

-- Campus / college login accounts
CREATE TABLE IF NOT EXISTS college_accounts (
  id            VARCHAR(64)  NOT NULL PRIMARY KEY,
  college_name  VARCHAR(200) NOT NULL,
  contact_name  VARCHAR(120) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  email         VARCHAR(160) NOT NULL,
  branch        VARCHAR(200) NOT NULL DEFAULT '',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_college_accounts_email (email)
) ENGINE=InnoDB;

-- Catalog: streams
CREATE TABLE IF NOT EXISTS streams (
  id         VARCHAR(64)  NOT NULL PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  slug       VARCHAR(140) NOT NULL,
  hint       VARCHAR(255) NOT NULL DEFAULT '',
  UNIQUE KEY uq_streams_slug (slug)
) ENGINE=InnoDB;

-- Catalog: programs (Diploma / B.Tech / M.Tech…)
CREATE TABLE IF NOT EXISTS programs (
  id         VARCHAR(64)  NOT NULL PRIMARY KEY,
  stream_id  VARCHAR(64)  NOT NULL,
  name       VARCHAR(120) NOT NULL,
  slug       VARCHAR(140) NOT NULL,
  UNIQUE KEY uq_programs_slug (slug),
  CONSTRAINT fk_programs_stream
    FOREIGN KEY (stream_id) REFERENCES streams(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- College listings (pending until Super Admin approves)
CREATE TABLE IF NOT EXISTS colleges (
  id                VARCHAR(64)  NOT NULL PRIMARY KEY,
  slug              VARCHAR(160) NOT NULL,
  name              VARCHAR(200) NOT NULL,
  type              ENUM('government','semi-government','private') NOT NULL DEFAULT 'private',
  city              VARCHAR(120) NOT NULL,
  location          VARCHAR(255) NOT NULL DEFAULT '',
  principal_name    VARCHAR(120) NOT NULL DEFAULT '',
  fees_structure    TEXT         NOT NULL,
  about             TEXT         NOT NULL,
  share_url         VARCHAR(255) NOT NULL DEFAULT '',
  admission_status  ENUM('open','closed') NOT NULL DEFAULT 'open',
  approval_status   ENUM('approved','pending','rejected') NOT NULL DEFAULT 'pending',
  submitted_by      ENUM('admin','student','college') NOT NULL DEFAULT 'student',
  submitted_by_id   VARCHAR(64)  NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_colleges_slug (slug),
  KEY idx_colleges_approval (approval_status),
  KEY idx_colleges_type (type)
) ENGINE=InnoDB;

-- Many-to-many: college ↔ catalog programs
CREATE TABLE IF NOT EXISTS college_programs (
  college_id  VARCHAR(64) NOT NULL,
  program_id  VARCHAR(64) NOT NULL,
  PRIMARY KEY (college_id, program_id),
  CONSTRAINT fk_cp_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_program FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Custom / other programs (one name per row — MBA, Nursing…)
CREATE TABLE IF NOT EXISTS college_custom_programs (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  college_id  VARCHAR(64)  NOT NULL,
  name        VARCHAR(120) NOT NULL,
  CONSTRAINT fk_ccp_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Program-wise fees
CREATE TABLE IF NOT EXISTS college_fees (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  college_id      VARCHAR(64)  NOT NULL,
  program_label   VARCHAR(120) NOT NULL,
  amount          VARCHAR(200) NOT NULL,
  CONSTRAINT fk_fees_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Branches
CREATE TABLE IF NOT EXISTS college_branches (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  college_id  VARCHAR(64)  NOT NULL,
  name        VARCHAR(120) NOT NULL,
  CONSTRAINT fk_branches_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Campus images (store relative path or full URL)
CREATE TABLE IF NOT EXISTS college_images (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  college_id  VARCHAR(64)  NOT NULL,
  image_url   TEXT         NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  CONSTRAINT fk_images_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Take Admission applications
CREATE TABLE IF NOT EXISTS applications (
  id            VARCHAR(64)  NOT NULL PRIMARY KEY,
  college_id    VARCHAR(64)  NOT NULL,
  college_slug  VARCHAR(160) NOT NULL,
  college_name  VARCHAR(200) NOT NULL,
  student_name  VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  branch        VARCHAR(120) NOT NULL,
  message       TEXT         NOT NULL,
  status        ENUM('submitted','under-review','shortlisted','rejected') NOT NULL DEFAULT 'submitted',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_applications_email (email),
  KEY idx_applications_college (college_id),
  CONSTRAINT fk_app_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Super Admin (simple password hash — change default ASAP)
CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(80)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admins_username (username)
) ENGINE=InnoDB;

-- Default admin: username `admin`, password `admin123` (CHANGE THIS)
INSERT INTO admins (username, password_hash)
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE username = username;
-- Note: hash above is Laravel's "password" demo hash.
-- Generate your own: password_hash('admin123', PASSWORD_DEFAULT)

-- Seed streams / programs (optional demo)
INSERT INTO streams (id, name, slug, hint) VALUES
  ('stream-engineering', 'Engineering', 'engineering', 'B.Tech · Diploma · M.Tech'),
  ('stream-medical', 'Medical', 'medical', 'MBBS · Nursing · Pharmacy'),
  ('stream-management', 'Management', 'management', 'BBA · MBA · Commerce'),
  ('stream-arts', 'Arts & Design', 'arts-design', 'BA · Fine Arts · Media')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO programs (id, stream_id, name, slug) VALUES
  ('prog-btech', 'stream-engineering', 'B.Tech', 'btech'),
  ('prog-diploma', 'stream-engineering', 'Diploma', 'diploma'),
  ('prog-mtech', 'stream-engineering', 'M.Tech', 'mtech')
ON DUPLICATE KEY UPDATE name = VALUES(name);
