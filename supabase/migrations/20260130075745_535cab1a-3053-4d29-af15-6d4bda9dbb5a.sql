-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admin full access config" ON shop_config;

-- Create more permissive policy for authenticated users
-- This allows any authenticated user to manage shop config
-- In production, you may want to add additional checks
CREATE POLICY "Authenticated users can manage shop config"
  ON shop_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Keep the public read policy
-- (already exists: "Public read config")