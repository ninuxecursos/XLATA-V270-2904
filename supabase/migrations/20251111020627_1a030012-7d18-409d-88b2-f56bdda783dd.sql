-- Fix search_path for the 3 new functions to resolve security warnings

CREATE OR REPLACE FUNCTION public.get_database_statistics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
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
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  total_size bigint := 0;
  formatted_size text;
BEGIN
  -- Tentar obter tamanho do storage
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
SET search_path TO 'public', 'pg_catalog'
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