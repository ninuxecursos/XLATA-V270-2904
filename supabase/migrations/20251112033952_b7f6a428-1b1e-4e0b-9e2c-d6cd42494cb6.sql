-- Criar função para contar tabelas no schema public

CREATE OR REPLACE FUNCTION public.get_table_count()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  table_count integer;
BEGIN
  SELECT COUNT(*)
  INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
  
  RETURN jsonb_build_object('count', table_count);
END;
$$;