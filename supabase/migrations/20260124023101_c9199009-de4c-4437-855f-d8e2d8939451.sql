-- Add columns to track previous prices for variation indicators
ALTER TABLE materials 
  ADD COLUMN IF NOT EXISTS previous_price numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS previous_sale_price numeric DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN materials.previous_price IS 'Previous purchase price before last update, used for price variation indicators';
COMMENT ON COLUMN materials.previous_sale_price IS 'Previous sale price before last update, used for price variation indicators';