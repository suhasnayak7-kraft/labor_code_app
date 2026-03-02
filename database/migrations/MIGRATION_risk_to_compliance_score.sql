-- Migration: Rename risk_score → compliance_score and fix storage logic
-- Date: February 28, 2026
-- Purpose: Remove technical debt from inverted score storage

-- Step 1: Add new compliance_score column (to avoid data loss during transition)
ALTER TABLE api_logs
ADD COLUMN compliance_score INT;

-- Step 2: Transform data - invert back to actual compliance score
-- Old logic: stored as risk_score = 100 - compliance_score
-- New logic: store as compliance_score = actual value
UPDATE api_logs
SET compliance_score = 100 - risk_score
WHERE risk_score IS NOT NULL;

-- Step 3: For any NULL risk_score values, set compliance_score to NULL
UPDATE api_logs
SET compliance_score = NULL
WHERE risk_score IS NULL;

-- Step 4: Drop the old risk_score column
ALTER TABLE api_logs
DROP COLUMN risk_score;

-- Step 5: Add comment documenting the change
COMMENT ON COLUMN api_logs.compliance_score IS 'Compliance score (0-100, where 100=fully compliant). Stores actual value, not inverted.';

-- Verification: Check the data was transformed correctly
-- SELECT id, compliance_score, created_at FROM api_logs ORDER BY created_at DESC;
