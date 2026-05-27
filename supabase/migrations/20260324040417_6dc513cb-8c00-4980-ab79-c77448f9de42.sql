CREATE OR REPLACE FUNCTION public.get_system_cleanup_metrics(p_retention_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_cutoff timestamptz := now() - make_interval(days => GREATEST(COALESCE(p_retention_days, 30), 0));
  v_now timestamptz := now();
  v_table_sizes jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT COALESCE(
    jsonb_object_agg(t.tablename, pg_total_relation_size(to_regclass(format('%I.%I', t.schemaname, t.tablename)))),
    '{}'::jsonb
  )
  INTO v_table_sizes
  FROM pg_tables t
  WHERE t.schemaname = 'public';

  RETURN jsonb_build_object(
    'counts', jsonb_build_object(
      'logs', (
        SELECT COUNT(*)::bigint FROM public.audit_log WHERE created_at < v_cutoff
      ) + (
        SELECT COUNT(*)::bigint FROM public.admin_access_logs WHERE created_at < v_cutoff
      ) + (
        SELECT COUNT(*)::bigint FROM public.admin_audit_logs WHERE created_at < v_cutoff
      ) + (
        SELECT COUNT(*)::bigint FROM public.employee_action_logs WHERE created_at < v_cutoff
      ),
      'sessions', (
        SELECT COUNT(*)::bigint FROM public.active_sessions WHERE is_active = false
      ) + (
        SELECT COUNT(*)::bigint FROM public.pdv_sessions WHERE is_active = false
      ) + (
        SELECT COUNT(*)::bigint FROM public.unidade_sessions WHERE is_active = false
      ) + (
        SELECT COUNT(*)::bigint FROM public.user_presence WHERE last_seen_at < v_cutoff
      ),
      'ratelimits', (
        SELECT COUNT(*)::bigint FROM public.rate_limit_attempts WHERE first_attempt_at < v_cutoff
      ),
      'notifications', (
        SELECT COUNT(*)::bigint FROM public.admin_messages WHERE expires_at < v_now
      ) + (
        SELECT COUNT(*)::bigint FROM public.global_notifications WHERE expires_at < v_now
      ) + (
        SELECT COUNT(*)::bigint FROM public.admin_realtime_messages WHERE expires_at < v_now
      ) + (
        SELECT COUNT(*)::bigint FROM public.user_direct_messages WHERE expires_at < v_now
      )
    ),
    'table_counts', jsonb_build_object(
      'audit_log', (SELECT COUNT(*)::bigint FROM public.audit_log WHERE created_at < v_cutoff),
      'admin_access_logs', (SELECT COUNT(*)::bigint FROM public.admin_access_logs WHERE created_at < v_cutoff),
      'admin_audit_logs', (SELECT COUNT(*)::bigint FROM public.admin_audit_logs WHERE created_at < v_cutoff),
      'employee_action_logs', (SELECT COUNT(*)::bigint FROM public.employee_action_logs WHERE created_at < v_cutoff),
      'active_sessions', (SELECT COUNT(*)::bigint FROM public.active_sessions WHERE is_active = false),
      'pdv_sessions', (SELECT COUNT(*)::bigint FROM public.pdv_sessions WHERE is_active = false),
      'unidade_sessions', (SELECT COUNT(*)::bigint FROM public.unidade_sessions WHERE is_active = false),
      'user_presence', (SELECT COUNT(*)::bigint FROM public.user_presence WHERE last_seen_at < v_cutoff),
      'rate_limit_attempts', (SELECT COUNT(*)::bigint FROM public.rate_limit_attempts WHERE first_attempt_at < v_cutoff),
      'admin_messages', (SELECT COUNT(*)::bigint FROM public.admin_messages WHERE expires_at < v_now),
      'admin_message_recipients', (SELECT COUNT(*)::bigint FROM public.admin_message_recipients amr WHERE EXISTS (SELECT 1 FROM public.admin_messages am WHERE am.id = amr.message_id AND am.expires_at < v_now)),
      'global_notifications', (SELECT COUNT(*)::bigint FROM public.global_notifications WHERE expires_at < v_now),
      'global_notification_recipients', (SELECT COUNT(*)::bigint FROM public.global_notification_recipients gnr WHERE EXISTS (SELECT 1 FROM public.global_notifications gn WHERE gn.id = gnr.notification_id AND gn.expires_at < v_now)),
      'admin_realtime_messages', (SELECT COUNT(*)::bigint FROM public.admin_realtime_messages WHERE expires_at < v_now),
      'user_direct_messages', (SELECT COUNT(*)::bigint FROM public.user_direct_messages WHERE expires_at < v_now)
    ),
    'table_sizes', v_table_sizes
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_system_data(p_section text, p_retention_days integer DEFAULT 30, p_batch_size integer DEFAULT 5000)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cutoff timestamptz := now() - make_interval(days => GREATEST(COALESCE(p_retention_days, 30), 0));
  v_now timestamptz := now();
  v_batch_size integer := GREATEST(COALESCE(p_batch_size, 5000), 100);
  v_deleted integer;
  v_total_deleted integer := 0;
  v_result jsonb := '{}'::jsonb;
  v_section text := lower(COALESCE(p_section, ''));
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF v_section NOT IN ('logs', 'sessions', 'ratelimits', 'notifications', 'all') THEN
    RAISE EXCEPTION 'Seção inválida: %', p_section;
  END IF;

  IF v_section IN ('logs', 'all') THEN
    LOOP
      WITH batch AS (
        SELECT ctid FROM public.audit_log WHERE created_at < v_cutoff LIMIT v_batch_size
      )
      DELETE FROM public.audit_log t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_result := jsonb_set(v_result, '{audit_log}', to_jsonb(COALESCE((v_result->>'audit_log')::integer, 0) + v_deleted), true);
    END LOOP;

    LOOP
      WITH batch AS (
        SELECT ctid FROM public.admin_access_logs WHERE created_at < v_cutoff LIMIT v_batch_size
      )
      DELETE FROM public.admin_access_logs t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_result := jsonb_set(v_result, '{admin_access_logs}', to_jsonb(COALESCE((v_result->>'admin_access_logs')::integer, 0) + v_deleted), true);
    END LOOP;

    LOOP
      WITH batch AS (
        SELECT ctid FROM public.admin_audit_logs WHERE created_at < v_cutoff LIMIT v_batch_size
      )
      DELETE FROM public.admin_audit_logs t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_result := jsonb_set(v_result, '{admin_audit_logs}', to_jsonb(COALESCE((v_result->>'admin_audit_logs')::integer, 0) + v_deleted), true);
    END LOOP;

    LOOP
      WITH batch AS (
        SELECT ctid FROM public.employee_action_logs WHERE created_at < v_cutoff LIMIT v_batch_size
      )
      DELETE FROM public.employee_action_logs t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_result := jsonb_set(v_result, '{employee_action_logs}', to_jsonb(COALESCE((v_result->>'employee_action_logs')::integer, 0) + v_deleted), true);
    END LOOP;
  END IF;

  IF v_section IN ('sessions', 'all') THEN
    LOOP
      WITH batch AS (
        SELECT ctid FROM public.active_sessions WHERE is_active = false LIMIT v_batch_size
      )
      DELETE FROM public.active_sessions t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_result := jsonb_set(v_result, '{active_sessions}', to_jsonb(COALESCE((v_result->>'active_sessions')::integer, 0) + v_deleted), true);
    END LOOP;

    LOOP
      WITH batch AS (
        SELECT ctid FROM public.pdv_sessions WHERE is_active = false LIMIT v_batch_size
      )
      DELETE FROM public.pdv_sessions t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_result := jsonb_set(v_result, '{pdv_sessions}', to_jsonb(COALESCE((v_result->>'pdv_sessions')::integer, 0) + v_deleted), true);
    END LOOP;

    LOOP
      WITH batch AS (
        SELECT ctid FROM public.unidade_sessions WHERE is_active = false LIMIT v_batch_size
      )
      DELETE FROM public.unidade_sessions t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_result := jsonb_set(v_result, '{unidade_sessions}', to_jsonb(COALESCE((v_result->>'unidade_sessions')::integer, 0) + v_deleted), true);
    END LOOP;

    LOOP
      WITH batch AS (
        SELECT ctid FROM public.user_presence WHERE last_seen_at < v_cutoff LIMIT v_batch_size
      )
      DELETE FROM public.user_presence t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_result := jsonb_set(v_result, '{user_presence}', to_jsonb(COALESCE((v_result->>'user_presence')::integer, 0) + v_deleted), true);
    END LOOP;
  END IF;

  IF v_section IN ('ratelimits', 'all') THEN
    LOOP
      WITH batch AS (
        SELECT ctid FROM public.rate_limit_attempts WHERE first_attempt_at < v_cutoff LIMIT v_batch_size
      )
      DELETE FROM public.rate_limit_attempts t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_result := jsonb_set(v_result, '{rate_limit_attempts}', to_jsonb(COALESCE((v_result->>'rate_limit_attempts')::integer, 0) + v_deleted), true);
    END LOOP;
  END IF;

  IF v_section IN ('notifications', 'all') THEN
    LOOP
      WITH expired_messages AS (
        SELECT id FROM public.admin_messages WHERE expires_at < v_now LIMIT v_batch_size
      ), deleted_recipients AS (
        DELETE FROM public.admin_message_recipients r
        USING expired_messages em
        WHERE r.message_id = em.id
        RETURNING 1
      )
      SELECT COUNT(*) INTO v_deleted FROM deleted_recipients;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_result := jsonb_set(v_result, '{admin_message_recipients}', to_jsonb(COALESCE((v_result->>'admin_message_recipients')::integer, 0) + v_deleted), true);
    END LOOP;

    LOOP
      WITH batch AS (
        SELECT ctid FROM public.admin_messages WHERE expires_at < v_now LIMIT v_batch_size
      )
      DELETE FROM public.admin_messages t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_result := jsonb_set(v_result, '{admin_messages}', to_jsonb(COALESCE((v_result->>'admin_messages')::integer, 0) + v_deleted), true);
    END LOOP;

    LOOP
      WITH expired_notifications AS (
        SELECT id FROM public.global_notifications WHERE expires_at < v_now LIMIT v_batch_size
      ), deleted_recipients AS (
        DELETE FROM public.global_notification_recipients r
        USING expired_notifications en
        WHERE r.notification_id = en.id
        RETURNING 1
      )
      SELECT COUNT(*) INTO v_deleted FROM deleted_recipients;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_result := jsonb_set(v_result, '{global_notification_recipients}', to_jsonb(COALESCE((v_result->>'global_notification_recipients')::integer, 0) + v_deleted), true);
    END LOOP;

    LOOP
      WITH batch AS (
        SELECT ctid FROM public.global_notifications WHERE expires_at < v_now LIMIT v_batch_size
      )
      DELETE FROM public.global_notifications t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_result := jsonb_set(v_result, '{global_notifications}', to_jsonb(COALESCE((v_result->>'global_notifications')::integer, 0) + v_deleted), true);
    END LOOP;

    LOOP
      WITH batch AS (
        SELECT ctid FROM public.admin_realtime_messages WHERE expires_at < v_now LIMIT v_batch_size
      )
      DELETE FROM public.admin_realtime_messages t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_result := jsonb_set(v_result, '{admin_realtime_messages}', to_jsonb(COALESCE((v_result->>'admin_realtime_messages')::integer, 0) + v_deleted), true);
    END LOOP;

    LOOP
      WITH batch AS (
        SELECT ctid FROM public.user_direct_messages WHERE expires_at < v_now LIMIT v_batch_size
      )
      DELETE FROM public.user_direct_messages t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_result := jsonb_set(v_result, '{user_direct_messages}', to_jsonb(COALESCE((v_result->>'user_direct_messages')::integer, 0) + v_deleted), true);
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'section', v_section,
    'total_deleted', v_total_deleted,
    'deleted_by_table', v_result
  );
END;
$$;