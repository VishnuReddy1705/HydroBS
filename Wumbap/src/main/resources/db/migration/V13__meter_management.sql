-- V13__meter_management.sql

CREATE TABLE IF NOT EXISTS meters (
    id BIGSERIAL PRIMARY KEY,
    meter_number VARCHAR(100) NOT NULL UNIQUE,
    qr_code VARCHAR(255),
    barcode VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    meter_type VARCHAR(50) NOT NULL DEFAULT 'MECHANICAL',
    installation_date DATE,
    calibration_date DATE,
    last_service_date DATE,
    next_service_date DATE,
    community_id BIGINT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    resident_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meters_number ON meters(meter_number);
CREATE INDEX IF NOT EXISTS idx_meters_community ON meters(community_id);

ALTER TABLE meter_readings ADD COLUMN IF NOT EXISTS is_anomaly BOOLEAN DEFAULT FALSE;
ALTER TABLE meter_readings ADD COLUMN IF NOT EXISTS anomaly_type VARCHAR(100);
ALTER TABLE meter_readings ADD COLUMN IF NOT EXISTS anomaly_notes VARCHAR(255);
