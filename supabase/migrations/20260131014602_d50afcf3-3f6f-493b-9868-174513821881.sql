-- Primeiro dropamos a função existente pois o tipo de retorno está mudando de SETOF para json
DROP FUNCTION IF EXISTS public.get_user_orders(uuid);

-- Recria a função RPC get_user_orders para incluir order_items aninhados
-- Isso corrige o problema onde admin vendo como outro usuário não via os items das orders
CREATE OR REPLACE FUNCTION public.get_user_orders(target_user_id uuid)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', o.id,
        'customer_id', o.customer_id,
        'type', o.type,
        'status', o.status,
        'total', o.total,
        'created_at', o.created_at,
        'cancelled', o.cancelled,
        'cancelled_at', o.cancelled_at,
        'cancellation_reason', o.cancellation_reason,
        'items', COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'material_id', oi.material_id,
                'material_name', oi.material_name,
                'quantity', oi.quantity,
                'price', oi.price,
                'total', oi.total,
                'tara', oi.tara,
                'original_price', oi.original_price,
                'price_adjustment', oi.price_adjustment
              )
            )
            FROM order_items oi
            WHERE oi.order_id = o.id
          ),
          '[]'::json
        )
      )
    ),
    '[]'::json
  )
  FROM orders o
  WHERE o.user_id = target_user_id
  AND (auth.uid() = target_user_id OR public.is_admin());
$function$;