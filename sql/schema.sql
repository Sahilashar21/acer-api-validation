DROP TABLE IF EXISTS cycles CASCADE;
DROP TABLE IF EXISTS upload_logs CASCADE;

CREATE TABLE cycles (
  id BIGSERIAL PRIMARY KEY,
  sr_no VARCHAR(50) NULL,
  serial_number VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  is_validated BOOLEAN NOT NULL DEFAULT FALSE,
  validated_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cycles_serial_number ON cycles (serial_number);
CREATE INDEX idx_cycles_name ON cycles (name);
CREATE INDEX idx_cycles_sr_no ON cycles (sr_no);

CREATE TABLE upload_logs (
  id BIGSERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  inserted INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
