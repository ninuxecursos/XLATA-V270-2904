
-- Function: Get user's current tier from active subscription
CREATE OR REPLACE FUNCTION public.get_user_tier(p_user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tier text;
BEGIN
  SELECT tier INTO v_tier
  FROM public.user_subscriptions
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > now()
  ORDER BY expires_at DESC
  LIMIT 1;

  RETURN v_tier;
END;
$$;

-- Function: Check if user has access to a specific feature based on their tier
CREATE OR REPLACE FUNCTION public.check_user_feature(p_user_id uuid, p_feature_key text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tier text;
BEGIN
  v_tier := public.get_user_tier(p_user_id);
  
  IF v_tier IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.tier_features tf
    JOIN public.subscription_tiers st ON st.id = tf.tier_id
    WHERE st.name = v_tier
      AND tf.feature_key = p_feature_key
      AND tf.is_enabled = true
  );
END;
$$;

-- Function: Get all features for a user's current tier
CREATE OR REPLACE FUNCTION public.get_user_features(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(feature_key text, feature_label text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tier text;
BEGIN
  v_tier := public.get_user_tier(p_user_id);
  
  IF v_tier IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT tf.feature_key, tf.feature_label
  FROM public.tier_features tf
  JOIN public.subscription_tiers st ON st.id = tf.tier_id
  WHERE st.name = v_tier
    AND tf.is_enabled = true;
END;
$$;

-- Update validate_subscription_access to also check tier-based features
CREATE OR REPLACE FUNCTION public.validate_subscription_access(target_user_id uuid, required_feature text DEFAULT 'basic'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  effective_user_id uuid;
BEGIN
  -- Check if user is an active employee
  SELECT owner_user_id INTO effective_user_id
  FROM depot_employees
  WHERE employee_user_id = target_user_id
    AND is_active = true
  LIMIT 1;
  
  IF effective_user_id IS NULL THEN
    effective_user_id := target_user_id;
  END IF;
  
  -- Basic access check
  IF required_feature = 'basic' THEN
    RETURN EXISTS (
      SELECT 1 FROM user_subscriptions
      WHERE user_id = effective_user_id
      AND is_active = true
      AND expires_at > now()
    );
  END IF;
  
  -- Feature-specific check
  RETURN public.check_user_feature(effective_user_id, required_feature);
END;
$$;
