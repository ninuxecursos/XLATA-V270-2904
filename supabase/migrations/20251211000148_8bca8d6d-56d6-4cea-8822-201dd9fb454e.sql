-- Corrigir o plan_type duplicado do plano "semanal" que estava como 'monthly'
UPDATE subscription_plans 
SET plan_type = 'weekly' 
WHERE plan_id = 'semanal' AND plan_type = 'monthly';

-- Garantir que cada plan_type ativo seja único (criar index parcial)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_plans_unique_active_plan_type 
ON subscription_plans (plan_type) 
WHERE is_active = true;