-- V18__billing_and_announcement_extensions.sql

-- Add columns to water_bills table
ALTER TABLE water_bills
ADD COLUMN billing_start_date DATE,
ADD COLUMN billing_end_date DATE;

-- Add columns to announcements table
ALTER TABLE announcements
ADD COLUMN priority VARCHAR(50) DEFAULT 'NORMAL',
ADD COLUMN audience VARCHAR(100) DEFAULT 'Entire Community',
ADD COLUMN target_buildings VARCHAR(255),
ADD COLUMN target_flats VARCHAR(255),
ADD COLUMN target_residents VARCHAR(255);
