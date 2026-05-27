CREATE OR REPLACE FUNCTION public.cleanup_system_table(
  p_table text,
  p_retention_days integer DEFAULT 30,
  p_batch_size integer DEFAULT 5000
)
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
  v_table text := lower(COALESCE(p_table, ''));
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF v_table NOT IN (
    'audit_log','admin_access_logs','admin_audit_logs','employee_action_logs',
    'active_sessions','pdv_sessions','unidade_sessions','user_presence',
    'rate_limit_attempts',
    'admin_messages','admin_message_recipients',
    'global_notifications','global_notification_recipients',
    'admin_realtime_messages','user_direct_messages'
  ) THEN
    RAISE EXCEPTION 'Tabela não permitida: %', p_table;
  END IF;

  -- Logs (filtro por created_at)
  IF v_table IN ('audit_log','admin_access_logs','admin_audit_logs','employee_action_logs') THEN
    LOOP
      EXECUTE format('WITH batch AS (SELECT ctid FROM public.%I WHERE created_at < $1 LIMIT $2) DELETE FROM public.%I t USING batch WHERE t.ctid = batch.ctid', v_table, v_table)
        USING v_cutoff, v_batch_size;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
    END LOOP;

  -- Sessões inativas
  ELSIF v_table IN ('active_sessions','pdv_sessions','unidade_sessions') THEN
    LOOP
      EXECUTE format('WITH batch AS (SELECT ctid FROM public.%I WHERE is_active = false LIMIT $1) DELETE FROM public.%I t USING batch WHERE t.ctid = batch.ctid', v_table, v_table)
        USING v_batch_size;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
    END LOOP;

  -- Presença antiga (last_seen_at)
  ELSIF v_table = 'user_presence' THEN
    LOOP
      WITH batch AS (
        SELECT ctid FROM public.user_presence WHERE last_seen_at < v_cutoff LIMIT v_batch_size
      )
      DELETE FROM public.user_presence t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
    END LOOP;

  -- Rate limits (first_attempt_at)
  ELSIF v_table = 'rate_limit_attempts' THEN
    LOOP
      WITH batch AS (
        SELECT ctid FROM public.rate_limit_attempts WHERE first_attempt_at < v_cutoff LIMIT v_batch_size
      )
      DELETE FROM public.rate_limit_attempts t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
    END LOOP;

  -- Notificações expiradas (expires_at)
  ELSIF v_table IN ('admin_messages','global_notifications','admin_realtime_messages','user_direct_messages') THEN
    LOOP
      EXECUTE format('WITH batch AS (SELECT ctid FROM public.%I WHERE expires_at < $1 LIMIT $2) DELETE FROM public.%I t USING batch WHERE t.ctid = batch.ctid', v_table, v_table)
        USING v_now, v_batch_size;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
    END LOOP;

  -- Recipients (via join com tabela pai já expirada)
  ELSIF v_table = 'admin_message_recipients' THEN
    LOOP
      WITH batch AS (
        SELECT amr.ctid FROM public.admin_message_recipients amr
        WHERE EXISTS (SELECT 1 FROM public.admin_messages am WHERE am.id = amr.message_id AND am.expires_at < v_now)
        LIMIT v_batch_size
      )
      DELETE FROM public.admin_message_recipients t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
    END LOOP;

  ELSIF v_table = 'global_notification_recipients' THEN
    LOOP
      WITH batch AS (
        SELECT gnr.ctid FROM public.global_notification_recipients gnr
        WHERE EXISTS (SELECT 1 FROM public.global_notifications gn WHERE gn.id = gnr.notification_id AND gn.expires_at < v_now)
        LIMIT v_batch_size
      )
      DELETE FROM public.global_notification_recipients t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('table', v_table, 'total_deleted', v_total_deleted);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_system_table(text, integer, integer) TO authenticated;