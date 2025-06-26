-- Migration: Add last_notified_status column to service_status table
-- This column will track the last status that we sent a notification for
-- to prevent duplicate notifications for the same status

-- Step 1: Add the new column (nullable initially)
ALTER TABLE service_status 
ADD COLUMN last_notified_status TEXT;

-- Step 2: Initialize the column with current status values
-- This ensures that existing services won't trigger notifications immediately
UPDATE service_status 
SET last_notified_status = status 
WHERE last_notified_status IS NULL;

-- Step 3: Add a check constraint to ensure only valid status values
ALTER TABLE service_status 
ADD CONSTRAINT check_last_notified_status 
CHECK (last_notified_status IN ('operational', 'degraded', 'outage', 'incident', 'maintenance', 'unknown'));

-- Optional: Add an index for performance if you have many services
CREATE INDEX IF NOT EXISTS idx_service_status_last_notified ON service_status(last_notified_status);

-- Verify the changes
SELECT service_slug, status, last_notified_status 
FROM service_status 
ORDER BY service_slug; 