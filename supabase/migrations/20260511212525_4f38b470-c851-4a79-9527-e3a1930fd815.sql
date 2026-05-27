CREATE OR REPLACE FUNCTION public.force_takeover_pdv_session()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_employee_user_id uuid := auth.uid();
  v_count int;
BEGIN
  IF v_employee_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Não autenticado');
  END IF;

  UPDATE public.pdv_sessions
  SET is_active = false
  WHERE employee_user_id = v_employee_user_id
    AND is_active = true;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'released', v_count);
END;
$function$;