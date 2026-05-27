-- Add first_login_completed column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_login_completed BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_first_login
ON public.profiles(first_login_completed)
WHERE first_login_completed = false;

COMMENT ON COLUMN public.profiles.first_login_completed IS
'Flag to indicate if user has completed first login and saw welcome modal';