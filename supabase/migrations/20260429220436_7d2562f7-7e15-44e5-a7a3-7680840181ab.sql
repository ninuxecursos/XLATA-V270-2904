DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'seo-optimizer-hourly') THEN
    PERFORM cron.unschedule('seo-optimizer-hourly');
  END IF;
END $$;

SELECT cron.schedule(
  'seo-optimizer-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://oxawvjcckmbevjztyfgp.supabase.co/functions/v1/seo-optimizer',
    headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94YXd2amNja21iZXZqenR5ZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NjQ5MzksImV4cCI6MjA2MzQ0MDkzOX0.N3iIA9YoJgN2X43uy_pyXu5YLLsAnoILG1vTF5THSNE"}'::jsonb,
    body:='{"action":"run_scheduled"}'::jsonb
  );
  $$
);