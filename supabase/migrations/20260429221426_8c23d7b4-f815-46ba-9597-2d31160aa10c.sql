CREATE OR REPLACE FUNCTION public.cleanup_system_table(
  p_table text,
  p_retention_days integer DEFAULT 30,
  p_batch_size integer DEFAULT 2000,
  p_max_batches integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cutoff timestamptz := now() - make_interval(days => GREATEST(COALESCE(p_retention_days, 30), 0));
  v_now timestamptz := now();
  v_presence_cutoff timestamptz := now() - interval '15 minutes';
  v_batch_size integer := GREATEST(COALESCE(p_batch_size, 2000), 100);
  v_max_batches integer := GREATEST(COALESCE(p_max_batches, 20), 1);
  v_batches_done integer := 0;
  v_deleted integer;
  v_total_deleted integer := 0;
  v_table text := lower(COALESCE(p_table, ''));
  v_has_more boolean := false;
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

  -- Aumentar timeout interno para evitar cancelamento em tabelas grandes
  SET LOCAL statement_timeout = '180s';
  SET LOCAL lock_timeout = '5s';

  IF v_table IN ('audit_log','admin_access_logs','admin_audit_logs','employee_action_logs') THEN
    LOOP
      EXECUTE format('WITH batch AS (SELECT ctid FROM public.%I WHERE created_at < $1 LIMIT $2) DELETE FROM public.%I t USING batch WHERE t.ctid = batch.ctid', v_table, v_table)
        USING v_cutoff, v_batch_size;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_batches_done := v_batches_done + 1;
      IF v_batches_done >= v_max_batches THEN
        v_has_more := true;
        EXIT;
      END IF;
    END LOOP;

  ELSIF v_table IN ('active_sessions','pdv_sessions','unidade_sessions') THEN
    LOOP
      EXECUTE format('WITH batch AS (SELECT ctid FROM public.%I WHERE is_active = false LIMIT $1) DELETE FROM public.%I t USING batch WHERE t.ctid = batch.ctid', v_table, v_table)
        USING v_batch_size;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_batches_done := v_batches_done + 1;
      IF v_batches_done >= v_max_batches THEN
        v_has_more := true;
        EXIT;
      END IF;
    END LOOP;

  ELSIF v_table = 'user_presence' THEN
    LOOP
      WITH batch AS (SELECT ctid FROM public.user_presence WHERE last_seen_at < v_presence_cutoff LIMIT v_batch_size)
      DELETE FROM public.user_presence t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_batches_done := v_batches_done + 1;
      IF v_batches_done >= v_max_batches THEN
        v_has_more := true;
        EXIT;
      END IF;
    END LOOP;

  ELSIF v_table = 'rate_limit_attempts' THEN
    LOOP
      WITH batch AS (SELECT ctid FROM public.rate_limit_attempts WHERE first_attempt_at < v_cutoff LIMIT v_batch_size)
      DELETE FROM public.rate_limit_attempts t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_batches_done := v_batches_done + 1;
      IF v_batches_done >= v_max_batches THEN
        v_has_more := true;
        EXIT;
      END IF;
    END LOOP;

  ELSIF v_table IN ('admin_messages','global_notifications','admin_realtime_messages','user_direct_messages') THEN
    LOOP
      EXECUTE format('WITH batch AS (SELECT ctid FROM public.%I WHERE expires_at < $1 LIMIT $2) DELETE FROM public.%I t USING batch WHERE t.ctid = batch.ctid', v_table, v_table)
        USING v_now, v_batch_size;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_batches_done := v_batches_done + 1;
      IF v_batches_done >= v_max_batches THEN
        v_has_more := true;
        EXIT;
      END IF;
    END LOOP;

  ELSIF v_table = 'admin_message_recipients' THEN
    LOOP
      WITH batch AS (
        SELECT amr.ctid FROM public.admin_message_recipients amr
        JOIN public.admin_messages am ON am.id = amr.message_id
        WHERE am.expires_at < v_now
        LIMIT v_batch_size
      )
      DELETE FROM public.admin_message_recipients t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_batches_done := v_batches_done + 1;
      IF v_batches_done >= v_max_batches THEN
        v_has_more := true;
        EXIT;
      END IF;
    END LOOP;

  ELSIF v_table = 'global_notification_recipients' THEN
    LOOP
      WITH batch AS (
        SELECT gnr.ctid FROM public.global_notification_recipients gnr
        JOIN public.global_notifications gn ON gn.id = gnr.notification_id
        WHERE gn.expires_at < v_now
        LIMIT v_batch_size
      )
      DELETE FROM public.global_notification_recipients t USING batch WHERE t.ctid = batch.ctid;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      EXIT WHEN v_deleted = 0;
      v_total_deleted := v_total_deleted + v_deleted;
      v_batches_done := v_batches_done + 1;
      IF v_batches_done >= v_max_batches THEN
        v_has_more := true;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'table', v_table,
    'total_deleted', v_total_deleted,
    'has_more', v_has_more,
    'batches_done', v_batches_done
  );
END;
$function$;

-- Atualiza cleanup_system_data para também aceitar p_max_batches e timeout maior
CREATE OR REPLACE FUNCTION public.cleanup_system_data(
  p_section text,
  p_retention_days integer DEFAULT 30,
  p_batch_size integer DEFAULT 2000,
  p_max_batches integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_section text := lower(COALESCE(p_section, ''));
  v_total integer := 0;
  v_has_more boolean := false;
  v_result jsonb := '{}'::jsonb;
  v_tables text[];
  v_tbl text;
  v_one jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF v_section NOT IN ('logs', 'sessions', 'ratelimits', 'notifications', 'all') THEN
    RAISE EXCEPTION 'Seção inválida: %', p_section;
  END IF;

  IF v_section IN ('logs','all') THEN
    v_tables := array_cat(v_tables, ARRAY['audit_log','admin_access_logs','admin_audit_logs','employee_action_logs']);
  END IF;
  IF v_section IN ('sessions','all') THEN
    v_tables := array_cat(v_tables, ARRAY['active_sessions','pdv_sessions','unidade_sessions','user_presence']);
  END IF;
  IF v_section IN ('ratelimits','all') THEN
    v_tables := array_cat(v_tables, ARRAY['rate_limit_attempts']);
  END IF;
  IF v_section IN ('notifications','all') THEN
    v_tables := array_cat(v_tables, ARRAY['admin_messages','admin_message_recipients','global_notifications','global_notification_recipients','admin_realtime_messages','user_direct_messages']);
  END IF;

  FOREACH v_tbl IN ARRAY v_tables LOOP
    v_one := public.cleanup_system_table(v_tbl, p_retention_days, p_batch_size, p_max_batches);
    v_total := v_total + COALESCE((v_one->>'total_deleted')::int, 0);
    IF COALESCE((v_one->>'has_more')::boolean, false) THEN
      v_has_more := true;
    END IF;
    v_result := jsonb_set(v_result, ARRAY[v_tbl], to_jsonb(COALESCE((v_one->>'total_deleted')::int, 0)));
  END LOOP;

  RETURN jsonb_build_object(
    'section', v_section,
    'total_deleted', v_total,
    'has_more', v_has_more,
    'per_table', v_result
  );
END;
$function$;