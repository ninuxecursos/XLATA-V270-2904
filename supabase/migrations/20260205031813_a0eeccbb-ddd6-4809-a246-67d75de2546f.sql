-- Create interactive event for the existing product that was activated via Telegram
-- Product ID: 6d9a1c43-5668-472e-b6d4-6e3f22f2d584
-- Using default config: 5 minutes duration, 5.00 increment

INSERT INTO shop_interactive_events (
  product_id,
  initial_value,
  current_value,
  minimum_increment,
  start_at,
  end_at,
  status
)
SELECT 
  '6d9a1c43-5668-472e-b6d4-6e3f22f2d584' as product_id,
  500.00 as initial_value,
  500.00 as current_value,
  5.00 as minimum_increment,
  now() as start_at,
  now() + interval '60 minutes' as end_at,  -- 1 hour for better testing
  'active' as status
WHERE NOT EXISTS (
  SELECT 1 FROM shop_interactive_events 
  WHERE product_id = '6d9a1c43-5668-472e-b6d4-6e3f22f2d584'
  AND status IN ('active', 'scheduled')
);