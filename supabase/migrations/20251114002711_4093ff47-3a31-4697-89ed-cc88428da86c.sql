-- Drop e recriar função get_online_users
DROP FUNCTION IF EXISTS public.get_online_users();

CREATE OR REPLACE FUNCTION public.get_online_users()
RETURNS TABLE (
  user_id uuid,
  last_seen_at timestamp with time zone,
  session_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (up.user_id)
    up.user_id,
    up.last_seen_at,
    up.session_id
  FROM user_presence up
  WHERE up.last_seen_at >= (NOW() - INTERVAL '5 minutes')
  ORDER BY up.user_id, up.last_seen_at DESC;
END;
$$;

-- Criar trigger para marcar automaticamente is_online=true quando last_seen_at é atualizado
CREATE OR REPLACE FUNCTION public.update_presence_online_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se last_seen_at foi atualizado para um valor recente, marcar como online
  IF NEW.last_seen_at >= (NOW() - INTERVAL '5 minutes') THEN
    NEW.is_online := true;
  ELSE
    NEW.is_online := false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remover trigger anterior se existir e criar novo
DROP TRIGGER IF EXISTS trigger_update_presence_online ON public.user_presence;

CREATE TRIGGER trigger_update_presence_online
  BEFORE INSERT OR UPDATE ON public.user_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_presence_online_status();