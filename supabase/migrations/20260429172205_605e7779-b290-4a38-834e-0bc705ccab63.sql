-- Schedule article jobs cron (every minute)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-article-jobs-every-minute') THEN
    PERFORM cron.unschedule('process-article-jobs-every-minute');
  END IF;
END $$;

SELECT cron.schedule(
  'process-article-jobs-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://oxawvjcckmbevjztyfgp.supabase.co/functions/v1/process-article-jobs-cron',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94YXd2amNja21iZXZqenR5ZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NjQ5MzksImV4cCI6MjA2MzQ0MDkzOX0.N3iIA9YoJgN2X43uy_pyXu5YLLsAnoILG1vTF5THSNE"}'::jsonb,
    body := jsonb_build_object('triggered_at', now())
  ) AS request_id;
  $$
);