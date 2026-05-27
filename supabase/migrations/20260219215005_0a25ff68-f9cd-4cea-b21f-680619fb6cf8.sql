
-- =============================================
-- 1. ENHANCE depot_employees TABLE
-- =============================================
ALTER TABLE public.depot_employees
  ADD COLUMN IF NOT EXISTS salary numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS work_start_time time DEFAULT '08:00:00',
  ADD COLUMN IF NOT EXISTS work_end_time time DEFAULT '18:00:00',
  ADD COLUMN IF NOT EXISTS work_days integer[] DEFAULT ARRAY[1,2,3,4,5], -- 0=dom, 1=seg, ..., 6=sab
  ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text;

-- =============================================
-- 2. PDV SESSIONS TABLE (concurrent access control)
-- =============================================
CREATE TABLE IF NOT EXISTS public.pdv_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL, -- dono da empresa
  employee_user_id uuid NOT NULL, -- funcionário ou dono usando o PDV
  session_token text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_heartbeat timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  device_info text,
  ip_address inet
);

ALTER TABLE public.pdv_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own PDV sessions"
  ON public.pdv_sessions FOR ALL
  USING (employee_user_id = auth.uid() OR owner_user_id = auth.uid())
  WITH CHECK (employee_user_id = auth.uid() OR owner_user_id = auth.uid());

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_pdv_sessions_owner_active 
  ON public.pdv_sessions(owner_user_id) WHERE is_active = true;

-- =============================================
-- 3. PDV ACCESS SLOTS CONFIG (max concurrent users per owner)
-- =============================================
CREATE TABLE IF NOT EXISTS public.pdv_access_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL UNIQUE,
  max_concurrent_slots integer NOT NULL DEFAULT 3,
  extra_slots_purchased integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pdv_access_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their PDV config"
  ON public.pdv_access_config FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Admins can also view/edit
CREATE POLICY "Admins can manage all PDV configs"
  ON public.pdv_access_config FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================
-- 4. EMPLOYEE ACTION LOGS (audit trail)
-- =============================================
CREATE TABLE IF NOT EXISTS public.employee_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  employee_user_id uuid NOT NULL,
  employee_name text NOT NULL,
  action_type text NOT NULL, -- 'click', 'transaction', 'login', 'logout', 'pdv_open', 'pdv_close', etc.
  action_detail text, -- ex: 'Botão Venda Avulsa', 'Finalizou pedido #123'
  entity_type text, -- 'order', 'material', 'customer', 'cash_register', etc.
  entity_id text, -- ID da entidade afetada
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their employee logs"
  ON public.employee_action_logs FOR SELECT
  USING (owner_user_id = auth.uid() OR employee_user_id = auth.uid());

CREATE POLICY "System can insert employee logs"
  ON public.employee_action_logs FOR INSERT
  WITH CHECK (employee_user_id = auth.uid() OR owner_user_id = auth.uid());

CREATE POLICY "Admins can view all employee logs"
  ON public.employee_action_logs FOR SELECT
  USING (public.is_admin());

