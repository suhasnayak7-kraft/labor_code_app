-- Function to enforce log limits per user tier
CREATE OR REPLACE FUNCTION enforce_api_log_limits()
RETURNS TRIGGER AS $$
DECLARE
    user_plan TEXT;
    max_logs INT;
BEGIN
    -- Get the user's plan from the profile (default to 'free' if missing)
    SELECT COALESCE(LOWER(plan), 'free') INTO user_plan
    FROM profiles
    WHERE id = NEW.user_id;

    -- Determine the limit based on the tiered pricing
    IF user_plan = 'pro' THEN
        max_logs := 50;
    ELSIF user_plan = 'max' OR user_plan = 'enterprise' THEN
        max_logs := 500;
    ELSE
        max_logs := 5; -- 'free' logic overrides
    END IF;

    -- Admin bypass limit (assume Admins have 999 max locally defined, but safely capped to 500 if DB checks)
    -- But since this is specific to log history storage saving, we cap everyone implicitly.

    -- Delete oldest logs exceeding the specific limit for this user
    DELETE FROM api_logs
    WHERE id IN (
        SELECT id 
        FROM api_logs 
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC 
        OFFSET max_logs
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run after every insertion on api_logs
DROP TRIGGER IF EXISTS trg_enforce_api_log_limits ON api_logs;
CREATE TRIGGER trg_enforce_api_log_limits
AFTER INSERT ON api_logs
FOR EACH ROW
EXECUTE FUNCTION enforce_api_log_limits();
