SELECT cron.schedule(
  'auto-generate-and-publish',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://oxawvjcckmbevjztyfgp.supabase.co/functions/v1/auto-generate-scheduled',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94YXd2amNja21iZXZqenR5ZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NjQ5MzksImV4cCI6MjA2MzQ0MDkzOX0.N3iIA9YoJgN2X43uy_pyXu5YLLsAnoILG1vTF5THSNE"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) AS request_id;
  $$
);