-- Indexes for reporting
CREATE INDEX IF NOT EXISTS idx_employee_logs_owner ON public.employee_action_logs(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_employee_logs_employee ON public.employee_action_logs(employee_user_id);
CREATE INDEX IF NOT EXISTS idx_employee_logs_created ON public.employee_action_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_logs_action_type ON public.employee_action_logs(action_type);

-- =============================================
-- 5. FUNCTION: Check PDV access (concurrent limit)
-- =============================================
CREATE OR REPLACE FUNCTION public.check_pdv_access(p_owner_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_max_slots integer;
  v_active_count integer;
  v_result jsonb;
BEGIN
  -- Cleanup stale sessions (no heartbeat for 5 minutes)
  UPDATE public.pdv_sessions 
  SET is_active = false 
  WHERE owner_user_id = p_owner_user_id 
  AND is_active = true 
  AND last_heartbeat < now() - interval '5 minutes';

  -- Get max slots (default 3 if no config)
  SELECT COALESCE(max_concurrent_slots + extra_slots_purchased, 3)
  INTO v_max_slots
  FROM public.pdv_access_config
  WHERE owner_user_id = p_owner_user_id;

  IF v_max_slots IS NULL THEN
    v_max_slots := 3;
  END IF;

  -- Count active sessions
  SELECT COUNT(*)
  INTO v_active_count
  FROM public.pdv_sessions
  WHERE owner_user_id = p_owner_user_id
  AND is_active = true;

  v_result := jsonb_build_object(
    'allowed', v_active_count < v_max_slots,
    'active_sessions', v_active_count,
    'max_slots', v_max_slots,
    'remaining_slots', GREATEST(v_max_slots - v_active_count, 0)
  );

  RETURN v_result;
END;
$$;

-- =============================================
-- 6. FUNCTION: Register PDV session
-- =============================================
CREATE OR REPLACE FUNCTION public.register_pdv_session(
  p_owner_user_id uuid,
  p_session_token text,
  p_device_info text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_access jsonb;
  v_session_id uuid;
  v_employee_user_id uuid := auth.uid();
BEGIN
  -- Check access first
  v_access := public.check_pdv_access(p_owner_user_id);

  -- If user already has an active session, reuse it
  SELECT id INTO v_session_id
  FROM public.pdv_sessions
  WHERE owner_user_id = p_owner_user_id
  AND employee_user_id = v_employee_user_id
  AND is_active = true
  LIMIT 1;

  IF v_session_id IS NOT NULL THEN
    -- Update heartbeat
    UPDATE public.pdv_sessions
    SET last_heartbeat = now(), session_token = p_session_token
    WHERE id = v_session_id;

    RETURN jsonb_build_object(
      'allowed', true,
      'session_id', v_session_id,
      'active_sessions', (v_access->>'active_sessions')::integer,
      'max_slots', (v_access->>'max_slots')::integer
    );
  END IF;

  -- Check if access is allowed
  IF NOT (v_access->>'allowed')::boolean THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'active_sessions', (v_access->>'active_sessions')::integer,
      'max_slots', (v_access->>'max_slots')::integer,
      'message', 'Limite de acessos simultâneos atingido. Máximo: ' || (v_access->>'max_slots') || ' usuários. Para liberar mais acessos, é necessário adquirir slots adicionais (R$ 50,00 cada).'
    );
  END IF;

  -- Register new session
  INSERT INTO public.pdv_sessions (owner_user_id, employee_user_id, session_token, device_info)
  VALUES (p_owner_user_id, v_employee_user_id, p_session_token, p_device_info)
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'session_id', v_session_id,
    'active_sessions', (v_access->>'active_sessions')::integer + 1,
    'max_slots', (v_access->>'max_slots')::integer
  );
END;
$$;

-- =============================================
-- 7. FUNCTION: Release PDV session
-- =============================================
CREATE OR REPLACE FUNCTION public.release_pdv_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.pdv_sessions
  SET is_active = false
  WHERE id = p_session_id
  AND (employee_user_id = auth.uid() OR owner_user_id = auth.uid());
END;
$$;

-- =============================================
-- 8. FUNCTION: Heartbeat PDV session
-- =============================================
CREATE OR REPLACE FUNCTION public.heartbeat_pdv_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.pdv_sessions
  SET last_heartbeat = now()
  WHERE id = p_session_id
  AND is_active = true
  AND (employee_user_id = auth.uid() OR owner_user_id = auth.uid());
END;
$$;

-- =============================================
-- 9. FUNCTION: Check employee work hours
-- =============================================
CREATE OR REPLACE FUNCTION public.check_employee_work_hours(p_employee_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_employee depot_employees%ROWTYPE;
  v_current_time time;
  v_current_day integer;
  v_allowed boolean := true;
  v_message text := '';
BEGIN
  -- Get employee record
  SELECT * INTO v_employee
  FROM public.depot_employees
  WHERE employee_user_id = p_employee_user_id
  AND is_active = true
  LIMIT 1;

  -- If not an employee, allow (it's the owner)
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', true, 'is_employee', false);
  END IF;

  v_current_time := LOCALTIME;
  v_current_day := EXTRACT(DOW FROM CURRENT_DATE)::integer; -- 0=dom, 1=seg, ..., 6=sab

  -- Check work days
  IF NOT (v_current_day = ANY(v_employee.work_days)) THEN
    v_allowed := false;
    v_message := 'Acesso restrito: seu expediente não inclui este dia da semana.';
  -- Check work hours
  ELSIF v_current_time < v_employee.work_start_time OR v_current_time > v_employee.work_end_time THEN
    v_allowed := false;
    v_message := 'Acesso restrito: seu horário de expediente é das ' || 
                 to_char(v_employee.work_start_time, 'HH24:MI') || ' às ' || 
                 to_char(v_employee.work_end_time, 'HH24:MI') || '.';
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'is_employee', true,
    'employee_name', v_employee.name,
    'work_start', to_char(v_employee.work_start_time, 'HH24:MI'),
    'work_end', to_char(v_employee.work_end_time, 'HH24:MI'),
    'work_days', v_employee.work_days,
    'message', v_message
  );
END;
$$;

-- Trigger for updated_at on pdv_access_config
CREATE TRIGGER update_pdv_access_config_updated_at
  BEFORE UPDATE ON public.pdv_access_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
