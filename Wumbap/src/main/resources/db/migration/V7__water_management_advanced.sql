-- ========================================================
-- V7__water_management_advanced.sql
-- ========================================================

-- Calendar Events Table
CREATE TABLE calendar_events (
    id BIGSERIAL PRIMARY KEY,
    community_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- UPLOAD_JOB, SUBMISSION, BILL_GEN, DUE_DATE, REMINDER
    reference_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT fk_calendar_community
        FOREIGN KEY (community_id)
            REFERENCES communities(id)
            ON DELETE CASCADE
);

CREATE INDEX idx_calendar_events_community_date 
    ON calendar_events(community_id, event_date);

-- Notifications Table
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    community_id BIGINT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- READING_UPLOADED, BILL_GENERATED, HIGH_USAGE, LOW_USAGE, SPIKE_DETECTED, REPORT_READY, READING_MISSING
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_notifications_community
        FOREIGN KEY (community_id)
            REFERENCES communities(id)
            ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user 
    ON notifications(user_id);

-- Usage Archives Table (for weekly, monthly, yearly snapshots)
CREATE TABLE usage_archives (
    id BIGSERIAL PRIMARY KEY,
    community_id BIGINT NOT NULL,
    resident_id BIGINT, -- If NULL, represents the whole community average/total
    period_type VARCHAR(20) NOT NULL, -- WEEK, MONTH, YEAR
    period_identifier VARCHAR(50) NOT NULL, -- e.g. '2026-W28', '2026-07', '2026'
    total_usage_litres NUMERIC(12,2) NOT NULL,
    average_daily_usage NUMERIC(12,2) NOT NULL,
    peak_usage_litres NUMERIC(12,2),
    lowest_usage_litres NUMERIC(12,2),
    created_at TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT fk_usage_archives_community
        FOREIGN KEY (community_id)
            REFERENCES communities(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_usage_archives_resident
        FOREIGN KEY (resident_id)
            REFERENCES users(id)
            ON DELETE CASCADE
);

CREATE INDEX idx_usage_archives_lookup 
    ON usage_archives(community_id, resident_id, period_type, period_identifier);
