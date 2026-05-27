-- Adicionar campos de lucro bruto e líquido na tabela cash_registers
ALTER TABLE cash_registers 
ADD COLUMN IF NOT EXISTS gross_profit numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_profit numeric DEFAULT 0;

-- Adicionar comentários para documentação
COMMENT ON COLUMN cash_registers.gross_profit IS 'Lucro bruto do período (total de vendas)';
COMMENT ON COLUMN cash_registers.net_profit IS 'Lucro líquido do período (vendas - compras - despesas)';