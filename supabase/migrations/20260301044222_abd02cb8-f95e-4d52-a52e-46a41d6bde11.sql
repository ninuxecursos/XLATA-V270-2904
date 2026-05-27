
DROP FUNCTION IF EXISTS public.get_depot_clients_totals();

CREATE OR REPLACE FUNCTION public.get_depot_clients_totals()
RETURNS TABLE(depot_client_id uuid, real_orders bigint, total_compras numeric, total_vendas numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    dc.id as depot_client_id,
    COUNT(DISTINCT o.id) as real_orders,
    COALESCE(SUM(CASE WHEN o.type = 'compra' AND (o.cancelled IS NULL OR o.cancelled = false) THEN o.total ELSE 0 END), 0) as total_compras,
    COALESCE(SUM(CASE WHEN o.type = 'venda' AND (o.cancelled IS NULL OR o.cancelled = false) THEN o.total ELSE 0 END), 0) as total_vendas
  FROM depot_clients dc
  LEFT JOIN customers c ON c.name = dc.name AND c.user_id = dc.user_id
  LEFT JOIN orders o ON o.customer_id = c.id
  GROUP BY dc.id;
END;
$$;
