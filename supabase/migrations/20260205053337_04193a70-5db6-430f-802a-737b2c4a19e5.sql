-- Criar uma nova função RPC que cria pedido SEM decrementar estoque
-- O estoque será decrementado apenas quando o pagamento for aprovado
CREATE OR REPLACE FUNCTION shop_create_order_pending(
  p_shop_user_id UUID DEFAULT NULL,
  p_customer_name TEXT DEFAULT '',
  p_customer_email TEXT DEFAULT '',
  p_customer_phone TEXT DEFAULT NULL,
  p_customer_document TEXT DEFAULT NULL,
  p_shipping_address JSONB DEFAULT '{}'::JSONB,
  p_items JSONB DEFAULT '[]'::JSONB,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_unit_price NUMERIC;
  v_current_stock INTEGER;
  v_subtotal NUMERIC := 0;
  v_items_array JSONB := '[]'::JSONB;
  v_product_name TEXT;
BEGIN
  -- Generate order number
  v_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

  -- Validate and process each item (check stock but DON'T decrement)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    v_unit_price := (v_item->>'unit_price')::NUMERIC;

    -- Get current stock and product name
    SELECT stock_quantity, name INTO v_current_stock, v_product_name
    FROM shop_products
    WHERE id = v_product_id;

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Produto não encontrado: %', v_product_id;
    END IF;

    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Estoque insuficiente para o produto %: disponível %, solicitado %', v_product_name, v_current_stock, v_quantity;
    END IF;

    -- Calculate subtotal (NO stock decrement here!)
    v_subtotal := v_subtotal + (v_unit_price * v_quantity);

    -- Build items array for the order
    v_items_array := v_items_array || jsonb_build_object(
      'product_id', v_product_id,
      'product_name', v_product_name,
      'quantity', v_quantity,
      'unit_price', v_unit_price,
      'total_price', v_unit_price * v_quantity
    );
  END LOOP;

  -- Create the order with 'pending' status (stock NOT decremented yet)
  INSERT INTO shop_orders (
    order_number,
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
    v_order_number,
    NULLIF(p_shop_user_id, '00000000-0000-0000-0000-000000000000'::UUID),
    p_customer_name,
    p_customer_email,
    NULLIF(p_customer_phone, ''),
    NULLIF(p_customer_document, ''),
    COALESCE(p_shipping_address, '{}'::JSONB),
    v_items_array,
    v_subtotal,
    0,
    0,
    v_subtotal,
    'pending',
    NULLIF(p_notes, '')
  )
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

-- Criar função para decrementar estoque quando pagamento for aprovado
CREATE OR REPLACE FUNCTION shop_confirm_order_stock(
  p_order_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_current_stock INTEGER;
BEGIN
  -- Get order and check if it's pending
  SELECT * INTO v_order FROM shop_orders WHERE id = p_order_id;
  
  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado: %', p_order_id;
  END IF;
  
  -- Only decrement stock for pending orders (not already paid/processed)
  IF v_order.status NOT IN ('pending', 'pendente') THEN
    -- Already processed, return success
    RETURN TRUE;
  END IF;
  
  -- Decrement stock for each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    
    -- Check current stock
    SELECT stock_quantity INTO v_current_stock
    FROM shop_products
    WHERE id = v_product_id;
    
    IF v_current_stock < v_quantity THEN
      -- Log but don't fail - the payment is already approved
      RAISE WARNING 'Estoque insuficiente para produto %, mas pagamento já aprovado', v_product_id;
    END IF;
    
    -- Decrement stock atomically
    UPDATE shop_products
    SET stock_quantity = GREATEST(0, stock_quantity - v_quantity),
        updated_at = NOW()
    WHERE id = v_product_id;
  END LOOP;
  
  RETURN TRUE;
END;
$$;