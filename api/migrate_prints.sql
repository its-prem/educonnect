-- Secure PDF printing tables (Hostinger phpMyAdmin)
-- Select your database first, then Import / run this SQL.

CREATE TABLE IF NOT EXISTS print_pdfs (
  id                VARCHAR(64)    NOT NULL PRIMARY KEY,
  title             VARCHAR(255)   NOT NULL,
  price_per_credit  DECIMAL(10,2)  NOT NULL DEFAULT 0,
  file_path         VARCHAR(512)   NOT NULL,
  enabled           TINYINT(1)     NOT NULL DEFAULT 1,
  created_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_print_pdfs_enabled (enabled)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS print_orders (
  id                  VARCHAR(64)    NOT NULL PRIMARY KEY,
  student_id          VARCHAR(64)    NOT NULL,
  pdf_id              VARCHAR(64)    NOT NULL,
  credits             INT UNSIGNED   NOT NULL,
  amount              DECIMAL(10,2)  NOT NULL,
  cashfree_order_id   VARCHAR(120)   NOT NULL,
  payment_session_id  VARCHAR(255)   NULL,
  status              ENUM('pending','paid','failed') NOT NULL DEFAULT 'pending',
  created_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at             DATETIME       NULL,
  KEY idx_print_orders_student (student_id),
  KEY idx_print_orders_cf (cashfree_order_id),
  KEY idx_print_orders_status (status),
  CONSTRAINT fk_print_orders_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_print_orders_pdf FOREIGN KEY (pdf_id) REFERENCES print_pdfs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS print_purchases (
  id                  VARCHAR(64)    NOT NULL PRIMARY KEY,
  student_id          VARCHAR(64)    NOT NULL,
  pdf_id              VARCHAR(64)    NOT NULL,
  credits_total       INT UNSIGNED   NOT NULL DEFAULT 0,
  credits_used        INT UNSIGNED   NOT NULL DEFAULT 0,
  amount_paid         DECIMAL(10,2)  NOT NULL DEFAULT 0,
  cashfree_order_id   VARCHAR(120)   NULL,
  status              ENUM('pending','paid','failed') NOT NULL DEFAULT 'paid',
  purchased_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_print_purchase_student_pdf (student_id, pdf_id),
  KEY idx_print_purchases_student (student_id),
  KEY idx_print_purchases_pdf (pdf_id),
  CONSTRAINT fk_print_purchases_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_print_purchases_pdf FOREIGN KEY (pdf_id) REFERENCES print_pdfs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS print_logs (
  id                VARCHAR(64)    NOT NULL PRIMARY KEY,
  student_id        VARCHAR(64)    NOT NULL,
  pdf_id            VARCHAR(64)    NOT NULL,
  purchase_id       VARCHAR(64)    NOT NULL,
  print_number      INT UNSIGNED   NOT NULL,
  printer_name      VARCHAR(200)   NOT NULL DEFAULT '',
  remaining_after   INT UNSIGNED   NOT NULL,
  printed_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_print_logs_student (student_id),
  KEY idx_print_logs_pdf (pdf_id),
  KEY idx_print_logs_purchase (purchase_id),
  CONSTRAINT fk_print_logs_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_print_logs_pdf FOREIGN KEY (pdf_id) REFERENCES print_pdfs(id) ON DELETE CASCADE,
  CONSTRAINT fk_print_logs_purchase FOREIGN KEY (purchase_id) REFERENCES print_purchases(id) ON DELETE CASCADE
) ENGINE=InnoDB;
