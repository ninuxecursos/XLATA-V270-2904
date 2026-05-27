-- Drop the problematic policy that accesses auth.users directly
DROP POLICY IF EXISTS "Users can view their own payments" ON public.mercado_pago_payments;

-- Create a new policy that uses profiles table instead (which is accessible)
CREATE POLICY "Users can view their own payments" 
ON public.mercado_pago_payments 
FOR SELECT 
USING (
  payer_email = (
    SELECT email FROM public.profiles WHERE id = auth.uid()
  )
);