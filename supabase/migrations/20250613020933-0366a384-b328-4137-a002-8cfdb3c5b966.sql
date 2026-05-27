
-- Criar tabela para armazenar informações de pagamento dos pedidos
CREATE TABLE public.order_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('debito', 'credito', 'dinheiro', 'pix')),
  pix_key_type TEXT CHECK (pix_key_type IN ('cpf', 'celular', 'email')),
  pix_key_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS policies
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

-- Policy para usuários visualizarem seus próprios pagamentos
CREATE POLICY "Users can view their own order payments" 
  ON public.order_payments 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy para usuários criarem seus próprios pagamentos
CREATE POLICY "Users can create their own order payments" 
  ON public.order_payments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy para usuários atualizarem seus próprios pagamentos
CREATE POLICY "Users can update their own order payments" 
  ON public.order_payments 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy para usuários deletarem seus próprios pagamentos
CREATE POLICY "Users can delete their own order payments" 
  ON public.order_payments 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_order_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_payments_updated_at
  BEFORE UPDATE ON public.order_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_payments_updated_at();
