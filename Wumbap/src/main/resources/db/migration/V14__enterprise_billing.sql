-- V14__enterprise_billing.sql

-- 1. Create tariffs table
CREATE TABLE tariffs (
    id BIGSERIAL PRIMARY KEY,
    community_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(50) NOT NULL, -- FIXED, PER_UNIT, SLAB
    base_charge NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00, -- Water Unit Price
    minimum_charge NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    service_charge NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    maintenance_charge NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    sewage_charge NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    late_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    penalty NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    subsidy NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    billing_cycle VARCHAR(50) NOT NULL DEFAULT 'MONTHLY', -- MONTHLY, BI_MONTHLY, QUARTERLY
    due_days INTEGER NOT NULL DEFAULT 15,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tariff_community
        FOREIGN KEY (community_id)
            REFERENCES communities(id)
            ON DELETE CASCADE
);

CREATE INDEX idx_tariffs_community ON tariffs(community_id);

-- 2. Create tariff slabs table for tiered rates
CREATE TABLE tariff_slabs (
    id BIGSERIAL PRIMARY KEY,
    tariff_id BIGINT NOT NULL,
    range_start NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    range_end NUMERIC(12,2), -- NULL means infinity
    rate_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT fk_slab_tariff
        FOREIGN KEY (tariff_id)
            REFERENCES tariffs(id)
            ON DELETE CASCADE
);

CREATE INDEX idx_slabs_tariff ON tariff_slabs(tariff_id);

-- 3. Extend water_bills table with enterprise billing columns
ALTER TABLE water_bills
ADD COLUMN bill_number VARCHAR(50) UNIQUE,
ADD COLUMN invoice_number VARCHAR(50) UNIQUE,
ADD COLUMN tariff_model VARCHAR(50) DEFAULT 'PER_UNIT',
ADD COLUMN previous_reading NUMERIC(12,2) DEFAULT 0.00,
ADD COLUMN current_reading NUMERIC(12,2) DEFAULT 0.00,
ADD COLUMN service_charge NUMERIC(12,2) DEFAULT 0.00,
ADD COLUMN maintenance_charge NUMERIC(12,2) DEFAULT 0.00,
ADD COLUMN sewage_charge NUMERIC(12,2) DEFAULT 0.00,
ADD COLUMN penalty NUMERIC(12,2) DEFAULT 0.00,
ADD COLUMN subsidy_amount NUMERIC(12,2) DEFAULT 0.00,
ADD COLUMN revision_count INTEGER DEFAULT 0,
ADD COLUMN notes TEXT,
ADD COLUMN tariff_id BIGINT,
ADD COLUMN generated_by VARCHAR(150);

-- 4. Create bill revisions table to keep history of changes
CREATE TABLE bill_revisions (
    id BIGSERIAL PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    revision_number INTEGER NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    tax_amount NUMERIC(12,2) NOT NULL,
    late_fee NUMERIC(12,2) NOT NULL,
    penalty NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) NOT NULL,
    subsidy_amount NUMERIC(12,2) NOT NULL,
    revised_by VARCHAR(150) NOT NULL,
    reason TEXT NOT NULL,
    revised_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_revision_bill
        FOREIGN KEY (bill_id)
            REFERENCES water_bills(id)
            ON DELETE CASCADE
);

CREATE INDEX idx_revisions_bill ON bill_revisions(bill_id);
