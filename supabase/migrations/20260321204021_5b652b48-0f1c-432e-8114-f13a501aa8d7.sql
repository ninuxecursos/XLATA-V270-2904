-- Deactivate the old 'Controle' plans that are now duplicated as 'Pro'
-- Keep: 2631f370 (Pro Mensal), 930beabc (Pro Trimestral), a9020636 (Pro Anual)
-- Deactivate: b3e20bbd, 9cafba25, 1240786e (the converted Controle ones)
UPDATE subscription_plans SET is_active = false WHERE id IN ('b3e20bbd-166b-4f58-a500-d9fa96c0b71d', '9cafba25-4328-40ab-93b6-24c4deb39d9d', '1240786e-b808-479c-84f4-1c8e1098bee1');