-- Adicionar colunas payment_reference e payment_method à tabela user_subscriptions
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'manual';

-- Criar índice para busca rápida por referência de pagamento
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_payment_ref 
ON user_subscriptions(payment_reference);