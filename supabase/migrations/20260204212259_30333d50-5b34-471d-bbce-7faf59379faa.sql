-- Drop existing function first (return type changed)
DROP FUNCTION IF EXISTS public.shop_user_authenticate(text, text);

-- Recreate with phone field in return
CREATE OR REPLACE FUNCTION public.shop_user_authenticate(p_email text, p_password text)
RETURNS TABLE(user_id uuid, user_email text, user_name text, user_status text, user_phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    su.id,
    su.email,
    su.name,
    su.status,
    su.phone
  FROM public.shop_users su
  WHERE su.email = p_email
    AND su.password_hash = extensions.crypt(p_password, su.password_hash)
    AND su.status = 'active';
    
  UPDATE public.shop_users
  SET last_login_at = now()
  WHERE email = p_email
    AND password_hash = extensions.crypt(p_password, password_hash)
    AND status = 'active';
END;
$function$;