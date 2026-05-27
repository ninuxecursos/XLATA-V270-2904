
-- Backups (idempotente)
CREATE TABLE IF NOT EXISTS public.orders_backup_20260429 AS TABLE public.orders;
CREATE TABLE IF NOT EXISTS public.order_items_backup_20260429 AS TABLE public.order_items;
CREATE TABLE IF NOT EXISTS public.cash_transactions_backup_20260429 AS TABLE public.cash_transactions;
CREATE TABLE IF NOT EXISTS public.cash_registers_backup_20260429 AS TABLE public.cash_registers;

-- ETAPA 1: dedup
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY order_id, material_id, material_name, price, quantity, COALESCE(tara,0)
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.order_items
)
DELETE FROM public.order_items oi
USING ranked r
WHERE oi.id = r.id AND r.rn > 1;

-- ETAPA 2: recalcular totals
UPDATE public.orders o
SET total = sub.soma, updated_at = now()
FROM (
  SELECT order_id, SUM(total) AS soma
  FROM public.order_items
  GROUP BY order_id
) sub
WHERE o.id = sub.order_id
  AND ROUND(o.total::numeric, 2) <> ROUND(sub.soma::numeric, 2);

-- ETAPA 3: reconstruir movimentações de caixa (pedidos ativos)
WITH active_orders AS (
  SELECT o.id, o.user_id, o.total, o.unidade_id
  FROM public.orders o
  WHERE COALESCE(o.cancelled,false) = false
),
order_tx AS (
  SELECT ct.order_id,
         SUM(CASE WHEN ct.type IN ('purchase','sale') THEN ct.amount ELSE 0 END) AS soma_in,
         SUM(CASE WHEN ct.type = 'refund' THEN ct.amount ELSE 0 END) AS soma_refund,
         (array_agg(ct.cash_register_id ORDER BY ct.created_at DESC))[1] AS any_register
  FROM public.cash_transactions ct
  WHERE ct.order_id IS NOT NULL
  GROUP BY ct.order_id
),
diffs AS (
  SELECT ao.id AS order_id, ao.user_id, ao.unidade_id,
         ao.total - COALESCE(ot.soma_in,0) + COALESCE(ot.soma_refund,0) AS delta,
         ot.any_register
  FROM active_orders ao
  LEFT JOIN order_tx ot ON ot.order_id = ao.id
)
INSERT INTO public.cash_transactions (user_id, cash_register_id, type, amount, description, order_id, created_at, unidade_id)
SELECT d.user_id,
       COALESCE(d.any_register,
                (SELECT cr.id FROM public.cash_registers cr
                 WHERE cr.user_id = d.user_id
                 ORDER BY cr.created_at DESC LIMIT 1)),
       'purchase',
       d.delta,
       'Ajuste de integridade - reconstrução de movimentação',
       d.order_id,
       now(),
       d.unidade_id
FROM diffs d
WHERE ABS(d.delta) >= 0.01
  AND COALESCE(d.any_register,
        (SELECT cr.id FROM public.cash_registers cr WHERE cr.user_id = d.user_id ORDER BY cr.created_at DESC LIMIT 1)
      ) IS NOT NULL;

-- ETAPA 4: estornos faltantes (pedidos cancelados)
WITH cancelled_orders AS (
  SELECT o.id, o.user_id, o.total, o.unidade_id
  FROM public.orders o
  WHERE COALESCE(o.cancelled,false) = true
),
already_refunded AS (
  SELECT order_id, SUM(amount) AS soma_refund
  FROM public.cash_transactions
  WHERE type = 'refund' AND order_id IS NOT NULL
  GROUP BY order_id
),
order_register AS (
  SELECT order_id, (array_agg(cash_register_id ORDER BY created_at DESC))[1] AS reg
  FROM public.cash_transactions
  WHERE order_id IS NOT NULL
  GROUP BY order_id
),
needed AS (
  SELECT co.id AS order_id, co.user_id, co.unidade_id,
         co.total - COALESCE(ar.soma_refund,0) AS missing,
         orr.reg
  FROM cancelled_orders co
  LEFT JOIN already_refunded ar ON ar.order_id = co.id
  LEFT JOIN order_register orr ON orr.order_id = co.id
)
INSERT INTO public.cash_transactions (user_id, cash_register_id, type, amount, description, order_id, created_at, unidade_id)
SELECT n.user_id,
       COALESCE(n.reg,
                (SELECT cr.id FROM public.cash_registers cr WHERE cr.user_id = n.user_id ORDER BY cr.created_at DESC LIMIT 1)),
       'refund',
       n.missing,
       'Estorno automático - pedido cancelado sem refund',
       n.order_id,
       now(),
       n.unidade_id
FROM needed n
WHERE n.missing >= 0.01
  AND COALESCE(n.reg,
        (SELECT cr.id FROM public.cash_registers cr WHERE cr.user_id = n.user_id ORDER BY cr.created_at DESC LIMIT 1)
      ) IS NOT NULL;
