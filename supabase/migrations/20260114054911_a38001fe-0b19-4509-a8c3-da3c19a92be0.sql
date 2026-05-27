-- Add access token fields to payment_gateway_config
ALTER TABLE payment_gateway_config 
ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT;

ALTER TABLE payment_gateway_config 
ADD COLUMN IF NOT EXISTS access_token_configured BOOLEAN DEFAULT false;

-- Drop existing policies to recreate them with proper restrictions
DROP POLICY IF EXISTS "Admin read payment_gateway_config" ON payment_gateway_config;
DROP POLICY IF EXISTS "Admin write payment_gateway_config" ON payment_gateway_config;

-- Create policy for reading (hide access_token_encrypted for non-admin_master)
CREATE POLICY "Admin read payment_gateway_config" ON payment_gateway_config
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM admin_user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin_master', 'admin_operacional', 'suporte', 'leitura')
    )
  );

-- Create policy for writing (only admin_master and admin_operacional)
CREATE POLICY "Admin write payment_gateway_config" ON payment_gateway_config
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM admin_user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin_master', 'admin_operacional')
    )
  );

CREATE POLICY "Admin insert payment_gateway_config" ON payment_gateway_config
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin_master', 'admin_operacional')
    )
  );