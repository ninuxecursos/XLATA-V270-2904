
-- Fix finalize_interactive_event RPC to use correct column names
-- shop_users.phone instead of whatsapp
-- shop_orders.customer_phone instead of customer_whatsapp

CREATE OR REPLACE FUNCTION public.finalize_interactive_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_winning_offer RECORD;
  v_order_id UUID;
  v_result JSONB;
BEGIN
  -- Get event details with product info
  SELECT e.*, p.name as product_name, p.images as product_images
  INTO v_event
  FROM shop_interactive_events e
  JOIN shop_products p ON p.id = e.product_id
  WHERE e.id = p_event_id AND e.status = 'active';
  
  IF v_event IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found or not active');
  END IF;
  
  -- Check if event has ended
  IF v_event.end_at > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event has not ended yet');
  END IF;
  
  -- Find winning offer (highest valid offer) - FIXED: use phone instead of whatsapp
  SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
  INTO v_winning_offer
  FROM shop_interactive_offers o
  JOIN shop_users u ON u.id = o.user_id
  WHERE o.event_id = p_event_id AND o.is_valid = true
  ORDER BY o.offer_value DESC
  LIMIT 1;
  
  IF v_winning_offer IS NULL THEN
    -- No offers - mark as cancelled and schedule reactivation
    UPDATE shop_interactive_events
    SET 
      status = 'cancelled',
      reactivate_at = now() + INTERVAL '3 days',
      reactivation_initial_value = initial_value,
      updated_at = now()
    WHERE id = p_event_id;
    
    -- Deactivate product temporarily
    UPDATE shop_products
    SET is_active = false, updated_at = now()
    WHERE id = v_event.product_id;
    
    v_result := jsonb_build_object(
      'success', true,
      'result', 'no_offers',
      'message', 'Event cancelled - no offers received. Product will reactivate in 3 days.',
      'reactivate_at', (now() + INTERVAL '3 days')::text
    );
  ELSE
    -- Mark winning offer
    UPDATE shop_interactive_offers
    SET is_winning = true
    WHERE id = v_winning_offer.id;
    
    -- Create order for winner - FIXED: use customer_phone instead of customer_whatsapp
    INSERT INTO shop_orders (
      shop_user_id,
      status,
      total,
      customer_name,
      customer_email,
      customer_phone,
      notes,
      items,
      subtotal,
      shipping_cost,
      discount
    ) VALUES (
      v_winning_offer.user_id,
      'pendente',
      v_winning_offer.offer_value,
      v_winning_offer.user_name,
      v_winning_offer.user_email,
      v_winning_offer.user_phone,
      'Pedido gerado automaticamente - Venda Interativa: ' || v_event.product_name,
      jsonb_build_array(jsonb_build_object(
        'product_id', v_event.product_id,
        'product_name', v_event.product_name,
        'quantity', 1,
        'unit_price', v_winning_offer.offer_value,
        'total_price', v_winning_offer.offer_value
      )),
      v_winning_offer.offer_value,
      0,
      0
    )
    RETURNING id INTO v_order_id;
    
    -- Update event status
    UPDATE shop_interactive_events
    SET 
      status = 'finished',
      winner_user_id = v_winning_offer.user_id,
      winning_offer_id = v_winning_offer.id,
      final_order_id = v_order_id,
      updated_at = now()
    WHERE id = p_event_id;
    
    -- Decrement product stock
    UPDATE shop_products
    SET 
      stock_quantity = GREATEST(0, stock_quantity - 1),
      sold_count = sold_count + 1,
      updated_at = now()
    WHERE id = v_event.product_id;
    
    v_result := jsonb_build_object(
      'success', true,
      'result', 'completed',
      'order_id', v_order_id,
      'winner_id', v_winning_offer.user_id,
      'final_value', v_winning_offer.offer_value
    );
  END IF;
  
  RETURN v_result;
END;
$$;
