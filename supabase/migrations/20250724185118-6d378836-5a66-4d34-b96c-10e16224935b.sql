-- Create table for Mercado Pago payments if it doesn't exist
CREATE TABLE IF NOT EXISTS public.mercado_pago_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE,
  external_reference TEXT,
  status TEXT NOT NULL,
  status_detail TEXT,
  transaction_amount NUMERIC NOT NULL,
  payer_email TEXT NOT NULL,
  payment_method_id TEXT,
  qr_code TEXT,
  qr_code_base64 TEXT,
  ticket_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mercado_pago_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for mercado_pago_payments
CREATE POLICY "Users can view their own payments" 
ON public.mercado_pago_payments 
FOR SELECT 
USING (payer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Service role can manage all payments" 
ON public.mercado_pago_payments 
FOR ALL 
USING (current_setting('role') = 'service_role');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_mercado_pago_payments_payment_id ON public.mercado_pago_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_payments_payer_email ON public.mercado_pago_payments(payer_email);
CREATE INDEX IF NOT EXISTS idx_mercado_pago_payments_status ON public.mercado_pago_payments(status);