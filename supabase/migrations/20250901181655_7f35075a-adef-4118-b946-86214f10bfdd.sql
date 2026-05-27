-- FASE 1: CORREÇÕES DE SEGURANÇA CRÍTICAS (parte 2)
-- Corrigir índices sem CONCURRENTLY

-- 1. Criar índices para melhor performance (sem CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_user_presence_cleanup 
ON public.user_presence (last_seen_at, is_online) 
WHERE is_online = true;

CREATE INDEX IF NOT EXISTS idx_audit_log_rate_limit 
ON public.audit_log (user_id, table_name, created_at) 
WHERE created_at > now() - interval '1 hour';

-- 2. Índices adicionais para otimização de queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active 
ON public.user_subscriptions (user_id, is_active, expires_at) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_materials_user_search 
ON public.materials (user_id, name) 
WHERE name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_recent 
ON public.orders (user_id, created_at DESC);

-- 3. Otimizar função de verificação de assinatura
CREATE OR REPLACE FUNCTION public.is_subscription_active(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  subscription_active boolean := false;
BEGIN
  -- Cache-friendly query
  SELECT 
    CASE 
      WHEN is_active AND expires_at > now() THEN true 
      ELSE false 
    END INTO subscription_active
  FROM public.user_subscriptions 
  WHERE user_id = target_user_id 
  ORDER BY expires_at DESC 
  LIMIT 1;
  
  RETURN COALESCE(subscription_active, false);
END;
$$;

-- 4. Função para batch updates de presença
CREATE OR REPLACE FUNCTION public.batch_update_presence(user_sessions jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  session_record record;
BEGIN
  -- Processar múltiplas sessões em batch
  FOR session_record IN 
    SELECT 
      (value->>'user_id')::uuid as user_id,
      (value->>'session_id')::text as session_id,
      (value->>'is_online')::boolean as is_online
    FROM jsonb_array_elements(user_sessions)
  LOOP
    INSERT INTO public.user_presence (user_id, session_id, is_online, last_seen_at)
    VALUES (session_record.user_id, session_record.session_id, session_record.is_online, now())
    ON CONFLICT (user_id, session_id) 
    DO UPDATE SET 
      is_online = EXCLUDED.is_online,
      last_seen_at = EXCLUDED.last_seen_at;
  END LOOP;
END;
$$;