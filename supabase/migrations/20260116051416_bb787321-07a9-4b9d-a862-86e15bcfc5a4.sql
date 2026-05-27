-- Permitir que usuários autenticados leiam a configuração pública do gateway de pagamentos
-- A public_key do Mercado Pago é segura para exposição (por isso se chama "pública")
-- Isso é necessário para inicializar o formulário de pagamento com cartão

CREATE POLICY "Authenticated users can read active gateway config" 
ON payment_gateway_config
FOR SELECT 
TO authenticated
USING (is_active = true);