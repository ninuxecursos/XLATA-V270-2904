-- Migrate all 'controle' subscription_plans to 'pro'
UPDATE subscription_plans SET tier = 'pro', name = REPLACE(name, 'Controle', 'Pro') WHERE tier = 'controle';

-- Migrate any active user_subscriptions with tier 'controle' to 'pro'
UPDATE user_subscriptions SET tier = 'pro' WHERE tier = 'controle';

-- Fix tesoura@mail.com: set tier to 'essencial'
UPDATE user_subscriptions SET tier = 'essencial' WHERE user_id = '9df06f30-7b7d-4253-a1ce-3ae49904c95b' AND is_active = true;