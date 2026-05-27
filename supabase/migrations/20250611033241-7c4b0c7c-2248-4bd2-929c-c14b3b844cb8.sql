
-- Criar função para permitir que admins visualizem dados de outros usuários
CREATE OR REPLACE FUNCTION public.get_user_orders(target_user_id UUID)
RETURNS SETOF orders
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM orders 
  WHERE user_id = target_user_id 
  AND (auth.uid() = target_user_id OR public.is_admin());
$$;

-- Criar função para obter materiais de um usuário específico
CREATE OR REPLACE FUNCTION public.get_user_materials(target_user_id UUID)
RETURNS SETOF materials
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM materials 
  WHERE user_id = target_user_id 
  AND (auth.uid() = target_user_id OR public.is_admin());
$$;

-- Criar função para obter registros de caixa de um usuário específico
CREATE OR REPLACE FUNCTION public.get_user_cash_registers(target_user_id UUID)
RETURNS SETOF cash_registers
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM cash_registers 
  WHERE user_id = target_user_id 
  AND (auth.uid() = target_user_id OR public.is_admin());
$$;

-- Criar função para obter caixa ativo de um usuário específico
CREATE OR REPLACE FUNCTION public.get_user_active_cash_register(target_user_id UUID)
RETURNS SETOF cash_registers
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM cash_registers 
  WHERE user_id = target_user_id 
  AND status = 'open'
  AND (auth.uid() = target_user_id OR public.is_admin())
  ORDER BY opening_timestamp DESC
  LIMIT 1;
$$;
