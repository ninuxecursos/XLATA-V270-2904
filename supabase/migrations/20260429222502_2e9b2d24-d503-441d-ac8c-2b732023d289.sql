-- Reagendar descoberta de keywords para diária
SELECT cron.unschedule('discover-keywords-weekly') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'discover-keywords-weekly');

SELECT cron.schedule(
  'discover-keywords-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://oxawvjcckmbevjztyfgp.supabase.co/functions/v1/discover-keywords',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('action', 'discover')
  ) AS request_id;
  $$
);