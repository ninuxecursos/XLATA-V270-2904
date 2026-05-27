
-- Fix 1: Update finalize_interactive_event to use auto_repost_delay_days instead of hardcoded 3 days
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
  v_cooldown_days INT;
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
  
  -- Calculate cooldown days (use configured value or default to 3)
  v_cooldown_days := COALESCE(v_event.auto_repost_delay_days, 3);
  
  -- Find winning offer (highest valid offer)
  SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
  INTO v_winning_offer
  FROM shop_interactive_offers o
  JOIN shop_users u ON u.id = o.user_id
  WHERE o.event_id = p_event_id AND o.is_valid = true
  ORDER BY o.offer_value DESC
  LIMIT 1;
  
  IF v_winning_offer IS NULL THEN
    -- No offers - mark as cancelled and schedule reactivation using configured delay
    UPDATE shop_interactive_events
    SET 
      status = 'cancelled',
      reactivate_at = now() + (v_cooldown_days || ' days')::INTERVAL,
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
      'message', 'Event cancelled - no offers received. Product will reactivate in ' || v_cooldown_days || ' days.',
      'reactivate_at', (now() + (v_cooldown_days || ' days')::INTERVAL)::text
    );
  ELSE
    -- Mark winning offer
    UPDATE shop_interactive_offers
    SET is_winning = true
    WHERE id = v_winning_offer.id;
    
    -- Create order for winner - using 'pendente' status
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

-- Fix 2: Update reactivate_cooled_down_products to respect auto_repost_count
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
  
  -- Find events ready for reactivation, respecting auto_repost_count limit
  FOR v_event IN
    SELECT e.id, e.product_id, e.reactivation_initial_value, e.minimum_increment,
           e.auto_repost_count, e.auto_repost_delay_days, e.current_repost_number
    FROM shop_interactive_events e
    WHERE e.status = 'cancelled'
      AND e.reactivate_at IS NOT NULL
      AND e.reactivate_at <= now()
      AND (
        e.auto_repost_count IS NULL 
        OR e.auto_repost_count = 0 
        OR COALESCE(e.current_repost_number, 0) < e.auto_repost_count
      )
  LOOP
    -- Reactivate product
    UPDATE shop_products
    SET is_active = true, updated_at = now()
    WHERE id = v_event.product_id;
    
    -- Create new interactive event with repost metadata
    INSERT INTO shop_interactive_events (
      product_id,
      initial_value,
      current_value,
      minimum_increment,
      start_at,
      end_at,
      status,
      auto_repost_count,
      auto_repost_delay_days,
      current_repost_number
    ) VALUES (
      v_event.product_id,
      v_event.reactivation_initial_value,
      v_event.reactivation_initial_value,
      COALESCE(v_event.minimum_increment, v_config.default_increment, 10),
      now(),
      now() + (COALESCE(v_config.default_duration_minutes, 1440) || ' minutes')::INTERVAL,
      'active',
      v_event.auto_repost_count,
      v_event.auto_repost_delay_days,
      COALESCE(v_event.current_repost_number, 0) + 1
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
