-- V6__billing_and_admin_advancements.sql

-- Add columns to communities table
ALTER TABLE communities 
ADD COLUMN tariff_rate NUMERIC(12,2) NOT NULL DEFAULT 5.00,
ADD COLUMN tax_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
ADD COLUMN late_fee_rate NUMERIC(12,2) NOT NULL DEFAULT 50.00,
ADD COLUMN discount_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00;

-- Add columns to water_bills table
ALTER TABLE water_bills 
ADD COLUMN tariff_rate NUMERIC(12,2) NOT NULL DEFAULT 5.00,
ADD COLUMN tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN late_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00;

-- Add is_active status column to users table
ALTER TABLE users 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
