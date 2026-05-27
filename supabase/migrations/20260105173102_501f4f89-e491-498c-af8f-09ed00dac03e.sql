-- Limpeza em lote (Parte 10)
DELETE FROM public.audit_log 
WHERE id IN (
  SELECT id FROM public.audit_log 
  WHERE created_at < NOW() - INTERVAL '30 days' 
  LIMIT 100000
);