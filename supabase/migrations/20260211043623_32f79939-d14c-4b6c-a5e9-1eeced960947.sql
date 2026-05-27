
DROP FUNCTION IF EXISTS public.shop_create_order_pending(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT);

CREATE OR REPLACE FUNCTION public.shop_create_order_pending(
  p_shop_user_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT DEFAULT NULL,
  p_customer_document TEXT DEFAULT NULL,
  p_shipping_address JSONB DEFAULT '{}'::JSONB,
  p_items JSONB DEFAULT '[]'::JSONB,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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
  v_validated_user_id UUID;
BEGIN
  v_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

  -- Validate shop_user_id: if not found in shop_users, use NULL
  IF p_shop_user_id IS NOT NULL AND p_shop_user_id != '00000000-0000-0000-0000-000000000000'::UUID THEN
    SELECT id INTO v_validated_user_id
    FROM shop_users
    WHERE id = p_shop_user_id;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    v_unit_price := (v_item->>'unit_price')::NUMERIC;

    SELECT stock_quantity, name INTO v_current_stock, v_product_name
    FROM shop_products
    WHERE id = v_product_id;

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Produto não encontrado: %', v_product_id;
    END IF;

    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Estoque insuficiente para o produto %: disponível %, solicitado %', v_product_name, v_current_stock, v_quantity;
    END IF;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);

    v_items_array := v_items_array || jsonb_build_object(
      'product_id', v_product_id,
      'product_name', v_product_name,
      'quantity', v_quantity,
      'unit_price', v_unit_price,
      'total_price', v_unit_price * v_quantity
    );
  END LOOP;

  INSERT INTO shop_orders (
    order_number, shop_user_id, customer_name, customer_email,
    customer_phone, customer_document, shipping_address, items,
    subtotal, shipping_cost, discount, total, status, notes
  ) VALUES (
    v_order_number, v_validated_user_id, p_customer_name, p_customer_email,
    NULLIF(p_customer_phone, ''), NULLIF(p_customer_document, ''),
    COALESCE(p_shipping_address, '{}'::JSONB), v_items_array,
    v_subtotal, 0, 0, v_subtotal, 'pending', NULLIF(p_notes, '')
  )
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;
