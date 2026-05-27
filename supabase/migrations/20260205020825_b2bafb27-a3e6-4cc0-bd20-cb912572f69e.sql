-- Atualizar a função shop_create_order_with_stock para usar status 'pending' que está no constraint
CREATE OR REPLACE FUNCTION public.shop_create_order_with_stock(
  p_shop_user_id TEXT,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_customer_document TEXT,
  p_shipping_address JSONB,
  p_items JSONB,
  p_notes TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_subtotal NUMERIC := 0;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_current_stock INTEGER;
BEGIN
  -- Calcular subtotal
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_subtotal := v_subtotal + (v_item->>'unit_price')::numeric * (v_item->>'quantity')::integer;
  END LOOP;

  -- Criar o pedido com status 'pending' (que está no constraint)
  INSERT INTO public.shop_orders (
    shop_user_id,
    customer_name,
    customer_email,
    customer_phone,
    customer_document,
    shipping_address,
    items,
    subtotal,
    shipping_cost,
    discount,
    total,
    status,
    notes
  ) VALUES (
    CASE WHEN p_shop_user_id = '' THEN NULL ELSE p_shop_user_id END,
    p_customer_name,
    p_customer_email,
    CASE WHEN p_customer_phone = '' THEN NULL ELSE p_customer_phone END,
    CASE WHEN p_customer_document = '' THEN NULL ELSE p_customer_document END,
    p_shipping_address,
    p_items,
    v_subtotal,
    0,
    0,
    v_subtotal,
    'pending',
    CASE WHEN p_notes = '' THEN NULL ELSE p_notes END
  )
  RETURNING id INTO v_order_id;

  -- Decrementar estoque de cada produto
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    
    -- Verificar estoque disponível
    SELECT stock_quantity INTO v_current_stock
    FROM public.shop_products
    WHERE id = v_product_id
    FOR UPDATE;
    
    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Estoque insuficiente para o produto %', v_product_id;
    END IF;
    
    -- Decrementar estoque
    UPDATE public.shop_products
    SET stock_quantity = stock_quantity - v_quantity,
        updated_at = now()
    WHERE id = v_product_id;
  END LOOP;

  RETURN v_order_id;
END;
$$;