-- Migration: Remove UNIQUE constraint on device_id
-- Purpose: Allow same device_id to be used across multiple ambulances
-- Date: 2024

-- Drop the UNIQUE constraint on device_id
ALTER TABLE ambulance_devices DROP INDEX device_id;

-- The regular index idx_device_id is kept for query performance
-- This allows multiple ambulances to share the same device_id (e.g., GPS trackers)
