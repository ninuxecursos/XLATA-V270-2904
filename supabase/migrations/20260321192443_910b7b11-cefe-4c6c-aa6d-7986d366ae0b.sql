
-- Clear existing tier_features and re-insert with correct mapping
DELETE FROM tier_features;

-- ESSENCIAL features
INSERT INTO tier_features (tier_id, feature_key, feature_label, is_enabled) VALUES
  ('b8e95c22-aba0-4946-b04d-a27366db6a19', 'pdv_access', 'PDV (compra e venda)', true),
  ('b8e95c22-aba0-4946-b04d-a27366db6a19', 'register_purchases', 'Registrar compras', true),
  ('b8e95c22-aba0-4946-b04d-a27366db6a19', 'register_expenses', 'Registrar despesas', true),
  ('b8e95c22-aba0-4946-b04d-a27366db6a19', 'basic_history', 'Histórico básico', true),
  ('b8e95c22-aba0-4946-b04d-a27366db6a19', 'print_receipts', 'Impressão de comprovantes', true),
  ('b8e95c22-aba0-4946-b04d-a27366db6a19', 'cash_register', 'Abertura/fechamento de caixa', true),
  ('b8e95c22-aba0-4946-b04d-a27366db6a19', 'avulsa_sales', 'Venda avulsa com valor livre', true);

-- CONTROLE features (inclui tudo do essencial + extras)
INSERT INTO tier_features (tier_id, feature_key, feature_label, is_enabled) VALUES
  ('b3d515d6-66b5-4139-aef2-079bd163eec4', 'pdv_access', 'PDV (compra e venda)', true),
  ('b3d515d6-66b5-4139-aef2-079bd163eec4', 'register_purchases', 'Registrar compras', true),
  ('b3d515d6-66b5-4139-aef2-079bd163eec4', 'register_expenses', 'Registrar despesas', true),
  ('b3d515d6-66b5-4139-aef2-079bd163eec4', 'basic_history', 'Histórico básico', true),
  ('b3d515d6-66b5-4139-aef2-079bd163eec4', 'print_receipts', 'Impressão de comprovantes', true),
  ('b3d515d6-66b5-4139-aef2-079bd163eec4', 'cash_register', 'Abertura/fechamento de caixa', true),
  ('b3d515d6-66b5-4139-aef2-079bd163eec4', 'avulsa_sales', 'Venda avulsa com valor livre', true),
  ('b3d515d6-66b5-4139-aef2-079bd163eec4', 'stock_control', 'Controle de estoque automático', true),
  ('b3d515d6-66b5-4139-aef2-079bd163eec4', 'cost_tracking', 'Rastreamento de custos', true),
  ('b3d515d6-66b5-4139-aef2-079bd163eec4', 'basic_reports', 'Relatórios detalhados', true),
  ('b3d515d6-66b5-4139-aef2-079bd163eec4', 'profit_per_sale', 'Lucro por venda', true),
  ('b3d515d6-66b5-4139-aef2-079bd163eec4', 'client_management', 'Cadastro de clientes', true),
  ('b3d515d6-66b5-4139-aef2-079bd163eec4', 'employee_management', 'Gestão de funcionários', true);

-- PRO features (inclui tudo do controle + extras)
INSERT INTO tier_features (tier_id, feature_key, feature_label, is_enabled) VALUES
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'pdv_access', 'PDV (compra e venda)', true),
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'register_purchases', 'Registrar compras', true),
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'register_expenses', 'Registrar despesas', true),
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'basic_history', 'Histórico básico', true),
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'print_receipts', 'Impressão de comprovantes', true),
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'cash_register', 'Abertura/fechamento de caixa', true),
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'avulsa_sales', 'Venda avulsa com valor livre', true),
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'stock_control', 'Controle de estoque automático', true),
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'cost_tracking', 'Rastreamento de custos', true),
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'basic_reports', 'Relatórios detalhados', true),
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'profit_per_sale', 'Lucro por venda', true),
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'client_management', 'Cadastro de clientes', true),
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'employee_management', 'Gestão de funcionários', true),
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'advanced_dashboard', 'Dashboard avançado', true),
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'profit_projections', 'Projeções de lucro', true),
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'advanced_analytics', 'Analytics avançado', true),
  ('04155dc3-c226-43da-bfdd-9c9cd81cb60a', 'export_csv_excel', 'Exportar CSV/Excel', true);
