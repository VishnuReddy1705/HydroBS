--------------------------------------------------------
-- Upload Jobs
--------------------------------------------------------

CREATE TABLE upload_jobs (
                             id BIGSERIAL PRIMARY KEY,
                             community_id BIGINT NOT NULL,
                             uploaded_by BIGINT NOT NULL,
                             original_filename VARCHAR(255) NOT NULL,
                             upload_status VARCHAR(20) NOT NULL,
                             total_rows INTEGER NOT NULL DEFAULT 0,
                             successful_rows INTEGER NOT NULL DEFAULT 0,
                             failed_rows INTEGER NOT NULL DEFAULT 0,
                             upload_started_at TIMESTAMP NOT NULL DEFAULT now(),
                             upload_completed_at TIMESTAMP,
                             error_message TEXT,

                             CONSTRAINT fk_upload_job_community
                                 FOREIGN KEY (community_id)
                                     REFERENCES communities(id)
                                     ON DELETE CASCADE,

                             CONSTRAINT fk_upload_job_admin
                                 FOREIGN KEY (uploaded_by)
                                     REFERENCES users(id)
);

--------------------------------------------------------
-- Meter Readings
--------------------------------------------------------

CREATE TABLE meter_readings (
                                id BIGSERIAL PRIMARY KEY,

                                upload_job_id BIGINT NOT NULL,

                                community_id BIGINT NOT NULL,

                                resident_id BIGINT NOT NULL,

                                reading_date DATE NOT NULL,

                                previous_reading NUMERIC(12,2) NOT NULL,

                                current_reading NUMERIC(12,2) NOT NULL,

                                usage_litres NUMERIC(12,2) NOT NULL,

                                created_at TIMESTAMP NOT NULL DEFAULT now(),

                                CONSTRAINT fk_meter_upload
                                    FOREIGN KEY (upload_job_id)
                                        REFERENCES upload_jobs(id)
                                        ON DELETE CASCADE,

                                CONSTRAINT fk_meter_community
                                    FOREIGN KEY (community_id)
                                        REFERENCES communities(id)
                                        ON DELETE CASCADE,

                                CONSTRAINT fk_meter_resident
                                    FOREIGN KEY (resident_id)
                                        REFERENCES users(id)
                                        ON DELETE CASCADE,

                                CONSTRAINT chk_meter_values
                                    CHECK (current_reading >= previous_reading)
);

--------------------------------------------------------
-- Import Errors
--------------------------------------------------------

CREATE TABLE meter_import_errors (
                                     id BIGSERIAL PRIMARY KEY,

                                     upload_job_id BIGINT NOT NULL,

                                     csv_row_number INTEGER NOT NULL,

                                     resident_identifier VARCHAR(100),

                                     error_message TEXT NOT NULL,

                                     created_at TIMESTAMP NOT NULL DEFAULT now(),

                                     CONSTRAINT fk_import_error_upload
                                         FOREIGN KEY (upload_job_id)
                                             REFERENCES upload_jobs(id)
                                             ON DELETE CASCADE
);

--------------------------------------------------------
-- Indexes
--------------------------------------------------------

CREATE INDEX idx_upload_jobs_community
    ON upload_jobs(community_id);

CREATE INDEX idx_meter_readings_community
    ON meter_readings(community_id);

CREATE INDEX idx_meter_readings_date
    ON meter_readings(reading_date);

CREATE INDEX idx_meter_readings_resident
    ON meter_readings(resident_id);

CREATE UNIQUE INDEX uq_daily_meter
    ON meter_readings(resident_id, reading_date);

CREATE INDEX idx_import_errors_upload
    ON meter_import_errors(upload_job_id);