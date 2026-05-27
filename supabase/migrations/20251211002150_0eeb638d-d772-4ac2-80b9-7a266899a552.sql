-- Add period_days column to subscription_plans for explicit duration control
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS period_days INTEGER DEFAULT 30;

-- Update existing plans with correct period_days
UPDATE public.subscription_plans SET period_days = 7 WHERE plan_type = 'trial' OR plan_type = 'weekly';
UPDATE public.subscription_plans SET period_days = 30 WHERE plan_type = 'monthly';
UPDATE public.subscription_plans SET period_days = 90 WHERE plan_type = 'quarterly';
UPDATE public.subscription_plans SET period_days = 180 WHERE plan_type = 'biannual' OR plan_type = 'semi_annual';
UPDATE public.subscription_plans SET period_days = 365 WHERE plan_type = 'annual' OR plan_type = 'yearly';
UPDATE public.subscription_plans SET period_days = 1095 WHERE plan_type = 'triennial';

-- Add comment explaining the column
COMMENT ON COLUMN public.subscription_plans.period_days IS 'Exact number of days this plan provides. This is the source of truth for subscription duration.';