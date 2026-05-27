-- Migration: Fix online presence intervals and add last_login_at tracking

-- 1. Atualizar função get_online_users para timeout de 5 minutos
CREATE OR REPLACE FUNCTION public.get_online_users()
RETURNS TABLE(user_id uuid, last_seen_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Limpar presenças antigas (mais de 5 minutos) - aumentado de 2 para 5 minutos
  UPDATE public.user_presence 
  SET is_online = false 
  WHERE public.user_presence.last_seen_at < now() - interval '5 minutes' 
    AND public.user_presence.is_online = true;
  
  -- Retornar usuários online (ativos nos últimos 5 minutos)
  RETURN QUERY
  SELECT DISTINCT 
    public.user_presence.user_id,
    public.user_presence.last_seen_at
  FROM public.user_presence
  WHERE public.user_presence.is_online = true
    AND public.user_presence.last_seen_at >= now() - interval '5 minutes'
  ORDER BY public.user_presence.last_seen_at DESC;
END;
$$;

-- 2. Atualizar função cleanup_old_presence para deletar após 30 minutos
CREATE OR REPLACE FUNCTION public.cleanup_old_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  UPDATE public.user_presence 
  SET is_online = false 
  WHERE last_seen_at < now() - interval '30 minutes' 
  AND is_online = true;
  
  DELETE FROM public.user_presence 
  WHERE last_seen_at < now() - interval '2 hours';
END;
$$;

-- 3. Adicionar coluna last_login_at na tabela profiles se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN last_login_at timestamp with time zone;
  END IF;
END $$;

-- 4. Criar ou substituir função para atualizar last_login_at
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    UPDATE public.profiles 
    SET last_login_at = now()
    WHERE id = NEW.id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to update last_login_at for user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

-- 5. Criar trigger para atualizar last_login_at automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created_update_login ON auth.users;

CREATE TRIGGER on_auth_user_created_update_login
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_login();

-- 6. Criar funções auxiliares para estatísticas do banco (se não existirem)
CREATE OR REPLACE FUNCTION public.get_database_statistics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  db_size text;
  db_size_bytes bigint;
BEGIN
  -- Obter tamanho do banco atual
  SELECT pg_database_size(current_database()) INTO db_size_bytes;
  
  -- Formatar tamanho
  db_size := pg_size_pretty(db_size_bytes);
  
  RETURN jsonb_build_object(
    'database_size', db_size,
    'size_bytes', db_size_bytes
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_storage_usage()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_size bigint := 0;
  formatted_size text;
BEGIN
  -- Tentar obter tamanho do storage
  -- Nota: Esta é uma aproximação pois não temos acesso direto ao storage bucket size
  SELECT COALESCE(SUM(length(content)::bigint), 0) 
  INTO total_size
  FROM storage.objects
  WHERE bucket_id IS NOT NULL;
  
  formatted_size := pg_size_pretty(total_size);
  
  RETURN jsonb_build_object(
    'total_size', total_size,
    'formatted_size', formatted_size
  );
EXCEPTION WHEN OTHERS THEN
  -- Retornar 0 se houver erro
  RETURN jsonb_build_object(
    'total_size', 0,
    'formatted_size', '0 MB'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_function_count()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  func_count integer;
BEGIN
  SELECT COUNT(*)
  INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public';
  
  RETURN jsonb_build_object('count', func_count);
END;
$$;