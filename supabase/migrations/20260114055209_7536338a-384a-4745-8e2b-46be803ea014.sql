-- Add webhook secret signature field
ALTER TABLE payment_gateway_config 
ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

ALTER TABLE payment_gateway_config 
ADD COLUMN IF NOT EXISTS webhook_secret_configured BOOLEAN DEFAULT false;