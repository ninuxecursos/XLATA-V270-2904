-- Remove existing copies if re-running
DO $$
DECLARE j text;
BEGIN
  FOR j IN SELECT jobname FROM cron.job
    WHERE jobname IN ('discover-keywords-weekly','growth-engine-daily','check-google-ranking-daily','smart-audit-weekly')
  LOOP
    PERFORM cron.unschedule(j);
  END LOOP;
END $$;

-- 1. Discover keywords - every Monday at 03:00
SELECT cron.schedule(
  'discover-keywords-weekly',
  '0 3 * * 1',
  $$
  SELECT net.http_post(
    url:='https://oxawvjcckmbevjztyfgp.supabase.co/functions/v1/discover-keywords',
    headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94YXd2amNja21iZXZqenR5ZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NjQ5MzksImV4cCI6MjA2MzQ0MDkzOX0.N3iIA9YoJgN2X43uy_pyXu5YLLsAnoILG1vTF5THSNE"}'::jsonb,
    body:='{"trigger":"cron"}'::jsonb
  );
  $$
);

-- 2. Growth engine - daily at 04:00
SELECT cron.schedule(
  'growth-engine-daily',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url:='https://oxawvjcckmbevjztyfgp.supabase.co/functions/v1/growth-engine',
    headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94YXd2amNja21iZXZqenR5ZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NjQ5MzksImV4cCI6MjA2MzQ0MDkzOX0.N3iIA9YoJgN2X43uy_pyXu5YLLsAnoILG1vTF5THSNE"}'::jsonb,
    body:='{"trigger":"cron"}'::jsonb
  );
  $$
);

-- 3. Check Google ranking - daily at 05:00
SELECT cron.schedule(
  'check-google-ranking-daily',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url:='https://oxawvjcckmbevjztyfgp.supabase.co/functions/v1/check-google-ranking',
    headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94YXd2amNja21iZXZqenR5ZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NjQ5MzksImV4cCI6MjA2MzQ0MDkzOX0.N3iIA9YoJgN2X43uy_pyXu5YLLsAnoILG1vTF5THSNE"}'::jsonb,
    body:='{"trigger":"cron"}'::jsonb
  );
  $$
);

-- 4. Smart audit - every Sunday at 06:00
SELECT cron.schedule(
  'smart-audit-weekly',
  '0 6 * * 0',
  $$
  SELECT net.http_post(
    url:='https://oxawvjcckmbevjztyfgp.supabase.co/functions/v1/smart-audit',
    headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94YXd2amNja21iZXZqenR5ZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NjQ5MzksImV4cCI6MjA2MzQ0MDkzOX0.N3iIA9YoJgN2X43uy_pyXu5YLLsAnoILG1vTF5THSNE"}'::jsonb,
    body:='{"trigger":"cron"}'::jsonb
  );
  $$
);