
-- Função para obter estatísticas detalhadas do banco de dados
CREATE OR REPLACE FUNCTION get_database_statistics()
RETURNS JSON AS $$
DECLARE
    db_size TEXT;
    db_size_bytes BIGINT;
    result JSON;
BEGIN
    -- Obter tamanho do banco de dados
    SELECT pg_size_pretty(pg_database_size(current_database())), 
           pg_database_size(current_database()) 
    INTO db_size, db_size_bytes;
    
    -- Construir resultado JSON
    result := json_build_object(
        'database_size', db_size,
        'size_bytes', db_size_bytes,
        'database_name', current_database(),
        'timestamp', now()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para contar funções do usuário
CREATE OR REPLACE FUNCTION get_function_count()
RETURNS JSON AS $$
DECLARE
    func_count INTEGER;
    result JSON;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION';
    
    result := json_build_object(
        'count', func_count,
        'timestamp', now()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter uso de storage (aproximado)
CREATE OR REPLACE FUNCTION get_storage_usage()
RETURNS JSON AS $$
DECLARE
    total_size BIGINT := 0;
    result JSON;
BEGIN
    -- Esta é uma aproximação baseada no tamanho das tabelas
    SELECT COALESCE(SUM(pg_total_relation_size(schemaname||'.'||tablename)), 0) INTO total_size
    FROM pg_tables 
    WHERE schemaname = 'public';
    
    result := json_build_object(
        'total_size', total_size,
        'formatted_size', pg_size_pretty(total_size),
        'timestamp', now()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
