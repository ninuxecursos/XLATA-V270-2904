-- FASE 1: CORREÇÕES DE SEGURANÇA CRÍTICAS (parte 3)
-- Índices simples sem predicates complexos

-- 1. Criar índices básicos para performance
CREATE INDEX IF NOT EXISTS idx_user_presence_active 
ON public.user_presence (last_seen_at, is_online);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_time 
ON public.audit_log (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_active 
ON public.user_subscriptions (user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_materials_user_name 
ON public.materials (user_id, name);

CREATE INDEX IF NOT EXISTS idx_orders_user_date 
ON public.orders (user_id, created_at);

-- 2. Otimizar função de verificação de assinatura
CREATE OR REPLACE FUNCTION public.is_subscription_active(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  subscription_active boolean := false;
BEGIN
  -- Cache-friendly query com coalesce
  SELECT 
    COALESCE(is_active AND expires_at > now(), false) INTO subscription_active
  FROM public.user_subscriptions 
  WHERE user_id = target_user_id 
  AND is_active = true
  ORDER BY expires_at DESC 
  LIMIT 1;
  
  RETURN COALESCE(subscription_active, false);
END;
$$;