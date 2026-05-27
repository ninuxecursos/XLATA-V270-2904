-- Atualizar função validate_subscription_access para verificar se é funcionário
-- Se for funcionário, usa a assinatura do owner_user_id
CREATE OR REPLACE FUNCTION public.validate_subscription_access(
  target_user_id uuid,
  required_feature text DEFAULT 'basic'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  effective_user_id uuid;
BEGIN
  -- Verificar se o usuário é um funcionário ativo
  SELECT owner_user_id INTO effective_user_id
  FROM depot_employees
  WHERE employee_user_id = target_user_id
    AND is_active = true
  LIMIT 1;
  
  -- Se não é funcionário, usar o próprio ID
  IF effective_user_id IS NULL THEN
    effective_user_id := target_user_id;
  END IF;
  
  -- Verificar assinatura do usuário efetivo (dono)
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = effective_user_id
    AND is_active = true
    AND expires_at > now()
  );
END;
$$;

-- Criar função auxiliar para obter o ID efetivo (dono) de qualquer usuário
CREATE OR REPLACE FUNCTION public.get_effective_user_id(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  owner_id uuid;
BEGIN
  -- Verificar se é funcionário
  SELECT owner_user_id INTO owner_id
  FROM depot_employees
  WHERE employee_user_id = target_user_id
    AND is_active = true
  LIMIT 1;
  
  -- Retornar owner_id se for funcionário, senão retornar o próprio ID
  RETURN COALESCE(owner_id, target_user_id);
END;
$$;

-- Criar função para verificar se usuário é funcionário
CREATE OR REPLACE FUNCTION public.is_employee(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM depot_employees
    WHERE employee_user_id = target_user_id
    AND is_active = true
  );
END;
$$;