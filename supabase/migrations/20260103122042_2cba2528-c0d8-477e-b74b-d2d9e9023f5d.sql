-- Allow admins to view all PIX payments
CREATE POLICY "Admins can view all payments"
ON mercado_pago_payments
FOR SELECT
USING (is_admin());