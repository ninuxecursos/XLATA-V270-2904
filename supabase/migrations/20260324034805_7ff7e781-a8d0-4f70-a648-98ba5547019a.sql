
CREATE OR REPLACE FUNCTION public.get_table_sizes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_object_agg(tablename, pg_total_relation_size(schemaname || '.' || tablename))
  INTO result
  FROM pg_tables
  WHERE schemaname = 'public';
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;
