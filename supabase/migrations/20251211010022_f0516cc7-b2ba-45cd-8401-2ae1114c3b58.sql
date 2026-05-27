-- Clean up duplicate subscriptions keeping only ONE per payment_reference
-- First, identify and delete duplicates, keeping the most recent one

WITH duplicates AS (
  SELECT id, payment_reference, user_id, expires_at,
         ROW_NUMBER() OVER (PARTITION BY payment_reference ORDER BY created_at DESC) as rn
  FROM user_subscriptions
  WHERE payment_reference IS NOT NULL
)
DELETE FROM user_subscriptions
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now fix the corrupted subscription with expires_at in 2044
-- Set it to a reasonable date based on the plan_type
UPDATE user_subscriptions
SET expires_at = (activated_at::timestamp + INTERVAL '90 days')
WHERE expires_at > (NOW() + INTERVAL '3 years')
  AND plan_type = 'quarterly';

UPDATE user_subscriptions
SET expires_at = (activated_at::timestamp + INTERVAL '30 days')
WHERE expires_at > (NOW() + INTERVAL '3 years')
  AND plan_type = 'monthly';

UPDATE user_subscriptions
SET expires_at = (activated_at::timestamp + INTERVAL '365 days')
WHERE expires_at > (NOW() + INTERVAL '3 years')
  AND plan_type = 'annual';

-- Ensure only ONE active subscription per user
WITH ranked_subs AS (
  SELECT id, user_id, is_active,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY expires_at DESC) as rn
  FROM user_subscriptions
  WHERE is_active = true
)
UPDATE user_subscriptions
SET is_active = false
WHERE id IN (
  SELECT id FROM ranked_subs WHERE rn > 1
);

-- Add unique constraint on payment_reference to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_subscriptions_payment_reference_unique'
  ) THEN
    ALTER TABLE user_subscriptions
    ADD CONSTRAINT user_subscriptions_payment_reference_unique 
    UNIQUE (payment_reference);
  END IF;
EXCEPTION WHEN others THEN
  -- Handle case where duplicate values still exist
  RAISE NOTICE 'Could not add unique constraint: %', SQLERRM;
END $$;