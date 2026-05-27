-- Drop existing function first (different return type)
DROP FUNCTION IF EXISTS finalize_interactive_event(UUID);

-- 1. Update finalize_interactive_event function to handle reactivation
CREATE OR REPLACE FUNCTION finalize_interactive_event(p_event_id UUID)
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
  
  -- Find winning offer (highest valid offer)
  SELECT o.*, u.name as user_name, u.email as user_email, u.whatsapp as user_whatsapp
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
    
    -- Create order for winner
    INSERT INTO shop_orders (
      user_id,
      status,
      payment_status,
      total,
      customer_name,
      customer_email,
      customer_whatsapp,
      notes
    ) VALUES (
      v_winning_offer.user_id,
      'pending',
      'pending',
      v_winning_offer.offer_value,
      v_winning_offer.user_name,
      v_winning_offer.user_email,
      v_winning_offer.user_whatsapp,
      'Pedido gerado automaticamente - Venda Interativa: ' || v_event.product_name
    )
    RETURNING id INTO v_order_id;
    
    -- Create order item
    INSERT INTO shop_order_items (
      order_id,
      product_id,
      product_name,
      product_image,
      quantity,
      price
    ) VALUES (
      v_order_id,
      v_event.product_id,
      v_event.product_name,
      COALESCE(v_event.product_images[1], ''),
      1,
      v_winning_offer.offer_value
    );
    
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

-- 2. Create function to reactivate products after cooldown
CREATE OR REPLACE FUNCTION reactivate_cooled_down_products()
RETURNS TABLE(
  event_id UUID,
  product_id UUID,
  new_event_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_new_event_id UUID;
  v_config RECORD;
BEGIN
  -- Get default config
  SELECT * INTO v_config FROM shop_interactive_config LIMIT 1;
  
  -- Find events ready for reactivation
  FOR v_event IN
    SELECT e.id, e.product_id, e.reactivation_initial_value, e.minimum_increment
    FROM shop_interactive_events e
    WHERE e.status = 'cancelled'
      AND e.reactivate_at IS NOT NULL
      AND e.reactivate_at <= now()
  LOOP
    -- Reactivate product
    UPDATE shop_products
    SET is_active = true, updated_at = now()
    WHERE id = v_event.product_id;
    
    -- Create new interactive event
    INSERT INTO shop_interactive_events (
      product_id,
      initial_value,
      current_value,
      minimum_increment,
      start_at,
      end_at,
      status
    ) VALUES (
      v_event.product_id,
      v_event.reactivation_initial_value,
      v_event.reactivation_initial_value,
      COALESCE(v_event.minimum_increment, v_config.default_increment, 10),
      now(),
      now() + (COALESCE(v_config.default_duration_minutes, 1440) || ' minutes')::INTERVAL,
      'active'
    )
    RETURNING id INTO v_new_event_id;
    
    -- Clear reactivation flag from old event
    UPDATE shop_interactive_events
    SET reactivate_at = NULL
    WHERE id = v_event.id;
    
    event_id := v_event.id;
    product_id := v_event.product_id;
    new_event_id := v_new_event_id;
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;