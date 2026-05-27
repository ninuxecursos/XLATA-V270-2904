CREATE OR REPLACE FUNCTION public.get_system_cleanup_metrics(p_retention_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_cutoff timestamptz := now() - make_interval(days => GREATEST(COALESCE(p_retention_days, 30), 0));
  v_now timestamptz := now();
  v_presence_cutoff timestamptz := now() - interval '15 minutes';
  v_table_sizes jsonb;
  v_table_counts jsonb := '{}'::jsonb;
  v_reltuples jsonb;

  -- helper macro substitute
  v_count bigint;
  v_est bigint;

  -- list of tables/filter pairs
  TYPE_CFG record;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  -- Aumenta timeout local da função (em ms)
  PERFORM set_config('statement_timeout', '60000', true);

  -- Pega tamanhos e estimativas de linhas em UMA query
  SELECT
    COALESCE(jsonb_object_agg(c.relname, pg_total_relation_size(c.oid)), '{}'::jsonb),
    COALESCE(jsonb_object_agg(c.relname, GREATEST(c.reltuples::bigint, 0)), '{}'::jsonb)
  INTO v_table_sizes, v_reltuples
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname IN (
      'audit_log','admin_access_logs','admin_audit_logs','employee_action_logs',
      'active_sessions','pdv_sessions','unidade_sessions','user_presence',
      'rate_limit_attempts',
      'admin_messages','admin_message_recipients',
      'global_notifications','global_notification_recipients',
      'admin_realtime_messages','user_direct_messages'
    );

  -- Função inline: para cada tabela, se reltuples=0, count=0; senão executa COUNT exato com filtro
  -- audit_log
  v_est := COALESCE((v_reltuples->>'audit_log')::bigint, 0);
  IF v_est = 0 THEN v_count := 0;
  ELSE SELECT COUNT(*) INTO v_count FROM public.audit_log WHERE created_at < v_cutoff;
  END IF;
  v_table_counts := v_table_counts || jsonb_build_object('audit_log', v_count);

  v_est := COALESCE((v_reltuples->>'admin_access_logs')::bigint, 0);
  IF v_est = 0 THEN v_count := 0;
  ELSE SELECT COUNT(*) INTO v_count FROM public.admin_access_logs WHERE created_at < v_cutoff;
  END IF;
  v_table_counts := v_table_counts || jsonb_build_object('admin_access_logs', v_count);

  v_est := COALESCE((v_reltuples->>'admin_audit_logs')::bigint, 0);
  IF v_est = 0 THEN v_count := 0;
  ELSE SELECT COUNT(*) INTO v_count FROM public.admin_audit_logs WHERE created_at < v_cutoff;
  END IF;
  v_table_counts := v_table_counts || jsonb_build_object('admin_audit_logs', v_count);

  v_est := COALESCE((v_reltuples->>'employee_action_logs')::bigint, 0);
  IF v_est = 0 THEN v_count := 0;
  ELSE SELECT COUNT(*) INTO v_count FROM public.employee_action_logs WHERE created_at < v_cutoff;
  END IF;
  v_table_counts := v_table_counts || jsonb_build_object('employee_action_logs', v_count);

  v_est := COALESCE((v_reltuples->>'active_sessions')::bigint, 0);
  IF v_est = 0 THEN v_count := 0;
  ELSE SELECT COUNT(*) INTO v_count FROM public.active_sessions WHERE is_active = false;
  END IF;
  v_table_counts := v_table_counts || jsonb_build_object('active_sessions', v_count);

  v_est := COALESCE((v_reltuples->>'pdv_sessions')::bigint, 0);
  IF v_est = 0 THEN v_count := 0;
  ELSE SELECT COUNT(*) INTO v_count FROM public.pdv_sessions WHERE is_active = false;
  END IF;
  v_table_counts := v_table_counts || jsonb_build_object('pdv_sessions', v_count);

  v_est := COALESCE((v_reltuples->>'unidade_sessions')::bigint, 0);
  IF v_est = 0 THEN v_count := 0;
  ELSE SELECT COUNT(*) INTO v_count FROM public.unidade_sessions WHERE is_active = false;
  END IF;
  v_table_counts := v_table_counts || jsonb_build_object('unidade_sessions', v_count);

  v_est := COALESCE((v_reltuples->>'user_presence')::bigint, 0);
  IF v_est = 0 THEN v_count := 0;
  ELSE SELECT COUNT(*) INTO v_count FROM public.user_presence WHERE last_seen_at < v_presence_cutoff;
  END IF;
  v_table_counts := v_table_counts || jsonb_build_object('user_presence', v_count);

  v_est := COALESCE((v_reltuples->>'rate_limit_attempts')::bigint, 0);
  IF v_est = 0 THEN v_count := 0;
  ELSE SELECT COUNT(*) INTO v_count FROM public.rate_limit_attempts WHERE first_attempt_at < v_cutoff;
  END IF;
  v_table_counts := v_table_counts || jsonb_build_object('rate_limit_attempts', v_count);

  v_est := COALESCE((v_reltuples->>'admin_messages')::bigint, 0);
  IF v_est = 0 THEN v_count := 0;
  ELSE SELECT COUNT(*) INTO v_count FROM public.admin_messages WHERE expires_at < v_now;
  END IF;
  v_table_counts := v_table_counts || jsonb_build_object('admin_messages', v_count);

  -- Para tabelas de destinatários: se base/recipients vazios, devolve 0
  v_est := COALESCE((v_reltuples->>'admin_message_recipients')::bigint, 0);
  IF v_est = 0 THEN v_count := 0;
  ELSE
    SELECT COUNT(*) INTO v_count
    FROM public.admin_message_recipients amr
    JOIN public.admin_messages am ON am.id = amr.message_id
    WHERE am.expires_at < v_now;
  END IF;
  v_table_counts := v_table_counts || jsonb_build_object('admin_message_recipients', v_count);

  v_est := COALESCE((v_reltuples->>'global_notifications')::bigint, 0);
  IF v_est = 0 THEN v_count := 0;
  ELSE SELECT COUNT(*) INTO v_count FROM public.global_notifications WHERE expires_at < v_now;
  END IF;
  v_table_counts := v_table_counts || jsonb_build_object('global_notifications', v_count);

  v_est := COALESCE((v_reltuples->>'global_notification_recipients')::bigint, 0);
  IF v_est = 0 THEN v_count := 0;
  ELSE
    SELECT COUNT(*) INTO v_count
    FROM public.global_notification_recipients gnr
    JOIN public.global_notifications gn ON gn.id = gnr.notification_id
    WHERE gn.expires_at < v_now;
  END IF;
  v_table_counts := v_table_counts || jsonb_build_object('global_notification_recipients', v_count);

  v_est := COALESCE((v_reltuples->>'admin_realtime_messages')::bigint, 0);
  IF v_est = 0 THEN v_count := 0;
  ELSE SELECT COUNT(*) INTO v_count FROM public.admin_realtime_messages WHERE expires_at < v_now;
  END IF;
  v_table_counts := v_table_counts || jsonb_build_object('admin_realtime_messages', v_count);

  v_est := COALESCE((v_reltuples->>'user_direct_messages')::bigint, 0);
  IF v_est = 0 THEN v_count := 0;
  ELSE SELECT COUNT(*) INTO v_count FROM public.user_direct_messages WHERE expires_at < v_now;
  END IF;
  v_table_counts := v_table_counts || jsonb_build_object('user_direct_messages', v_count);

  RETURN jsonb_build_object(
    'counts', jsonb_build_object(
      'logs', COALESCE((v_table_counts->>'audit_log')::bigint,0)
            + COALESCE((v_table_counts->>'admin_access_logs')::bigint,0)
            + COALESCE((v_table_counts->>'admin_audit_logs')::bigint,0)
            + COALESCE((v_table_counts->>'employee_action_logs')::bigint,0),
      'sessions', COALESCE((v_table_counts->>'active_sessions')::bigint,0)
                + COALESCE((v_table_counts->>'pdv_sessions')::bigint,0)
                + COALESCE((v_table_counts->>'unidade_sessions')::bigint,0)
                + COALESCE((v_table_counts->>'user_presence')::bigint,0),
      'ratelimits', COALESCE((v_table_counts->>'rate_limit_attempts')::bigint,0),
      'notifications', COALESCE((v_table_counts->>'admin_messages')::bigint,0)
                     + COALESCE((v_table_counts->>'global_notifications')::bigint,0)
                     + COALESCE((v_table_counts->>'admin_realtime_messages')::bigint,0)
                     + COALESCE((v_table_counts->>'user_direct_messages')::bigint,0)
    ),
    'table_counts', v_table_counts,
    'table_sizes', v_table_sizes
  );
END;
$function$;