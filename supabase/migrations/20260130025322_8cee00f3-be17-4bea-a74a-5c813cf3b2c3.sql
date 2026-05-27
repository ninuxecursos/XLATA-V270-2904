-- Corrigir a funcao shop_user_register para usar o schema correto
CREATE OR REPLACE FUNCTION public.shop_user_register(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.shop_users WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email ja cadastrado';
  END IF;
  
  INSERT INTO public.shop_users (email, password_hash, name, phone)
  VALUES (p_email, extensions.crypt(p_password, extensions.gen_salt('bf')), p_name, p_phone)
  RETURNING id INTO new_user_id;
  
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- Corrigir tambem a funcao de autenticacao
CREATE OR REPLACE FUNCTION public.shop_user_authenticate(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    su.id,
    su.email,
    su.name,
    su.status
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- Corrigir tambem a funcao de atualizacao de senha
CREATE OR REPLACE FUNCTION public.shop_user_update_password(
  p_user_id UUID,
  p_old_password TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  is_valid BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.shop_users 
    WHERE id = p_user_id 
    AND password_hash = extensions.crypt(p_old_password, password_hash)
  ) INTO is_valid;
  
  IF NOT is_valid THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.shop_users
  SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf'))
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;