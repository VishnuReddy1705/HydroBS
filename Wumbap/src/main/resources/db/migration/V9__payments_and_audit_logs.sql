-- ========================================================
-- V9__payments_and_audit_logs.sql
-- ========================================================

-- Payments Table
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    paid_at TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT fk_payments_bill
        FOREIGN KEY (bill_id)
            REFERENCES water_bills(id)
            ON DELETE CASCADE
);

CREATE INDEX idx_payments_bill ON payments(bill_id);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_email VARCHAR(150) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
