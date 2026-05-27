DELETE FROM tier_features WHERE feature_key IN ('basic_history', 'cash_summary');

INSERT INTO tier_features (tier_id, feature_key, feature_label, is_enabled)
SELECT id, 'cash_summary', 'Resumo de saldos no fechamento', true
FROM subscription_tiers WHERE name IN ('essencial', 'controle', 'pro');

INSERT INTO tier_features (tier_id, feature_key, feature_label, is_enabled)
SELECT id, 'basic_history', 'Histórico de compras e vendas', true
FROM subscription_tiers WHERE name IN ('controle', 'pro');