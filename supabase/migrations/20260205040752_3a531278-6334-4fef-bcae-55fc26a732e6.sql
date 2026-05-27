-- Adicionar colunas de auto-repost na tabela shop_interactive_events
ALTER TABLE shop_interactive_events 
  ADD COLUMN IF NOT EXISTS auto_repost_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_repost_delay_days INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS current_repost_number INTEGER DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN shop_interactive_events.auto_repost_count IS 'Quantas vezes repostar automaticamente se não houver vencedor (0 = sem repost)';
COMMENT ON COLUMN shop_interactive_events.auto_repost_delay_days IS 'Dias de intervalo entre cada repost automático';
COMMENT ON COLUMN shop_interactive_events.current_repost_number IS 'Contador de quantos reposts já foram realizados';