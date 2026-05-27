ALTER TABLE public.pdv_sessions ADD COLUMN IF NOT EXISTS device_id text;

CREATE INDEX IF NOT EXISTS idx_pdv_sessions_employee_active
  ON public.pdv_sessions (employee_user_id, is_active, last_heartbeat);

CREATE OR REPLACE FUNCTION public.register_pdv_session(
  p_owner_user_id uuid,
  p_session_token text,
  p_device_info text DEFAULT NULL,
  p_device_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_access jsonb;
  v_session_id uuid;
  v_employee_user_id uuid := auth.uid();
  v_existing_device text;
  v_existing_id uuid;
BEGIN
  UPDATE public.pdv_sessions
  SET is_active = false
  WHERE is_active = true
    AND last_heartbeat < (now() - interval '90 seconds');

  SELECT id, device_id
    INTO v_existing_id, v_existing_device
  FROM public.pdv_sessions
  WHERE employee_user_id = v_employee_user_id
    AND is_active = true
    AND last_heartbeat > (now() - interval '90 seconds')
  ORDER BY last_heartbeat DESC
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    IF p_device_id IS NOT NULL AND v_existing_device IS NOT NULL AND v_existing_device = p_device_id THEN
      UPDATE public.pdv_sessions
      SET last_heartbeat = now(), session_token = p_session_token
      WHERE id = v_existing_id;

      v_access := public.check_pdv_access(p_owner_user_id);
      RETURN jsonb_build_object(
        'allowed', true,
        'session_id', v_existing_id,
        'active_sessions', (v_access->>'active_sessions')::integer,
        'max_slots', (v_access->>'max_slots')::integer
      );
    END IF;

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'device_conflict',
      'message', 'PDV já está aberto em outro dispositivo com esta mesma conta. Feche o PDV no outro dispositivo para continuar aqui.'
    );
  END IF;

  v_access := public.check_pdv_access(p_owner_user_id);

  IF NOT (v_access->>'allowed')::boolean THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'slot_limit',
      'active_sessions', (v_access->>'active_sessions')::integer,
      'max_slots', (v_access->>'max_slots')::integer,
      'message', 'Limite de acessos simultâneos atingido. Máximo: ' || (v_access->>'max_slots') || ' usuários.'
    );
  END IF;

  INSERT INTO public.pdv_sessions (owner_user_id, employee_user_id, session_token, device_info, device_id)
  VALUES (p_owner_user_id, v_employee_user_id, p_session_token, p_device_info, p_device_id)
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'session_id', v_session_id,
    'active_sessions', (v_access->>'active_sessions')::integer + 1,
    'max_slots', (v_access->>'max_slots')::integer
  );
END;
$function$;