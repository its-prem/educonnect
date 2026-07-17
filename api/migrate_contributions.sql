-- Run once in phpMyAdmin if college_contributions table is missing
-- (needed for student photo/edit requests)

CREATE TABLE IF NOT EXISTS college_contributions (
  id             VARCHAR(64)  NOT NULL PRIMARY KEY,
  college_id     VARCHAR(64)  NOT NULL,
  college_slug   VARCHAR(160) NOT NULL,
  college_name   VARCHAR(200) NOT NULL,
  student_id     VARCHAR(64)  NULL,
  student_name   VARCHAR(120) NOT NULL DEFAULT '',
  student_email  VARCHAR(160) NOT NULL DEFAULT '',
  student_phone  VARCHAR(20)  NOT NULL DEFAULT '',
  images         LONGTEXT     NOT NULL,
  edits          LONGTEXT     NOT NULL,
  note           TEXT         NOT NULL,
  status         ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at    DATETIME     NULL,
  KEY idx_contrib_status (status),
  KEY idx_contrib_college (college_id),
  CONSTRAINT fk_contrib_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- If students table has no college_id yet:
-- ALTER TABLE students ADD COLUMN college_id VARCHAR(64) NULL AFTER college_name;
-- ALTER TABLE students ADD KEY idx_students_college (college_id);
