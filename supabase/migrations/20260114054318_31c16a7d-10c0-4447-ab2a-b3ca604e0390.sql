-- Tabela para configuração dinâmica do gateway de pagamentos
CREATE TABLE IF NOT EXISTS payment_gateway_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name TEXT NOT NULL DEFAULT 'mercado_pago',
  is_active BOOLEAN DEFAULT true,
  environment TEXT DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  public_key TEXT,
  
  -- Métodos de pagamento
  pix_enabled BOOLEAN DEFAULT true,
  card_enabled BOOLEAN DEFAULT true,
  max_installments INTEGER DEFAULT 12,
  min_installment_value DECIMAL(10,2) DEFAULT 5.00,
  
  -- Notificações
  notification_email TEXT,
  notify_on_approval BOOLEAN DEFAULT true,
  notify_on_failure BOOLEAN DEFAULT true,
  
  -- Metadata
  webhook_url TEXT,
  last_test_at TIMESTAMPTZ,
  last_test_status TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(gateway_name)
);

-- RLS
ALTER TABLE payment_gateway_config ENABLE ROW LEVEL SECURITY;

-- Políticas: apenas admins podem ler/escrever
CREATE POLICY "Admin can read payment_gateway_config" ON payment_gateway_config
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin can insert payment_gateway_config" ON payment_gateway_config
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM admin_user_roles WHERE user_id = auth.uid() AND role IN ('admin_master', 'admin_operacional'))
  );

CREATE POLICY "Admin can update payment_gateway_config" ON payment_gateway_config
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_user_roles WHERE user_id = auth.uid() AND role IN ('admin_master', 'admin_operacional'))
  );

CREATE POLICY "Admin can delete payment_gateway_config" ON payment_gateway_config
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_user_roles WHERE user_id = auth.uid() AND role = 'admin_master')
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_payment_gateway_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_gateway_config_updated_at
  BEFORE UPDATE ON payment_gateway_config
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_gateway_config_updated_at();

-- Inserir config padrão do Mercado Pago
INSERT INTO payment_gateway_config (gateway_name, environment, webhook_url)
VALUES ('mercado_pago', 'sandbox', 'https://oxawvjcckmbevjztyfgp.supabase.co/functions/v1/webhook-mercado-pago')
ON CONFLICT (gateway_name) DO NOTHING;