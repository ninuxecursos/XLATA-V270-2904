-- Adicionar coluna ai_metadata no buffer do Telegram para armazenar parâmetros extraídos pela IA
ALTER TABLE telegram_product_buffer 
  ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT NULL;

COMMENT ON COLUMN telegram_product_buffer.ai_metadata IS 'Armazena parâmetros extraídos pela IA, incluindo configurações de venda interativa';