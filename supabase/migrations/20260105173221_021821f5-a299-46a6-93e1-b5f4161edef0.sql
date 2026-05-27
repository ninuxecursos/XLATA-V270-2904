-- Limpeza final
DELETE FROM public.audit_log WHERE created_at < NOW() - INTERVAL '30 days';
DELETE FROM public.user_presence WHERE last_seen_at < NOW() - INTERVAL '24 hours';
DELETE FROM public.rate_limit_attempts WHERE blocked_until < NOW();