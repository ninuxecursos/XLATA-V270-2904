-- Cleanup duplicate active subscriptions: keep only the most recent one per user

-- Step 1: Create a CTE to identify the most recent active subscription per user
WITH ranked_subscriptions AS (
  SELECT 
    id,
    user_id,
    expires_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY expires_at DESC) as rn
  FROM user_subscriptions
  WHERE is_active = true
)
-- Step 2: Deactivate all but the most recent active subscription per user
UPDATE user_subscriptions
SET is_active = false
WHERE id IN (
  SELECT id FROM ranked_subscriptions WHERE rn > 1
);

-- Log how many were deactivated
DO $$
DECLARE
  deactivated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO deactivated_count
  FROM user_subscriptions us
  WHERE us.is_active = false
    AND EXISTS (
      SELECT 1 FROM user_subscriptions us2 
      WHERE us2.user_id = us.user_id 
      AND us2.is_active = true
    );
  RAISE NOTICE 'Cleanup complete. Duplicate subscriptions have been deactivated.';
END $$;