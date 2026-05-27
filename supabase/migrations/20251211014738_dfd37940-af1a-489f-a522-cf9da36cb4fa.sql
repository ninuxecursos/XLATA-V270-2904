-- Fix: Activate the most recent subscription for user Dinho
-- This user's subscriptions were incorrectly deactivated

UPDATE user_subscriptions 
SET is_active = true 
WHERE id = '8b0c2fb3-0834-4013-83c1-aec6bb6f7fd8';

-- Also ensure only ONE subscription is active per user (the most recent with valid expires_at)
WITH ranked_subs AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY COALESCE(payment_reference, '') DESC, activated_at DESC) as rn
  FROM user_subscriptions
  WHERE is_active = true
)
UPDATE user_subscriptions 
SET is_active = false
WHERE id IN (
  SELECT id FROM ranked_subs WHERE rn > 1
);