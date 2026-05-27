-- FASE 1: Criar função RPC para validação server-side de subscription
CREATE OR REPLACE FUNCTION validate_subscription_access(
  target_user_id uuid,
  required_feature text DEFAULT 'basic'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = target_user_id
    AND is_active = true
    AND expires_at > now()
  );
END;
$$;

-- FASE 2: Criar índices compostos para otimização de queries
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_user ON order_items(order_id, user_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_register_user ON cash_transactions(cash_register_id, user_id);
CREATE INDEX IF NOT EXISTS idx_materials_user_name ON materials(user_id, name);
CREATE INDEX IF NOT EXISTS idx_customers_user_name ON customers(user_id, name);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_active ON user_subscriptions(user_id, is_active, expires_at);

-- FASE 2: Criar função RPC para dashboard data (query única otimizada)
CREATE OR REPLACE FUNCTION get_dashboard_summary(
  target_user_id uuid,
  filter_start timestamp DEFAULT NULL,
  filter_end timestamp DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  order_count int;
  material_count int;
  total_sales numeric;
  total_purchases numeric;
BEGIN
  -- Verificar se usuário está autenticado e autorizado
  IF auth.uid() != target_user_id AND NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  -- Contar orders
  SELECT COUNT(*) INTO order_count
  FROM orders
  WHERE user_id = target_user_id
    AND (filter_start IS NULL OR created_at >= filter_start)
    AND (filter_end IS NULL OR created_at <= filter_end);

  -- Contar materials
  SELECT COUNT(*) INTO material_count
  FROM materials
  WHERE user_id = target_user_id;

  -- Calcular total de vendas
  SELECT COALESCE(SUM(total), 0) INTO total_sales
  FROM orders
  WHERE user_id = target_user_id
    AND type = 'venda'
    AND status = 'completed'
    AND (filter_start IS NULL OR created_at >= filter_start)
    AND (filter_end IS NULL OR created_at <= filter_end);

  -- Calcular total de compras
  SELECT COALESCE(SUM(total), 0) INTO total_purchases
  FROM orders
  WHERE user_id = target_user_id
    AND type = 'compra'
    AND status = 'completed'
    AND (filter_start IS NULL OR created_at >= filter_start)
    AND (filter_end IS NULL OR created_at <= filter_end);

  -- Construir resultado JSON
  SELECT jsonb_build_object(
    'order_count', order_count,
    'material_count', material_count,
    'total_sales', total_sales,
    'total_purchases', total_purchases,
    'net_balance', total_sales - total_purchases
  ) INTO result;

  RETURN result;
END;
$$;