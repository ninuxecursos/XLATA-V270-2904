
-- Drop the unique constraint that only allows one plan per plan_type
DROP INDEX IF EXISTS public.idx_subscription_plans_unique_active_plan_type;

-- Now insert the new tiered plans

-- Essencial Mensal (PRIORITY / HIGHLIGHT)
INSERT INTO public.subscription_plans (plan_id, plan_type, name, description, price, amount, period_days, period, display_order, is_active, is_popular, tier, badge_text)
VALUES ('essencial_mensal', 'monthly', 'Essencial Mensal', 'PDV, compras, despesas e histórico básico', 64.90, 64.90, 30, '/mês', 1, true, true, 'essencial', 'Mais Acessível');

-- Controle Mensal
INSERT INTO public.subscription_plans (plan_id, plan_type, name, description, price, amount, period_days, period, display_order, is_active, is_popular, tier, badge_text)
VALUES ('controle_mensal', 'monthly', 'Controle Mensal', 'Estoque, custos, relatórios e lucro por venda', 97.90, 97.90, 30, '/mês', 2, true, false, 'controle', 'Melhor Custo-Benefício');

-- Essencial Trimestral
INSERT INTO public.subscription_plans (plan_id, plan_type, name, description, price, amount, period_days, period, display_order, is_active, is_popular, tier, savings, promotional_price, promotional_period)
VALUES ('essencial_trimestral', 'quarterly', 'Essencial Trimestral', 'Essencial com desconto trimestral', 164.90, 164.90, 90, '/3 meses', 4, true, false, 'essencial', 'Economize R$ 29,80', 54.97, '/mês');

-- Essencial Anual
INSERT INTO public.subscription_plans (plan_id, plan_type, name, description, price, amount, period_days, period, display_order, is_active, is_popular, tier, savings, promotional_price, promotional_period)
VALUES ('essencial_anual', 'annual', 'Essencial Anual', 'Essencial com máxima economia', 584.90, 584.90, 365, '/ano', 5, true, false, 'essencial', 'Economize R$ 193,90', 48.74, '/mês');

-- Controle Trimestral
INSERT INTO public.subscription_plans (plan_id, plan_type, name, description, price, amount, period_days, period, display_order, is_active, is_popular, tier, savings, promotional_price, promotional_period)
VALUES ('controle_trimestral', 'quarterly', 'Controle Trimestral', 'Controle com desconto trimestral', 249.90, 249.90, 90, '/3 meses', 6, true, false, 'controle', 'Economize R$ 43,80', 83.30, '/mês');

-- Controle Anual
INSERT INTO public.subscription_plans (plan_id, plan_type, name, description, price, amount, period_days, period, display_order, is_active, is_popular, tier, savings, promotional_price, promotional_period)
VALUES ('controle_anual', 'annual', 'Controle Anual', 'Controle com máxima economia', 884.90, 884.90, 365, '/ano', 7, true, false, 'controle', 'Economize R$ 289,90', 73.74, '/mês');

-- Update existing plans to Pro tier with correct names
UPDATE public.subscription_plans 
SET name = 'Pro Mensal', description = 'Acesso completo a todas as funcionalidades', tier = 'pro', price = 137.90, amount = 137.90, display_order = 3, is_popular = false, badge_text = 'Tudo Liberado'
WHERE id = '2631f370-c50d-42e0-94e3-3d0dc99e0e44';

UPDATE public.subscription_plans 
SET name = 'Pro Trimestral', description = 'Acesso completo com desconto', tier = 'pro', price = 347.90, amount = 347.90, display_order = 8, is_popular = false,
    savings = 'Economize R$ 65,80', promotional_price = 115.97, promotional_period = '/mês'
WHERE id = '930beabc-a5fd-4627-b24c-34cad495cbf1';

UPDATE public.subscription_plans 
SET name = 'Pro Anual', description = 'Máxima economia no plano completo', tier = 'pro', price = 1284.90, amount = 1284.90, display_order = 9, is_popular = false,
    savings = 'Economize R$ 370,80', promotional_price = 107.08, promotional_period = '/mês'
WHERE id = 'a9020636-fcc1-452a-a48b-0144f3dbd7ae';
