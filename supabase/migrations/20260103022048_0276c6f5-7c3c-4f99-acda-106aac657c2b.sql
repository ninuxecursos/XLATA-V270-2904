-- =============================================
-- PHASE 1: SECURITY & STABILITY MIGRATIONS
-- =============================================

-- 1. Rate Limiting Server-Side Table
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action text NOT NULL,
  attempt_count integer DEFAULT 1,
  first_attempt_at timestamptz DEFAULT now(),
  blocked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(identifier, action)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_action ON public.rate_limit_attempts(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked ON public.rate_limit_attempts(blocked_until) WHERE blocked_until IS NOT NULL;

-- Rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_action text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15,
  p_block_minutes integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record rate_limit_attempts%ROWTYPE;
  v_now timestamptz := now();
  v_window_start timestamptz := v_now - (p_window_minutes || ' minutes')::interval;
BEGIN
  SELECT * INTO v_record
  FROM rate_limit_attempts
  WHERE identifier = p_identifier AND action = p_action;

  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'remaining_seconds', EXTRACT(EPOCH FROM (v_record.blocked_until - v_now))::integer,
      'attempts_left', 0
    );
  END IF;

  IF v_record.id IS NULL OR v_record.first_attempt_at < v_window_start THEN
    INSERT INTO rate_limit_attempts (identifier, action, attempt_count, first_attempt_at, blocked_until)
    VALUES (p_identifier, p_action, 1, v_now, NULL)
    ON CONFLICT (identifier, action) 
    DO UPDATE SET attempt_count = 1, first_attempt_at = v_now, blocked_until = NULL;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'blocked', false,
      'remaining_seconds', 0,
      'attempts_left', p_max_attempts - 1
    );
  END IF;

  IF v_record.attempt_count >= p_max_attempts THEN
    UPDATE rate_limit_attempts
    SET blocked_until = v_now + (p_block_minutes || ' minutes')::interval
    WHERE identifier = p_identifier AND action = p_action;
    
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'remaining_seconds', p_block_minutes * 60,
      'attempts_left', 0
    );
  ELSE
    UPDATE rate_limit_attempts
    SET attempt_count = attempt_count + 1
    WHERE identifier = p_identifier AND action = p_action;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'blocked', false,
      'remaining_seconds', 0,
      'attempts_left', p_max_attempts - v_record.attempt_count - 1
    );
  END IF;
END;
$$;

-- Cleanup function for expired rate limits
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rate_limit_attempts
  WHERE first_attempt_at < now() - interval '1 hour'
  AND (blocked_until IS NULL OR blocked_until < now());
END;
$$;

-- RLS for rate_limit_attempts (service role only)
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for rate limits" ON public.rate_limit_attempts
FOR ALL USING (current_setting('role', true) = 'service_role');

-- 2. Immutable Payment Ledger Table
CREATE TABLE IF NOT EXISTS public.payment_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'BRL',
  provider text NOT NULL,
  provider_event_id text,
  operation_type text NOT NULL,
  status text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_ledger_user ON public.payment_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_ledger_provider_event ON public.payment_ledger(provider, provider_event_id);
CREATE INDEX IF NOT EXISTS idx_payment_ledger_created ON public.payment_ledger(created_at DESC);

ALTER TABLE public.payment_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments in ledger" ON public.payment_ledger
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role inserts payments" ON public.payment_ledger
FOR INSERT WITH CHECK (current_setting('role', true) = 'service_role');

-- Trigger to prevent updates/deletes on payment_ledger
CREATE OR REPLACE FUNCTION public.prevent_ledger_modification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Payment ledger is immutable. Updates and deletes are not allowed.';
END;
$$;

DROP TRIGGER IF EXISTS prevent_ledger_update ON public.payment_ledger;
CREATE TRIGGER prevent_ledger_update
BEFORE UPDATE ON public.payment_ledger
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

DROP TRIGGER IF EXISTS prevent_ledger_delete ON public.payment_ledger;
CREATE TRIGGER prevent_ledger_delete
BEFORE DELETE ON public.payment_ledger
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

-- 3. Add followup tracking columns to mercado_pago_payments
ALTER TABLE public.mercado_pago_payments 
ADD COLUMN IF NOT EXISTS followup_1h_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS followup_24h_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS followup_48h_sent boolean DEFAULT false;

-- 4. User Lifecycle Table for Growth Tracking
DO $$ BEGIN
  CREATE TYPE user_lifecycle_stage AS ENUM (
    'registered',
    'activated',
    'trial',
    'trial_ending',
    'paying',
    'at_risk',
    'churned'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.user_lifecycle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_stage text DEFAULT 'registered',
  stage_changed_at timestamptz DEFAULT now(),
  onboarding_completed boolean DEFAULT false,
  onboarding_step integer DEFAULT 0,
  last_active_at timestamptz DEFAULT now(),
  trial_ends_at timestamptz,
  churn_reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_lifecycle_stage ON public.user_lifecycle(current_stage);
CREATE INDEX IF NOT EXISTS idx_user_lifecycle_trial_ends ON public.user_lifecycle(trial_ends_at);

ALTER TABLE public.user_lifecycle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lifecycle" ON public.user_lifecycle
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own lifecycle" ON public.user_lifecycle
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role manages lifecycle" ON public.user_lifecycle
FOR ALL USING (current_setting('role', true) = 'service_role');

-- Trigger to create lifecycle record on user creation
CREATE OR REPLACE FUNCTION public.create_user_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_lifecycle (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_lifecycle ON auth.users;

-- 5. User Consents Table for LGPD Compliance
CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  consent_version text NOT NULL,
  consented_at timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text,
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON public.user_consents(consent_type);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents" ON public.user_consents
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents" ON public.user_consents
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages consents" ON public.user_consents
FOR ALL USING (current_setting('role', true) = 'service_role');