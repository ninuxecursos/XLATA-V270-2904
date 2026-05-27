-- Drop existing constraint and recreate with 'refund' type
ALTER TABLE public.cash_transactions 
DROP CONSTRAINT IF EXISTS cash_transactions_type_check;

ALTER TABLE public.cash_transactions
ADD CONSTRAINT cash_transactions_type_check 
CHECK (type = ANY (ARRAY['opening'::text, 'closing'::text, 'sale'::text, 'purchase'::text, 'addition'::text, 'expense'::text, 'refund'::text]));