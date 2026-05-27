-- FASE 1: CORREÇÕES DE SEGURANÇA CRÍTICAS
-- Corrigir todas as funções com search_path mutável

-- 1. Corrigir função de validação de entrada
CREATE OR REPLACE FUNCTION public.validate_user_input(input_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'  -- Fix: search_path fixo
AS $$
BEGIN
  -- Validação de entrada mais rigorosa
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Limita tamanho máximo (proteção contra DoS)
  IF LENGTH(input_text) > 1000 THEN
    RAISE EXCEPTION 'Input too long: maximum 1000 characters allowed';
  END IF;
  
  -- Remove caracteres potencialmente perigosos
  RETURN TRIM(REGEXP_REPLACE(input_text, '[<>"\'';&|`\\]', '', 'g'));
END;
$$;

-- 2. Corrigir função de sanitização
CREATE OR REPLACE FUNCTION public.sanitize_input(input_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'  -- Fix: search_path fixo
AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Validação de tamanho
  IF LENGTH(input_text) > 500 THEN
    RAISE EXCEPTION 'Input exceeds maximum length of 500 characters';
  END IF;
  
  -- Remove caracteres perigosos de forma mais rigorosa
  RETURN TRIM(REGEXP_REPLACE(input_text, '[<>"'';&|`\\]', '', 'g'));
END;
$$;

-- 3. Corrigir função de validação de dados do usuário
CREATE OR REPLACE FUNCTION public.validate_user_data(p_nome_completo text, p_email text, p_whatsapp text, p_senha text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'  -- Fix: search_path fixo
AS $$
BEGIN
  -- Validar nome completo
  IF p_nome_completo IS NULL OR LENGTH(TRIM(p_nome_completo)) < 2 THEN
    RAISE EXCEPTION 'Nome completo deve ter pelo menos 2 caracteres';
  END IF;
  
  -- Validação mais rigorosa de email
  IF p_email IS NULL OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR LENGTH(p_email) > 254 THEN
    RAISE EXCEPTION 'Email inválido ou muito longo';
  END IF;
  
  -- Validar WhatsApp com regex mais rigoroso
  IF p_whatsapp IS NULL OR p_whatsapp !~ '^\+?[1-9]\d{10,14}$' THEN
    RAISE EXCEPTION 'WhatsApp deve conter apenas números (10-15 dígitos)';
  END IF;
  
  -- Validação de senha mais rigorosa
  IF p_senha IS NULL OR LENGTH(p_senha) < 8 OR p_senha !~ '.*[A-Z].*' OR p_senha !~ '.*[a-z].*' OR p_senha !~ '.*[0-9].*' THEN
    RAISE EXCEPTION 'Senha deve ter pelo menos 8 caracteres, com maiúscula, minúscula e número';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 4. Corrigir função de auditoria
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'  -- Fix: search_path fixo
AS $$
BEGIN
  -- Validar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Operação não autorizada: usuário não autenticado';
  END IF;

  INSERT INTO public.audit_log (
    user_id,
    table_name,
    operation,
    old_data,
    new_data,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- 5. Implementar função de limpeza de presença otimizada
CREATE OR REPLACE FUNCTION public.cleanup_old_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'  -- Fix: search_path fixo
AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Marcar como offline usuários inativos (mais de 2 minutos)
  UPDATE public.user_presence 
  SET is_online = false 
  WHERE last_seen_at < now() - interval '2 minutes' 
  AND is_online = true;
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  -- Remover registros muito antigos (mais de 6 horas)
  DELETE FROM public.user_presence 
  WHERE last_seen_at < now() - interval '6 hours';
  
  -- Log da limpeza para monitoramento
  RAISE NOTICE 'Cleanup concluído: % usuários marcados como offline', cleanup_count;
END;
$$;

-- 6. Função de verificação de taxa limite (rate limiting)
CREATE OR REPLACE FUNCTION public.check_rate_limit(operation_type text, max_requests integer DEFAULT 60, time_window interval DEFAULT '1 minute')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'  -- Fix: search_path fixo
AS $$
DECLARE
  request_count INTEGER;
  user_id_val UUID := auth.uid();
BEGIN
  -- Se não há usuário autenticado, bloquear
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'Rate limiting: usuário não autenticado';
  END IF;
  
  -- Contar requisições recentes
  SELECT COUNT(*) INTO request_count
  FROM public.audit_log
  WHERE user_id = user_id_val
  AND table_name = operation_type
  AND created_at > now() - time_window;
  
  -- Verificar se excedeu o limite
  IF request_count >= max_requests THEN
    RAISE EXCEPTION 'Rate limit excedido: máximo % requisições por %', max_requests, time_window;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 7. Criar índices para melhor performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_presence_cleanup 
ON public.user_presence (last_seen_at, is_online) 
WHERE is_online = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_rate_limit 
ON public.audit_log (user_id, table_name, created_at) 
WHERE created_at > now() - interval '1 hour';

-- 8. Trigger para cleanup automático de presença
CREATE OR REPLACE FUNCTION public.auto_cleanup_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Executar cleanup se última execução foi há mais de 5 minutos
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_system_config 
    WHERE updated_at > now() - interval '5 minutes'
  ) THEN
    PERFORM public.cleanup_old_presence();
    
    -- Atualizar timestamp do sistema
    UPDATE public.admin_system_config 
    SET updated_at = now() 
    WHERE id IS NOT NULL;
  END IF;
END;
$$;