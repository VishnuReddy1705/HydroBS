-- V17__receipts_and_refunds.sql
-- Migration to support receipts, refunds, payment reversals, and offline payments.

CREATE TABLE receipts (
    id BIGSERIAL PRIMARY KEY,
    receipt_number VARCHAR(100) NOT NULL UNIQUE,
    payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    bill_id BIGINT NOT NULL REFERENCES water_bills(id) ON DELETE CASCADE,
    resident_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id BIGINT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    generated_at TIMESTAMP NOT NULL,
    pdf_path VARCHAR(255),
    status VARCHAR(50) NOT NULL
);

CREATE TABLE refunds (
    id BIGSERIAL PRIMARY KEY,
    refund_number VARCHAR(100) NOT NULL UNIQUE,
    payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    bill_id BIGINT NOT NULL REFERENCES water_bills(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    requested_by_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    requested_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP,
    notes TEXT
);

-- Extend payments table with receipt reference, offline notes, and reversal details
ALTER TABLE payments ADD COLUMN receipt_number VARCHAR(100);
ALTER TABLE payments ADD COLUMN notes TEXT;
ALTER TABLE payments ADD COLUMN reversed_at TIMESTAMP;
ALTER TABLE payments ADD COLUMN reversal_reason VARCHAR(255);

-- Indexes for performance on critical query fields
CREATE INDEX idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX idx_receipts_resident_id ON receipts(resident_id);
CREATE INDEX idx_receipts_community_id ON receipts(community_id);
CREATE INDEX idx_refunds_refund_number ON refunds(refund_number);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
