-- Adicionar coluna para progresso do onboarding na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_progress JSONB 
DEFAULT '{
  "currentStep": 0,
  "completedSteps": [],
  "pageVisits": {},
  "featureUnlocks": [],
  "startedAt": null,
  "completedAt": null
}'::jsonb;

-- Adicionar coluna para controle se onboarding foi concluído
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Criar índice para buscar usuários em onboarding
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON public.profiles(onboarding_completed) 
WHERE onboarding_completed = false;