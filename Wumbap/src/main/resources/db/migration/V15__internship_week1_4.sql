-- V15__internship_week1_4.sql

-- 1. Add flat_area to users table
ALTER TABLE users ADD COLUMN flat_area NUMERIC(12,2) DEFAULT 0.00;

-- 1b. Add fallback_method and shared_area_percentage to tariffs table
ALTER TABLE tariffs ADD COLUMN fallback_method VARCHAR(50) DEFAULT 'OCCUPANCY';
ALTER TABLE tariffs ADD COLUMN shared_area_percentage NUMERIC(5,2) DEFAULT 10.00;

-- 2. Add is_archived to notifications table
ALTER TABLE notifications ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Create billing_cycles table
CREATE TABLE billing_cycles (
    id BIGSERIAL PRIMARY KEY,
    community_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- OPEN, ACTIVE, FINALIZED, ARCHIVED
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_billing_cycle_community
        FOREIGN KEY (community_id)
            REFERENCES communities(id)
            ON DELETE CASCADE
);

CREATE INDEX idx_billing_cycles_community ON billing_cycles(community_id);

-- 4. Create bulk_water_purchases table
CREATE TABLE bulk_water_purchases (
    id BIGSERIAL PRIMARY KEY,
    community_id BIGINT NOT NULL,
    supplier VARCHAR(150) NOT NULL,
    purchase_date DATE NOT NULL,
    volume_litres NUMERIC(12,2) NOT NULL,
    unit_cost NUMERIC(12,2) NOT NULL,
    total_cost NUMERIC(12,2) NOT NULL,
    invoice_reference VARCHAR(100) NOT NULL,
    billing_cycle_id BIGINT,
    remarks TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bulk_purchase_community
        FOREIGN KEY (community_id)
            REFERENCES communities(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_bulk_purchase_cycle
        FOREIGN KEY (billing_cycle_id)
            REFERENCES billing_cycles(id)
            ON DELETE SET NULL
);

CREATE INDEX idx_bulk_purchases_community ON bulk_water_purchases(community_id);
CREATE INDEX idx_bulk_purchases_cycle ON bulk_water_purchases(billing_cycle_id);

-- 5. Extend water_bills table with billing_cycle_id
ALTER TABLE water_bills ADD COLUMN billing_cycle_id BIGINT;
ALTER TABLE water_bills ADD CONSTRAINT fk_bill_cycle FOREIGN KEY (billing_cycle_id) REFERENCES billing_cycles(id) ON DELETE SET NULL;
CREATE INDEX idx_water_bills_cycle ON water_bills(billing_cycle_id);
