-- ============================================
-- CORREÇÃO DE SEARCH_PATH EM FUNÇÕES SQL
-- Adiciona SET search_path = public, pg_catalog
-- em todas as funções que estão sem essa proteção
-- ============================================

-- 1. get_unread_error_reports
CREATE OR REPLACE FUNCTION public.get_unread_error_reports()
RETURNS TABLE(id uuid, user_email text, error_type text, error_title text, error_description text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    er.id,
    er.user_email,
    er.error_type,
    er.error_title,
    er.error_description,
    er.created_at
  FROM public.error_reports er
  WHERE er.is_read = false
  ORDER BY er.created_at DESC;
END;
$function$;

-- 2. cleanup_old_presence
CREATE OR REPLACE FUNCTION public.cleanup_old_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  UPDATE public.user_presence 
  SET is_online = false 
  WHERE last_seen_at < now() - interval '30 minutes' 
  AND is_online = true;
  
  DELETE FROM public.user_presence 
  WHERE last_seen_at < now() - interval '2 hours';
END;
$function$;

-- 3. get_unread_global_notifications
CREATE OR REPLACE FUNCTION public.get_unread_global_notifications()
RETURNS TABLE(id uuid, title text, message text, sender_name text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    gn.id,
    gn.title,
    gn.message,
    gn.sender_name,
    gn.created_at
  FROM public.global_notifications gn
  WHERE gn.is_active = true 
    AND gn.expires_at > now()
    AND NOT EXISTS (
      SELECT 1 FROM public.global_notification_recipients gnr 
      WHERE gnr.notification_id = gn.id 
      AND gnr.user_id = auth.uid()
    )
  ORDER BY gn.created_at DESC;
END;
$function$;

-- 4. get_user_referrals
CREATE OR REPLACE FUNCTION public.get_user_referrals(user_uuid uuid)
RETURNS TABLE(indicado_id uuid, indicado_name text, indicado_email text, plan_type text, is_active boolean, dias_recompensa integer, data_recompensa timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
  SELECT 
    p.id as indicado_id,
    p.name as indicado_name,
    p.email as indicado_email,
    us.plan_type,
    us.is_active,
    ri.dias_creditados as dias_recompensa,
    ri.data_credito as data_recompensa
  FROM public.profiles p
  LEFT JOIN public.user_subscriptions us ON p.id = us.user_id
  LEFT JOIN public.recompensas_indicacao ri ON (p.id = ri.indicado_id AND ri.user_id = user_uuid)
  WHERE p.indicador_id = user_uuid
  ORDER BY p.created_at DESC;
$function$;

-- 5. get_unread_admin_messages
CREATE OR REPLACE FUNCTION public.get_unread_admin_messages()
RETURNS TABLE(id uuid, title text, message text, sender_name text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    am.id,
    am.title,
    am.message,
    am.sender_name,
    am.created_at
  FROM public.admin_messages am
  WHERE 
    am.expires_at > now() AND
    (
      am.target_type = 'all_online' OR 
      (am.target_type = 'selected_users' AND auth.uid() = ANY(am.target_users))
    ) AND
    NOT EXISTS (
      SELECT 1 FROM public.admin_message_recipients amr 
      WHERE amr.message_id = am.id 
      AND amr.user_id = auth.uid()
    )
  ORDER BY am.created_at DESC;
END;
$function$;

-- 6. get_unread_direct_messages
CREATE OR REPLACE FUNCTION public.get_unread_direct_messages()
RETURNS TABLE(id uuid, sender_name text, title text, message text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    udm.id,
    udm.sender_name,
    udm.title,
    udm.message,
    udm.created_at
  FROM public.user_direct_messages udm
  WHERE udm.recipient_id = auth.uid()
    AND udm.read_at IS NULL
    AND udm.expires_at > now()
  ORDER BY udm.created_at DESC;
END;
$function$;

-- 7. generate_ref_key
CREATE OR REPLACE FUNCTION public.generate_ref_key(user_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
DECLARE
  clean_name TEXT;
  first_three_chars TEXT;
  current_datetime TIMESTAMP;
  day_part TEXT;
  month_part TEXT;
  hour_part TEXT;
  minute_part TEXT;
  base_key TEXT;
  final_key TEXT;
  counter INTEGER := 1;
BEGIN
  current_datetime := NOW();
  
  day_part := LPAD(EXTRACT(DAY FROM current_datetime)::TEXT, 2, '0');
  month_part := LPAD(EXTRACT(MONTH FROM current_datetime)::TEXT, 2, '0');
  hour_part := LPAD(EXTRACT(HOUR FROM current_datetime)::TEXT, 2, '0');
  minute_part := LPAD(EXTRACT(MINUTE FROM current_datetime)::TEXT, 2, '0');
  
  clean_name := UPPER(TRIM(REGEXP_REPLACE(user_name, '[^a-zA-ZÀ-ÿ ]', '', 'g')));
  
  clean_name := TRANSLATE(clean_name, 
    'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇç',
    'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc'
  );
  
  first_three_chars := SUBSTRING(REGEXP_REPLACE(clean_name, '[^A-Z]', '', 'g'), 1, 3);
  
  WHILE LENGTH(first_three_chars) < 3 LOOP
    first_three_chars := first_three_chars || 'X';
  END LOOP;
  
  base_key := first_three_chars || day_part || month_part || hour_part || minute_part;
  final_key := base_key;
  
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE ref_key = final_key) LOOP
    final_key := base_key || counter::TEXT;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_key;
END;
$function$;

-- 8. regenerate_all_ref_keys
CREATE OR REPLACE FUNCTION public.regenerate_all_ref_keys()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
DECLARE
  profile_record RECORD;
  new_key TEXT;
  updated_count INTEGER := 0;
BEGIN
  FOR profile_record IN 
    SELECT id, name, created_at 
    FROM public.profiles 
    WHERE ref_key IS NOT NULL AND LENGTH(ref_key) > 15
  LOOP
    new_key := public.generate_ref_key(COALESCE(profile_record.name, 'Usuario'));
    
    UPDATE public.profiles 
    SET ref_key = new_key 
    WHERE id = profile_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$function$;

-- 9. get_unread_realtime_messages
CREATE OR REPLACE FUNCTION public.get_unread_realtime_messages()
RETURNS TABLE(id uuid, sender_name text, title text, message text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    arm.id,
    arm.sender_name,
    arm.title,
    arm.message,
    arm.created_at
  FROM public.admin_realtime_messages arm
  WHERE arm.target_user_id = auth.uid()
    AND arm.is_read = false
    AND arm.expires_at > now()
  ORDER BY arm.created_at DESC;
END;
$function$;

-- 10. is_unidade_available
CREATE OR REPLACE FUNCTION public.is_unidade_available(unidade_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.unidade_sessions 
    WHERE unidade_id = unidade_uuid 
    AND is_active = true 
    AND last_activity > now() - interval '30 minutes'
    AND user_id != auth.uid()
  );
END;
$function$;

-- 11. activate_unidade_session
CREATE OR REPLACE FUNCTION public.activate_unidade_session(unidade_uuid uuid, session_token_input text, device_info_input text DEFAULT NULL::text, ip_address_input inet DEFAULT NULL::inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  UPDATE public.unidade_sessions 
  SET is_active = false 
  WHERE unidade_id = unidade_uuid 
  AND user_id = auth.uid();
  
  IF NOT public.is_unidade_available(unidade_uuid) THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO public.unidade_sessions (
    unidade_id, 
    user_id, 
    session_token, 
    device_info, 
    ip_address
  ) VALUES (
    unidade_uuid, 
    auth.uid(), 
    session_token_input, 
    device_info_input, 
    ip_address_input
  );
  
  RETURN TRUE;
END;
$function$;

-- 12. deactivate_unidade_session
CREATE OR REPLACE FUNCTION public.deactivate_unidade_session(unidade_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  UPDATE public.unidade_sessions 
  SET is_active = false 
  WHERE unidade_id = unidade_uuid 
  AND user_id = auth.uid() 
  AND is_active = true;
END;
$function$;

-- 13. cleanup_inactive_unidade_sessions
CREATE OR REPLACE FUNCTION public.cleanup_inactive_unidade_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  UPDATE public.unidade_sessions 
  SET is_active = false 
  WHERE is_active = true 
  AND last_activity < now() - interval '30 minutes';
END;
$function$;