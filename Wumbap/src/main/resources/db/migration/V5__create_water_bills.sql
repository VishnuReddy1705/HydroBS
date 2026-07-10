CREATE TABLE water_bills (

                             id BIGSERIAL PRIMARY KEY,

                             resident_id BIGINT NOT NULL,

                             community_id BIGINT NOT NULL,

                             billing_month DATE NOT NULL,

                             total_usage NUMERIC(12,2) NOT NULL,

                             amount NUMERIC(12,2) NOT NULL,

                             status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',

                             generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                             due_date DATE,

                             paid_at TIMESTAMP,

                             CONSTRAINT fk_bill_resident
                                 FOREIGN KEY (resident_id)
                                     REFERENCES users(id),

                             CONSTRAINT fk_bill_community
                                 FOREIGN KEY (community_id)
                                     REFERENCES communities(id)
);

CREATE UNIQUE INDEX uq_bill_month
    ON water_bills(resident_id, billing_month);