
-- Create employee_slots table
CREATE TABLE public.employee_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES public.profiles(id),
  employee_id UUID REFERENCES public.depot_employees(id),
  payment_reference TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  amount_paid NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_slots ENABLE ROW LEVEL SECURITY;

-- Owner can read own slots
CREATE POLICY "Users can view own employee slots"
ON public.employee_slots FOR SELECT
USING (auth.uid() = owner_user_id);

-- Owner can insert own slots
CREATE POLICY "Users can insert own employee slots"
ON public.employee_slots FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

-- Owner can update own slots (to link employee_id)
CREATE POLICY "Users can update own employee slots"
ON public.employee_slots FOR UPDATE
USING (auth.uid() = owner_user_id);

-- Service role can do everything (for webhook)
CREATE POLICY "Service role full access on employee slots"
ON public.employee_slots FOR ALL
USING (true)
WITH CHECK (true);

-- Index for fast lookup of available slots
CREATE INDEX idx_employee_slots_owner_available 
ON public.employee_slots(owner_user_id, is_active, expires_at) 
WHERE employee_id IS NULL;

-- Trigger for updated_at
CREATE TRIGGER update_employee_slots_updated_at
BEFORE UPDATE ON public.employee_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
